import fs from "fs";
import path from "path";

const ROOT_DIR = process.cwd();
const VECTOR_PATH = path.join(ROOT_DIR, "db", "kb_vectors.json");

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const OPENAI_TIMEOUT = Number(process.env.OPENAI_TIMEOUT_SEC || 15);
const GEMINI_TIMEOUT = Number(process.env.GEMINI_TIMEOUT_SEC || 30);
const MAX_CONTEXT_CHARS = Number(process.env.MAX_CONTEXT_CHARS || 8000);

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
  ["experience", ["experience", "work", "job", "career", "professional"]],
  ["skills", ["skills", "stack", "tools", "tech", "technologies", "expertise"]],
  ["about", ["education", "degree", "university", "school", "background"]],
  ["research", ["research", "paper", "publication", "study"]],
];

const SENSITIVE_TRIGGERS = ["visa", "sponsorship", "citizenship", "immigration"];
const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have",
  "in", "is", "it", "of", "on", "or", "that", "the", "to", "was", "were",
]);

// Simple in-memory cache for embeddings
const EMBEDDING_CACHE = new Map();
const CACHE_MAX_SIZE = 1000;

let VECTOR_CACHE = null;
let VECTOR_CACHE_MTIME = null;

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
    .filter((token) => token && !STOPWORDS.has(token) && token.length > 2);
}

function hasEvidence(query, contexts) {
  if (!contexts.length) return false;
  const queryTokens = new Set(tokenize(query));
  if (!queryTokens.size) return true;
  
  const joined = contexts.map((c) => c.content).join(" ");
  const contextTokens = new Set(tokenize(joined));
  
  let matches = 0;
  for (const token of queryTokens) {
    if (contextTokens.has(token)) matches++;
  }
  
  // Require at least 30% of query tokens to match, or at least 1 if query is short
  const threshold = Math.min(1, Math.floor(queryTokens.size * 0.3));
  return matches >= threshold;
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
  try {
    const stats = fs.statSync(VECTOR_PATH);
    const mtime = stats.mtimeMs;
    
    if (VECTOR_CACHE && VECTOR_CACHE_MTIME === mtime) {
      return VECTOR_CACHE;
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
    VECTOR_CACHE_MTIME = mtime;
    return vectors;
  } catch (err) {
    console.error("Failed to load vectors:", err.message);
    return [];
  }
}

async function openaiEmbed(query) {
  const cacheKey = query.toLowerCase().trim();
  if (EMBEDDING_CACHE.has(cacheKey)) {
    return EMBEDDING_CACHE.get(cacheKey);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Configuration error");

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
      throw new Error(`Embedding service error (${resp.status})`);
    }
    
    const payload = await resp.json();
    const data = payload.data || [];
    if (!data.length) throw new Error("No embedding returned");
    
    const embedding = data[0].embedding;
    
    // Cache management
    if (EMBEDDING_CACHE.size >= CACHE_MAX_SIZE) {
      const firstKey = EMBEDDING_CACHE.keys().next().value;
      EMBEDDING_CACHE.delete(firstKey);
    }
    EMBEDDING_CACHE.set(cacheKey, embedding);
    
    return embedding;
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt(query, contexts) {
  const parts = contexts.map((c) => normalizeWhitespace(c.content));
  let contextBlock = parts.join("\n\n");
  if (contextBlock.length > MAX_CONTEXT_CHARS) {
    contextBlock = contextBlock.slice(0, MAX_CONTEXT_CHARS);
    // Try to end at a paragraph
    const lastBreak = contextBlock.lastIndexOf("\n\n");
    if (lastBreak > MAX_CONTEXT_CHARS * 0.7) {
      contextBlock = contextBlock.slice(0, lastBreak);
    }
  }
  
  return [
    `You are the portfolio owner. Answer the following question in first person, warm and conversational tone.`,
    ``,
    `Question: ${query}`,
    ``,
    `Relevant information from your portfolio:`,
    contextBlock,
    ``,
    `Instructions:`,
    `- Answer based ONLY on the information provided above`,
    `- Be concise but complete (3-5 sentences)`,
    `- If the information isn't available, say "I don't have details about that in my portfolio yet"`,
    `- Speak naturally as if talking to a recruiter`,
  ].join("\n");
}

function buildFallbackAnswer(contexts) {
  if (!contexts.length) {
    return "I don't have details about that in my portfolio yet, but I'd be happy to discuss it in person.";
  }
  
  // Pick the most relevant context (lowest score = highest similarity)
  const bestContext = contexts[0];
  const text = normalizeWhitespace(bestContext.content);
  
  // Return first 2-3 sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const selected = sentences.slice(0, 3).join(" ").trim();
  
  return selected || text.slice(0, 300);
}

async function retrieveContext(query) {
  const vectors = loadVectors();
  if (!vectors.length) return [];

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
    
    // Topic filtering - be more lenient
    if (topic && meta.topic && meta.topic !== topic) {
      // Still include if similarity is high enough
      continue;
    }
    
    if (summaryOnly && meta.layer && meta.layer !== "summary") continue;

    const hash = meta.content_hash || JSON.stringify(item.content).slice(0, 50);
    if (hash && seenHashes.has(hash)) continue;
    if (hash) seenHashes.add(hash);

    const sim = cosineSimilarity(
      queryEmbedding,
      queryNorm,
      item.embedding,
      item.norm
    );
    
    // FIXED: Lower layer_rank = higher priority (summary = 1, detail = 3)
    // So we boost score for lower ranks (better content)
    const layerRank = Number(meta.layer_rank || 2);
    const layerBoost = (4 - layerRank) * 0.05; // summary=0.15, detail=0.05
    
    // Score is distance (lower is better), so we subtract boost
    const score = (1 - sim) - layerBoost;
    
    scored.push({
      score,
      similarity: sim,
      metadata: meta,
      content: item.content,
    });
  }
  
  // Sort by score ascending (lower = better)
  scored.sort((a, b) => a.score - b.score);
  
  // Return top 5, but ensure we have at least some minimum similarity
  const results = scored.slice(0, 5);
  
  // If best match is very poor, return empty to trigger fallback
  if (results.length > 0 && results[0].similarity < 0.3) {
    return [];
  }
  
  return results;
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Configuration error");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT * 1000);
  
  try {
    // FIXED: Removed space in URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          role: "user", 
          parts: [{ text: prompt }] 
        }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 1024,
          topP: 0.9,
        },
      }),
      signal: controller.signal,
    });
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Gemini API error:", resp.status, errorText);
      throw new Error(`Generation failed (${resp.status})`);
    }
    
    const data = await resp.json();
    
    if (data.error) {
      throw new Error(data.error.message || "API error");
    }
    
    const candidates = data.candidates || [];
    if (!candidates.length) {
      throw new Error("No response generated");
    }
    
    // Check for finish reason
    const finishReason = candidates[0].finishReason;
    if (finishReason && finishReason !== "STOP") {
      console.warn("Gemini finish reason:", finishReason);
    }
    
    const parts = candidates[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || "").join("").trim();
    
    if (!text) {
      throw new Error("Empty response");
    }
    
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

