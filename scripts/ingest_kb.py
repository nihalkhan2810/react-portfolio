import argparse
import hashlib
import json
import logging
import os
import shutil
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Dict, Iterable, List, Tuple
import re

import tiktoken
import yaml
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import MarkdownHeaderTextSplitter, TokenTextSplitter
from langchain_chroma import Chroma


LOGGER = logging.getLogger("kb_ingest")
ENCODING_NAME = "cl100k_base"
ENCODER = tiktoken.get_encoding(ENCODING_NAME)
VALID_LAYERS = {"summary", "window", "section", "file"}
LAYER_RANK = {"summary": 0, "window": 1, "section": 2, "file": 3, "fallback": 4}


@dataclass(frozen=True)
class ChunkConfig:
    chunk_size: int
    chunk_overlap: int
    min_size: int


def setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=level, format="%(levelname)s %(message)s")


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def parse_frontmatter(text: str) -> Tuple[Dict, str]:
    text = text.lstrip("\ufeff")
    if not text.startswith("---"):
        return {}, text
    lines = text.splitlines()
    end_idx = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end_idx = i
            break
    if end_idx is None:
        return {}, text
    fm_text = "\n".join(lines[1:end_idx])
    body = "\n".join(lines[end_idx + 1 :]).lstrip()
    data = yaml.safe_load(fm_text) or {}
    if not isinstance(data, dict):
        data = {}
    return data, body


def iter_markdown_files(root: Path) -> Iterable[Path]:
    for path in root.rglob("*.md"):
        if path.is_file():
            yield path


def token_len(text: str) -> int:
    return len(ENCODER.encode(text))


