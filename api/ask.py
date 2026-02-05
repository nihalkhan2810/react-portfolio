import json
import os
import re
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from http.server import BaseHTTPRequestHandler

import requests
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings


ROOT_DIR = Path(__file__).resolve().parents[1]
PERSIST_SRC = ROOT_DIR / "db" / "chroma"
PERSIST_DIR = Path(os.getenv("CHROMA_PERSIST_DIR", "/tmp/chroma"))
COLLECTION = os.getenv("CHROMA_COLLECTION", "kb_docs")
EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

LAYER_RANK = {"summary": 0, "window": 1, "section": 2, "file": 3, "fallback": 4}

VDB = None


def _ensure_persist_dir() -> Path:
    if PERSIST_DIR == PERSIST_SRC:
        return PERSIST_SRC
    if not PERSIST_DIR.exists():
        if not PERSIST_SRC.exists():
            raise FileNotFoundError(f"Chroma directory not found: {PERSIST_SRC}")
        shutil.copytree(PERSIST_SRC, PERSIST_DIR)
    return PERSIST_DIR


def _get_vectordb() -> Chroma:
    global VDB
    if VDB is not None:
        return VDB
    persist_dir = _ensure_persist_dir()
    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)
    VDB = Chroma(
        collection_name=COLLECTION,
        embedding_function=embeddings,
        persist_directory=str(persist_dir),
    )
    return VDB


def _strip_frontmatter(text: str) -> str:
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


def _normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def _infer_topic(query: str) -> Optional[str]:
    q = query.lower()
    if "project" in q:
        return "projects"
    if "experience" in q or "work" in q or "job" in q:
        return "experience"
    if "skill" in q or "stack" in q or "tool" in q:
        return "skills"
    if "education" in q or "degree" in q or "university" in q:
        return "about"
    if "research" in q or "paper" in q:
        return "research"
    return None


def _is_summary_intent(query: str) -> bool:
    q = query.lower()
    triggers = [
        "summarize",
        "summary",
        "overview",
        "who are you",
        "about you",
        "tell me about yourself",
        "background",
    ]
    return any(t in q for t in triggers)


def _build_filter(
    topic: Optional[str],
    layer: Optional[str],
    retrieval_tier: Optional[str],
) -> Dict:
    filters: Dict = {}
    if topic:
        filters["topic"] = topic
    if layer:
        filters["layer"] = layer
    if retrieval_tier:
        filters["retrieval_tier"] = retrieval_tier
    return filters


def _score(distance: float, layer_rank: int, layer_bias: float) -> float:
    return distance + (layer_bias * (layer_rank / 10.0))


def retrieve_context(
    query: str,
    top_k: int = 5,
    fetch_k: int = 15,
    layer_bias: float = 0.15,
) -> Tuple[List[Dict], List[str]]:
    vectordb = _get_vectordb()
    topic = _infer_topic(query)
    layer = "summary" if _is_summary_intent(query) else None
    filters = _build_filter(topic, layer, None) or None

    results = vectordb.similarity_search_with_score(
        query,
        k=fetch_k,
        filter=filters,
    )

    seen_hashes: set[str] = set()
    scored: List[Dict] = []
    for doc, distance in results:
        meta = doc.metadata or {}
        content_hash = meta.get("content_hash")
        if content_hash and content_hash in seen_hashes:
            continue
        if content_hash:
            seen_hashes.add(content_hash)

        layer_rank = int(meta.get("layer_rank", 9))
        adjusted = _score(distance, layer_rank, layer_bias)
        scored.append(
            {
                "score": adjusted,
                "distance": distance,
                "metadata": meta,
                "content": _strip_frontmatter(doc.page_content or ""),
            }
        )

    scored.sort(key=lambda x: x["score"])
    top = scored[:top_k]

    sources: List[str] = []
    for item in top:
        meta = item["metadata"]
        source = meta.get("source_path") or "kb"
        title = meta.get("title") or meta.get("section_title") or "Context"
        sources.append(f"{title} ({source})")

    return top, sources


def build_prompt(query: str, contexts: List[Dict]) -> str:
    parts: List[str] = []
    for item in contexts:
        meta = item["metadata"]
        label = f"{meta.get('topic', 'kb')}/{meta.get('source_path', '')}"
        if meta.get("section_title"):
            label = f"{label} :: {meta.get('section_title')}"
        snippet = _normalize_whitespace(item["content"])
        parts.append(f"[{label}] {snippet}")

    context_block = "\n".join(parts)
    return (
        "Question: " + query + "\n\n"
        "Context:\n" + context_block + "\n\n"
        "Answer clearly and concisely, grounded only in the context."
    )


def call_gemini(prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
    payload = {
        "system_instruction": {
            "parts": [
                {
                    "text": (
                        "You are Nihal Khan's portfolio assistant. "
                        "Answer only from the provided context. "
                        "If the answer is not in context, say you don't have that information. "
                        "Be recruiter-friendly and concise."
                    )
                }
            ]
        },
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 512},
    }
    response = requests.post(url, json=payload, timeout=30)
    response.raise_for_status()
    data = response.json()
    candidates = data.get("candidates") or []
    if not candidates:
        return "I don't have enough information to answer that."
    parts = candidates[0].get("content", {}).get("parts", [])
    if not parts:
        return "I don't have enough information to answer that."
    return "".join(part.get("text", "") for part in parts).strip()


class handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length > 0 else b"{}"
            body = json.loads(raw.decode("utf-8"))
            query = (body.get("query") or "").strip()
            if not query:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing query"}).encode("utf-8"))
                return

            if not os.getenv("OPENAI_API_KEY"):
                raise RuntimeError("OPENAI_API_KEY is not set.")

            contexts, _sources = retrieve_context(query)
            prompt = build_prompt(query, contexts)
            answer = call_gemini(prompt)

            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(answer.encode("utf-8"))
        except Exception as exc:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(exc)}).encode("utf-8"))

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