async function streamGemini(prompt, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Configuration error");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT * 1000);
  
  let wrote = false;
  let fullText = "";
  
  try {
    // FIXED: Removed space in URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${apiKey}`;
    
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          role: "user", 
          parts: [{ text: prompt }] 
        }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 1024,
          topP: 0.9,
        },
      }),
      signal: controller.signal,
    });

    if (!resp.ok || !resp.body) {
      throw new Error(`Stream failed (${resp.status})`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

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
        if (line === "[DONE]") continue;

        try {
          const payload = JSON.parse(line);
          
          // Check for errors in stream
          if (payload.error) {
            console.error("Stream error:", payload.error);
            continue;
          }
          
          const candidates = payload.candidates || [];
          for (const candidate of candidates) {
            // Check finish reason
            if (candidate.finishReason && candidate.finishReason !== "STOP") {
              console.warn("Stream finish reason:", candidate.finishReason);
            }
            
            const parts = candidate.content?.parts || [];
            for (const part of parts) {
              if (part.text) {
                res.write(part.text);
                fullText += part.text;
                wrote = true;
                
                // Try to flush if available
                if (typeof res.flush === "function") {
                  res.flush();
                }
              }
            }
          }
        } catch (e) {
          // Log parse errors but continue
          console.debug("Parse error in stream:", e.message);
        }
      }
    }
    
    return { wrote, fullText };
  } catch (err) {
    if (err?.name === "AbortError") {
      console.log("Stream timeout, returning what we have");
      return { wrote, fullText };
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  
  let raw = "";
  let size = 0;
  const MAX_SIZE = 1024 * 10; // 10KB limit
  
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_SIZE) {
      throw new Error("Request too large");
    }
    raw += chunk;
  }
  
  if (!raw) return {};
  
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  // CORS headers for all responses
  const setCors = () => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  };

  if (req.method === "OPTIONS") {
    setCors();
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    setCors();
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  setCors();

  try {
    const { query } = await readJsonBody(req);
    const question = (query || "").trim();
    
    if (!question) {
      res.status(400).json({ error: "Missing query" });
      return;
    }

    // Set streaming headers
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Transfer-Encoding", "chunked");

    const contexts = await retrieveContext(question);
    const summaryIntent = isSummaryIntent(question);
    const topic = inferTopic(question);

    // More lenient evidence check
    if (isSensitiveQuery(question) && !hasEvidence(question, contexts)) {
      res.end("I'd prefer to discuss those details in person during our conversation.");
      return;
    }

    // Only block if truly no context AND it's a specific topic query
    if (!contexts.length && topic) {
      res.end("I don't have details about that in my portfolio yet, but I'd be happy to discuss it.");
      return;
    }

    const prompt = buildPrompt(question, contexts);
    const fallbackAnswer = buildFallbackAnswer(contexts);

    // Try streaming first
    const streamResult = await streamGemini(prompt, res);
    
    if (!streamResult.wrote) {
      // If nothing written, try non-streaming
      try {
        const answer = await callGemini(prompt);
        res.end(answer);
      } catch (err) {
        console.error("Non-streaming failed:", err.message);
        res.end(fallbackAnswer);
      }
    } else {
      // Successfully streamed something
      res.end();
    }
    
  } catch (err) {
    console.error("Handler error:", err.message);
    
    if (res.headersSent) {
      res.end();
      return;
    }
    
    res.status(500).json({ error: "Service temporarily unavailable" });
  }
}