def normalize_text_for_hash(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def content_hash(text: str) -> str:
    normalized = normalize_text_for_hash(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def normalize_metadata(meta: Dict) -> Dict:
    normalized: Dict = {}
    for key, value in meta.items():
        if value is None:
            continue
        if isinstance(value, (str, int, float, bool)):
            normalized[key] = value
        elif isinstance(value, (date, datetime)):
            normalized[key] = value.isoformat()
        else:
            normalized[key] = json.dumps(value, ensure_ascii=False, default=str)
    return normalized


def extract_sections(body: str) -> List[Tuple[str, str]]:
    header_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=[
            ("#", "h1"),
            ("##", "h2"),
            ("###", "h3"),
            ("####", "h4"),
            ("#####", "h5"),
            ("######", "h6"),
        ]
    )
    sections = header_splitter.split_text(body)
    if not sections:
        return [("Document", body)]

    extracted: List[Tuple[str, str]] = []
    for section in sections:
        section_text = section.page_content.strip()
        if not section_text:
            continue
        header_title = None
        for key in ("h6", "h5", "h4", "h3", "h2", "h1"):
            if key in section.metadata:
                header_title = section.metadata[key]
                break
        extracted.append((header_title or "Section", section_text))

    return extracted or [("Document", body)]


def build_documents(
    kb_root: Path,
    file_path: Path,
    frontmatter: Dict,
    body: str,
    chunk_cfg: ChunkConfig,
    allow_short_files: bool,
) -> List[Document]:
    docs: List[Document] = []
    seen_hashes: set[str] = set()
    rel_path = file_path.relative_to(kb_root)
    topic = rel_path.parts[0] if len(rel_path.parts) > 1 else "kb"
    doc_type = frontmatter.get("doc_type") or topic
    is_summary = doc_type == "summary" or file_path.stem.lower() == "summary"
    base_meta = {
        "source_path": str(rel_path.as_posix()),
        "doc_type": doc_type,
        "title": frontmatter.get("title"),
        "id": frontmatter.get("id"),
        "topic": topic,
        "file_stem": file_path.stem,
    }
    base_meta.update(frontmatter)
    base_meta = normalize_metadata(base_meta)

    def add_doc(content: str, layer: str, extra_meta: Dict, enforce_min_size: bool) -> None:
        if not content.strip():
            return
        if enforce_min_size and token_len(content) < chunk_cfg.min_size:
            return
        fingerprint = content_hash(content)
        if fingerprint in seen_hashes:
            return
        seen_hashes.add(fingerprint)
        layer_rank = LAYER_RANK.get(layer, 9)
        docs.append(
            Document(
                page_content=content,
                metadata={
                    **base_meta,
                    **extra_meta,
                    "layer": layer,
                    "layer_rank": layer_rank,
                    "content_hash": fingerprint,
                },
            )
        )

    if is_summary:
        add_doc(
            body,
            "summary",
            {"chunk_index": 0, "retrieval_tier": "summary"},
            enforce_min_size=False,
        )
        return docs

    sections = extract_sections(body)

    # Sliding window chunks (primary retrieval layer) per section
    splitter = TokenTextSplitter(
        chunk_size=chunk_cfg.chunk_size,
        chunk_overlap=chunk_cfg.chunk_overlap,
        encoding_name=ENCODING_NAME,
    )
    window_index = 0
    for section_index, (section_title, section_text) in enumerate(sections):
        for local_index, chunk in enumerate(splitter.split_text(section_text)):
            add_doc(
                chunk,
                "window",
                {
                    "chunk_index": window_index,
                    "section_index": section_index,
                    "section_title": section_title,
                    "window_index": local_index,
                    "retrieval_tier": "primary",
                },
                enforce_min_size=True,
            )
            window_index += 1

    # Section-level documents (secondary layer)
    for section_index, (section_title, section_text) in enumerate(sections):
        add_doc(
            section_text,
            "section",
            {
                "section_title": section_title,
                "chunk_index": section_index,
                "retrieval_tier": "secondary",
            },
            enforce_min_size=True,
        )

    # File-level macro document (tertiary layer)
    add_doc(
        body,
        "file",
        {"chunk_index": 0, "retrieval_tier": "tertiary"},
        enforce_min_size=not allow_short_files,
    )

    return docs


def ingest(
    kb_dir: Path,
    persist_dir: Path,
    collection: str,
    chunk_cfg: ChunkConfig,
    store_layers: set[str],
    allow_file_fallback: bool,
    allow_short_files: bool,
) -> None:
    all_docs: List[Document] = []
    paths = sorted(iter_markdown_files(kb_dir))
    total_files = len(paths)
    LOGGER.info("Processing %d markdown files", total_files)
    for idx, path in enumerate(paths, start=1):
        LOGGER.info("(%d/%d) %s", idx, total_files, path)
        text = read_text(path)
        frontmatter, body = parse_frontmatter(text)
        if not body.strip():
            LOGGER.warning("Skipping empty body: %s", path)
            continue
        docs = build_documents(kb_dir, path, frontmatter, body, chunk_cfg, allow_short_files)
        filtered_docs = [doc for doc in docs if doc.metadata.get("layer") in store_layers]
        if not filtered_docs and allow_file_fallback:
            file_doc = next((doc for doc in docs if doc.metadata.get("layer") == "file"), None)
            if file_doc is not None:
                file_doc.metadata["retrieval_tier"] = "fallback"
                file_doc.metadata["layer_rank"] = LAYER_RANK["fallback"]
                file_doc.metadata["short_file_fallback"] = True
                filtered_docs.append(file_doc)
        all_docs.extend(filtered_docs)
        LOGGER.info(
            "Loaded %s (raw %d docs, stored %d)",
            path,
            len(docs),
            len(filtered_docs),
        )

    LOGGER.info("Total documents: %d", len(all_docs))
    if not all_docs:
        LOGGER.warning("No documents found under %s", kb_dir)
        return

    embeddings = OpenAIEmbeddings(model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"))
    if not re.match(r"^[a-zA-Z0-9][a-zA-Z0-9._-]{1,510}[a-zA-Z0-9]$", collection):
        raise SystemExit(
            f"Invalid collection name: {collection}. "
            "Use 3-512 chars [a-zA-Z0-9._-], starting and ending with alnum."
        )

    vectordb = Chroma(
        collection_name=collection,
        embedding_function=embeddings,
        persist_directory=str(persist_dir),
    )
    vectordb.add_documents(all_docs)
    persisted = False
    if hasattr(vectordb, "persist"):
        vectordb.persist()
        persisted = True
    elif hasattr(vectordb, "_client") and hasattr(vectordb._client, "persist"):
        vectordb._client.persist()
        persisted = True

    if persisted:
        LOGGER.info("Chroma persisted at %s", persist_dir)
    else:
        LOGGER.info("Chroma persistence handled automatically at %s", persist_dir)


def validate_chunk_config(chunk_cfg: ChunkConfig) -> None:
    if not 400 <= chunk_cfg.chunk_size <= 600:
        LOGGER.warning("chunk_size=%s is outside the 400-600 guideline", chunk_cfg.chunk_size)
    if not 80 <= chunk_cfg.chunk_overlap <= 120:
        LOGGER.warning(
            "chunk_overlap=%s is outside the 80-120 guideline", chunk_cfg.chunk_overlap
        )
    if chunk_cfg.min_size < 150:
        LOGGER.warning("min_size=%s is below the 150 guideline", chunk_cfg.min_size)


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest kb markdown into Chroma")
    parser.add_argument("--kb-dir", default="kb", help="Path to kb directory")
    parser.add_argument("--persist-dir", default="db/chroma", help="Chroma dir")
    parser.add_argument("--collection", default="kb_docs", help="Chroma collection")
    parser.add_argument("--chunk-size", type=int, default=500)
    parser.add_argument("--chunk-overlap", type=int, default=100)
    parser.add_argument("--min-size", type=int, default=150)
    parser.add_argument("--env-file", default=".env", help="Path to .env file")
    parser.add_argument(
        "--store-layers",
        default="summary,window,section",
        help="Comma-separated layers to store: summary,window,section,file",
    )
    parser.add_argument(
        "--allow-file-fallback",
        action="store_true",
        help="If a file yields no stored chunks, store its file-level doc as fallback.",
    )
    parser.add_argument(
        "--allow-short-files",
        action="store_true",
        help="Allow file-level docs below min_size (useful for short notes).",
    )
    parser.add_argument("--reset", action="store_true", help="Delete persist dir")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    setup_logging(args.verbose)
    load_env_file(Path(args.env_file))

    if args.reset and Path(args.persist_dir).exists():
        LOGGER.warning("Resetting %s", args.persist_dir)
        shutil.rmtree(args.persist_dir)

    if not os.getenv("OPENAI_API_KEY"):
        raise SystemExit(
            "OPENAI_API_KEY is not set. "
            "Set it in your shell environment or .env file before running."
        )

    chunk_cfg = ChunkConfig(
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap,
        min_size=args.min_size,
    )
    validate_chunk_config(chunk_cfg)
    if not Path(args.kb_dir).exists():
        raise SystemExit(f"kb_dir not found: {args.kb_dir}")
    requested_layers = {layer.strip().lower() for layer in args.store_layers.split(",")}
    if not requested_layers.issubset(VALID_LAYERS):
        invalid = ", ".join(sorted(requested_layers - VALID_LAYERS))
        raise SystemExit(f"Invalid layer(s): {invalid}. Valid: {', '.join(sorted(VALID_LAYERS))}")
    ingest(
        Path(args.kb_dir),
        Path(args.persist_dir),
        args.collection,
        chunk_cfg,
        requested_layers,
        args.allow_file_fallback,
        args.allow_short_files,
    )


if __name__ == "__main__":
    main()
