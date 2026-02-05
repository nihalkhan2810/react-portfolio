import fs from "fs";
import path from "path";

const ROOT_DIR = process.cwd();
const VECTOR_PATH = path.join(ROOT_DIR, "db", "kb_vectors.json");

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

const OPENAI_TIMEOUT = Number(process.env.OPENAI_TIMEOUT_SEC || 6);
const GEMINI_TIMEOUT = Number(process.env.GEMINI_TIMEOUT_SEC || 8);
const MAX_CONTEXT_CHARS = Number(process.env.MAX_CONTEXT_CHARS || 6000);

const SUMMARY_TRIGGERS = [
  "summarize",
  "summary",
  "overview",
  "who are you",
  "about you",
  "tell me about yourself",
  "yourself",
  "background",
];

const TOPIC_TRIGGERS = [
  ["projects", ["project", "projects", "portfolio"]],
  ["experience", ["experience", "work", "job", "roles"]],
  ["skills", ["skills", "stack", "tools", "tech"]],
  ["about", ["education", "degree", "university", "school"]],
  ["research", ["research", "paper", "publication"]],
];

const SENSITIVE_TRIGGERS = ["visa", "sponsorship", "citizenship", "immigration"];

let VECTOR_CACHE = null;

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function stripFrontmatter(text) {
  const clean = text.replace(/^\uFEFF/, "");
  if (!clean.startsWith("---")) return clean;
  const lines = clean.split("\n");
  let endIdx = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) return clean;
  return lines.slice(endIdx + 1).join("\n").trim();
}

function tokenize(text) {
  return normalizeWhitespace(text.toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .split(" ")
    .filter(Boolean);
}

function hasEvidence(query, contexts) {
  const queryTokens = new Set(tokenize(query));
  if (!queryTokens.size) return true;
  const joined = contexts.map((c) => c.content).join(" ");
  const contextTokens = new Set(tokenize(joined));
  for (const token of queryTokens) {
    if (contextTokens.has(token)) return true;
  }
  return false;
}

function inferTopic(query) {
  const q = query.toLowerCase();
  for (const [topic, triggers] of TOPIC_TRIGGERS) {
    if (triggers.some((t) => q.includes(t))) return topic;
  }
  return null;
}

function isSummaryIntent(query) {
  const q = query.toLowerCase();
  return SUMMARY_TRIGGERS.some((t) => q.includes(t));
}

function isSensitiveQuery(query) {
  const q = query.toLowerCase();
  return SENSITIVE_TRIGGERS.some((t) => q.includes(t));
}

function cosineSimilarity(vecA, normA, vecB, normB) {
  if (!normA || !normB) return 0;
  let dot = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i += 1) {
    dot += vecA[i] * vecB[i];
  }
  return dot / (normA * normB);
}

function loadVectors() {
  if (VECTOR_CACHE) return VECTOR_CACHE;
  if (!fs.existsSync(VECTOR_PATH)) {
    throw new Error(`Vector file not found: ${VECTOR_PATH}`);
  }
  const raw = fs.readFileSync(VECTOR_PATH, "utf-8");
  const data = JSON.parse(raw);
  const vectors = (data.vectors || []).map((item) => {
    const embedding = item.embedding || [];
    let norm = 0;
    for (const val of embedding) norm += val * val;
    norm = Math.sqrt(norm);
    return {
      content: stripFrontmatter(item.content || ""),
      embedding,
      norm,
      metadata: item.metadata || {},
    };
  });
  VECTOR_CACHE = vectors;
  return vectors;
}

async function openaiEmbed(query) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT * 1000);
  try {
    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: query }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      throw new Error(`OpenAI embeddings failed (${resp.status})`);
    }
    const payload = await resp.json();
    const data = payload.data || [];
    if (!data.length) throw new Error("No embedding returned.");
    return data[0].embedding;
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt(query, contexts) {
  const parts = contexts.map((c) => normalizeWhitespace(c.content));
  let contextBlock = parts.join("\n");
  if (contextBlock.length > MAX_CONTEXT_CHARS) {
    contextBlock = contextBlock.slice(0, MAX_CONTEXT_CHARS);
  }
  return [
    `Question: ${query}`,
    "",
    "Context:",
    contextBlock,
    "",
    "Instructions:",
    "- Answer in first person as if you are the portfolio owner.",
    "- Be conversational and concise (2-4 sentences).",
    "- Do not use markdown, bullet lists, or headings.",
    "- If the answer is not in the context, say you don't have that information.",
    "- Do not mention sources, file names, or the word 'context'.",
  ].join("\n");
}

