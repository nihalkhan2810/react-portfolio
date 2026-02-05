import argparse
import json
import logging
import os
from pathlib import Path
from typing import Dict, List, Optional

from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings


LOGGER = logging.getLogger("kb_retrieve")
SUMMARY_TRIGGERS = (
    "summarize",
    "summary",
    "overview",
    "who are you",
    "about you",
    "tell me about yourself",
    "background",
)


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


def build_filter(
    topic: Optional[str],
    doc_type: Optional[str],
    layer: Optional[str],
    retrieval_tier: Optional[str],
) -> Dict:
    filters: Dict = {}
    if topic:
        filters["topic"] = topic
    if doc_type:
        filters["doc_type"] = doc_type
    if layer:
        filters["layer"] = layer
    if retrieval_tier:
        filters["retrieval_tier"] = retrieval_tier
    return filters


def strip_frontmatter(text: str) -> str:
    text = text.lstrip("\ufeff")
    if not text.startswith("---"):
        return text
    lines = text.splitlines()
    end_idx = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end_idx = i
            break
    if end_idx is None:
        return text
    return "\n".join(lines[end_idx + 1 :]).lstrip()


def is_summary_intent(query: str) -> bool:
    q = query.lower()
    return any(trigger in q for trigger in SUMMARY_TRIGGERS)


def normalize_score(distance: float, layer_rank: int, layer_bias: float) -> float:
    if layer_bias <= 0:
        return distance
    return distance + (layer_bias * (layer_rank / 10.0))


def retrieve(
    query: str,
    persist_dir: Path,
    collection: str,
    top_k: int,
    fetch_k: int,
    layer_bias: float,
    filters: Dict,
    dedupe: bool,
) -> List[Dict]:
    embeddings = OpenAIEmbeddings(model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"))
    vectordb = Chroma(
        collection_name=collection,
        embedding_function=embeddings,
        persist_directory=str(persist_dir),
    )

    results = vectordb.similarity_search_with_score(
        query,
        k=fetch_k,
        filter=filters or None,
    )

    scored: List[Dict] = []
    seen_hashes: set[str] = set()
    for doc, distance in results:
        metadata = doc.metadata or {}
        content_hash = metadata.get("content_hash")
        if dedupe and content_hash:
            if content_hash in seen_hashes:
                continue
            seen_hashes.add(content_hash)

        layer_rank = int(metadata.get("layer_rank", 9))
        adjusted = normalize_score(distance, layer_rank, layer_bias)
        scored.append(
            {
                "score": adjusted,
                "distance": distance,
                "layer_rank": layer_rank,
                "metadata": metadata,
                "content": strip_frontmatter(doc.page_content or ""),
            }
        )

    scored.sort(key=lambda x: x["score"])
    return scored[:top_k]


def main() -> None:
    parser = argparse.ArgumentParser(description="Retrieve from Chroma KB")
    parser.add_argument("--query", required=True, help="Search query")
    parser.add_argument("--persist-dir", default="db/chroma", help="Chroma dir")
    parser.add_argument("--collection", default="kb_docs", help="Chroma collection")
    parser.add_argument("--top-k", type=int, default=5, help="Number of results to return")
    parser.add_argument("--fetch-k", type=int, default=15, help="Number of candidates to fetch")
    parser.add_argument("--layer-bias", type=float, default=0.15, help="Penalty per layer rank")
    parser.add_argument("--topic", default=None, help="Filter by topic (about, projects, etc.)")
    parser.add_argument("--doc-type", default=None, help="Filter by doc_type")
    parser.add_argument("--layer", default=None, help="Filter by layer (summary, window, section)")
    parser.add_argument("--retrieval-tier", default=None, help="Filter by retrieval_tier")
    parser.add_argument("--env-file", default=".env", help="Path to .env file")
    parser.add_argument("--no-dedupe", action="store_true", help="Disable content_hash dedupe")
    parser.add_argument(
        "--auto-summary",
        action="store_true",
        help="If the query asks for a summary, prefer summary layer.",
    )
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    setup_logging(args.verbose)
    load_env_file(Path(args.env_file))

    if not os.getenv("OPENAI_API_KEY"):
        raise SystemExit(
            "OPENAI_API_KEY is not set. "
            "Set it in your shell environment or .env file before running."
        )

    layer = args.layer
    if args.auto_summary and not layer and is_summary_intent(args.query):
        layer = "summary"
    filters = build_filter(args.topic, args.doc_type, layer, args.retrieval_tier)
    items = retrieve(
        query=args.query,
        persist_dir=Path(args.persist_dir),
        collection=args.collection,
        top_k=args.top_k,
        fetch_k=max(args.fetch_k, args.top_k),
        layer_bias=args.layer_bias,
        filters=filters,
        dedupe=not args.no_dedupe,
    )

    if args.json:
        print(json.dumps(items, ensure_ascii=False, indent=2))
        return

    for idx, item in enumerate(items, start=1):
        meta = item["metadata"]
        print(f"\n[{idx}] score={item['score']:.4f} dist={item['distance']:.4f} layer={meta.get('layer')}")
        print(f"    topic={meta.get('topic')} doc_type={meta.get('doc_type')} title={meta.get('title')}")
        print(f"    source={meta.get('source_path')} section={meta.get('section_title')}")
        print(f"    content: {item['content']}")


if __name__ == "__main__":
    main()
