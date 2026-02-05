import argparse
import json
import os
from pathlib import Path
from typing import Dict, List

import chromadb


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


def normalize_metadata(meta: Dict) -> Dict:
    normalized: Dict = {}
    for key, value in meta.items():
        if value is None:
            continue
        if isinstance(value, (str, int, float, bool)):
            normalized[key] = value
        else:
            normalized[key] = json.dumps(value, ensure_ascii=False, default=str)
    return normalized


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


def export_vectors(persist_dir: Path, collection: str, out_path: Path) -> None:
    client = chromadb.PersistentClient(path=str(persist_dir))
    col = client.get_or_create_collection(name=collection)

    data = col.get(include=["documents", "metadatas", "embeddings"])
    docs = data.get("documents") or []
    metadatas = data.get("metadatas") or []
    embeddings_list = data.get("embeddings")
    if embeddings_list is None:
        embeddings_list = []
    ids = data.get("ids") or []

    vectors: List[Dict] = []
    for idx, doc in enumerate(docs):
        emb = embeddings_list[idx] if idx < len(embeddings_list) else None
        if emb is None:
            continue
        try:
            emb = emb.tolist()
        except AttributeError:
            pass
        meta = metadatas[idx] if idx < len(metadatas) else {}
        vectors.append(
            {
                "id": ids[idx] if idx < len(ids) else str(idx),
                "content": strip_frontmatter(doc or ""),
                "metadata": normalize_metadata(meta or {}),
                "embedding": emb,
            }
        )

    payload = {
        "embedding_model": os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
        "collection": collection,
        "count": len(vectors),
        "vectors": vectors,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"Exported {len(vectors)} vectors to {out_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Export Chroma vectors to JSON")
    parser.add_argument("--persist-dir", default="db/chroma", help="Chroma dir")
    parser.add_argument("--collection", default="kb_docs", help="Chroma collection")
    parser.add_argument("--out", default="db/kb_vectors.json", help="Output JSON path")
    parser.add_argument("--env-file", default=".env", help="Path to .env file")
    args = parser.parse_args()

    load_env_file(Path(args.env_file))
    export_vectors(Path(args.persist_dir), args.collection, Path(args.out))


if __name__ == "__main__":
    main()