async function retrieveContext(query) {
  const vectors = loadVectors();
  const queryEmbedding = await openaiEmbed(query);
  let queryNorm = 0;
  for (const val of queryEmbedding) queryNorm += val * val;
  queryNorm = Math.sqrt(queryNorm);

  const topic = inferTopic(query);
  const summaryOnly = isSummaryIntent(query);

  const scored = [];
  const seenHashes = new Set();
  for (const item of vectors) {
    const meta = item.metadata || {};
    if (topic && meta.topic !== topic) continue;
    if (summaryOnly && meta.layer !== "summary") continue;

    const hash = meta.content_hash;
    if (hash && seenHashes.has(hash)) continue;
    if (hash) seenHashes.add(hash);

    const sim = cosineSimilarity(
      queryEmbedding,
      queryNorm,
      item.embedding,
      item.norm
    );
    const distance = 1 - sim;
    const layerRank = Number(meta.layer_rank || 3);
    const score = distance + 0.15 * (layerRank / 10);
    scored.push({
      score,
      distance,
      metadata: meta,
      content: item.content,
    });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, 5);
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT * 1000);
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: [
                  "You are the portfolio owner speaking in first person.",
                  "Be warm, recruiter-friendly, and concise.",
                  "No markdown, no bullet points, no headings.",
                  "If the answer isn't in the provided context, say you don't have that information.",
                  "Paraphrase the context; do not copy sentences verbatim.",
                ].join(" "),
              },
            ],
          },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
        }),
        signal: controller.signal,
      }
    );
    if (!resp.ok) {
      throw new Error(`Gemini failed (${resp.status})`);
    }
    const data = await resp.json();
    const candidates = data.candidates || [];
    const parts = candidates[0]?.content?.parts || [];
    return parts.map((p) => p.text || "").join("").trim();
  } finally {
    clearTimeout(timeout);
  }
}

async function streamGemini(prompt, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT * 1000);
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: [
                "You are the portfolio owner speaking in first person.",
                "Be warm, recruiter-friendly, and concise.",
                "No markdown, no bullet points, no headings.",
                "If the answer isn't in the provided context, say you don't have that information.",
                "Paraphrase the context; do not copy sentences verbatim.",
              ].join(" "),
            },
          ],
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
      }),
      signal: controller.signal,
    }
  );

  try {
    if (!resp.ok || !resp.body) {
      throw new Error(`Gemini stream failed (${resp.status})`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let wrote = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        if (line.startsWith("data:")) line = line.slice(5).trim();
        if (line === "[DONE]") return true;

        try {
          const payload = JSON.parse(line);
          const candidates = payload.candidates || [];
          for (const candidate of candidates) {
            const parts = candidate.content?.parts || [];
            for (const part of parts) {
              if (part.text) {
                res.write(part.text);
                res.flush?.();
                wrote = true;
              }
            }
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    return wrote;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { query } = req.body || {};
    const question = (query || "").trim();
    if (!question) {
      res.status(400).json({ error: "Missing query" });
      return;
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Gemini-Model", GEMINI_MODEL);

    const contexts = await retrieveContext(question);
    const summaryIntent = isSummaryIntent(question);
    const topic = inferTopic(question);

    if (isSensitiveQuery(question) && !hasEvidence(question, contexts)) {
      res.end("I don’t have that information in my portfolio data.");
      return;
    }

    if (!contexts.length && (summaryIntent || topic)) {
      res.end("I don’t have that information in my portfolio data.");
      return;
    }

    const prompt = buildPrompt(question, contexts);

    const streamed = await streamGemini(prompt, res);
    if (!streamed) {
      const answer = await callGemini(prompt);
      res.end(answer);
      return;
    }

    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
}
