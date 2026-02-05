import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple possible paths for the vector file (for different environments)
const POSSIBLE_VECTOR_PATHS = [
  path.join(process.cwd(), "db", "kb_vectors.json"),
  path.join(process.cwd(), "public", "db", "kb_vectors.json"),
  path.join(__dirname, "..", "..", "db", "kb_vectors.json"), // API route relative
  path.join(__dirname, "..", "..", "..", "db", "kb_vectors.json"), // One more level up
  "/tmp/kb_vectors.json", // Vercel tmp directory
];

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

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
  ["projects", ["project", "projects", "portfolio", "work", "built", "created"]],
  ["experience", ["experience", "work", "job", "career", "professional", "industry", "years", "company"]],
  ["skills", ["skills", "skill", "stack", "tools", "tech", "technologies", "expertise", "proficient", "language", "framework"]],
  ["about", ["education", "degree", "university", "school", "background", "studied", "learned"]],
  ["research", ["research", "paper", "publication", "study", "published"]],
];

const SENSITIVE_TRIGGERS = ["visa", "sponsorship", "citizenship", "immigration"];
const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have",
  "in", "is", "it", "of", "on", "or", "that", "the", "to", "was", "were", "i", "me", "my",
]);

// Simple in-memory cache for embeddings
const EMBEDDING_CACHE = new Map();
const CACHE_MAX_SIZE = 1000;

let VECTOR_CACHE = null;
let VECTOR_CACHE_MTIME = null;
let LAST_ERROR = null;

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
  
  // More lenient: require only 1 match or 20% of tokens
  const threshold = Math.max(1, Math.floor(queryTokens.size * 0.2));
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

function findVectorPath() {
  for (const tryPath of POSSIBLE_VECTOR_PATHS) {
    if (fs.existsSync(tryPath)) {
      return tryPath;
    }
  }
  return null;
}

function loadVectors() {
  try {
    const vectorPath = findVectorPath();
    
    if (!vectorPath) {
      console.error("Vector file not found in any location:", POSSIBLE_VECTOR_PATHS);
      LAST_ERROR = "Vector database not found";
      return [];
    }
    
    const stats = fs.statSync(vectorPath);
    const mtime = stats.mtimeMs;
    
    if (VECTOR_CACHE && VECTOR_CACHE_MTIME === mtime) {
      return VECTOR_CACHE;
    }
    
    console.log("Loading vectors from:", vectorPath);
    const raw = fs.readFileSync(vectorPath, "utf-8");
    const data = JSON.parse(raw);
    
    if (!data.vectors || !Array.isArray(data.vectors)) {
      console.error("Invalid vector file format");
      return [];
    }
    
    const vectors = data.vectors.map((item, idx) => {
      const embedding = item.embedding || [];
      let norm = 0;
      for (const val of embedding) norm += val * val;
      norm = Math.sqrt(norm);
      return {
        content: stripFrontmatter(item.content || ""),
        embedding,
        norm,
        metadata: item.metadata || {},
        id: idx,
      };
    }).filter(v => v.content.length > 10); // Filter out empty/short entries
    
    console.log(`Loaded ${vectors.length} vectors`);
    VECTOR_CACHE = vectors;
    VECTOR_CACHE_MTIME = mtime;
    LAST_ERROR = null;
    return vectors;
  } catch (err) {
    console.error("Failed to load vectors:", err.message);
    LAST_ERROR = err.message;
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
  if (!contexts.length) {
    return `Question: ${query}\n\nYou are the portfolio owner. You don't have specific information about this in your portfolio data. Politely say you don't have those details available but would be happy to discuss in person. Keep it brief (1-2 sentences).`;
  }

  const parts = contexts.map((c) => normalizeWhitespace(c.content));
  let contextBlock = parts.join("\n\n");
  if (contextBlock.length > MAX_CONTEXT_CHARS) {
    contextBlock = contextBlock.slice(0, MAX_CONTEXT_CHARS);
    const lastBreak = contextBlock.lastIndexOf("\n\n");
    if (lastBreak > MAX_CONTEXT_CHARS * 0.7) {
      contextBlock = contextBlock.slice(0, lastBreak);
    }
  }
  
  return [
    `You are the portfolio owner answering questions about yourself. Use the information below to answer.`,
    ``,
    `Question: ${query}`,
    ``,
    `Relevant information from your portfolio:`,
    contextBlock,
    ``,
    `Instructions:`,
    `- Answer in first person, warm and conversational`,
    `- Be concise but complete (2-4 sentences)`,
    `- Only use the information provided above`,
    `- If the information doesn't fully answer the question, acknowledge what you do know`,
  ].join("\n");
}

function buildFallbackAnswer(contexts, query) {
  if (!contexts.length) {
    return "I don't have those details in my portfolio yet, but I'd be happy to chat about it in person!";
  }
  
  // Return the most relevant content directly
  const bestContext = contexts[0];
  const text = normalizeWhitespace(bestContext.content);
  
  // Get first few sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let result = sentences.slice(0, 2).join(" ").trim();
  
  if (result.length < 50 && sentences.length > 2) {
    result = sentences.slice(0, 3).join(" ").trim();
  }
  
  return result || text.slice(0, 250);
}

async function retrieveContext(query) {
  const vectors = loadVectors();
  
  if (!vectors.length) {
    console.error("No vectors loaded, cannot retrieve context");
    return [];
  }

  let queryEmbedding;
  try {
    queryEmbedding = await openaiEmbed(query);
  } catch (err) {
    console.error("Embedding failed:", err.message);
    return [];
  }
  
  let queryNorm = 0;
  for (const val of queryEmbedding) queryNorm += val * val;
  queryNorm = Math.sqrt(queryNorm);

  const topic = inferTopic(query);
  const summaryOnly = isSummaryIntent(query);

  console.log(`Query: "${query}" | Topic: ${topic} | Summary: ${summaryOnly}`);

  const scored = [];
  const seenHashes = new Set();
  
  for (const item of vectors) {
    const meta = item.metadata || {};
    
    // Topic filtering - MORE LENIENT
    // Only filter by topic if we have high confidence, otherwise include all
    if (topic && meta.topic && meta.topic !== topic) {
      // Still calculate similarity - might be relevant despite wrong topic tag
      // We'll just deprioritize it slightly rather than exclude
    }
    
    if (summaryOnly && meta.layer && meta.layer !== "summary") {
      // For summary queries, prefer summaries but don't exclude others
    }

    const hash = meta.content_hash || item.id;
    if (hash && seenHashes.has(hash)) continue;
    if (hash) seenHashes.add(hash);

    const sim = cosineSimilarity(
      queryEmbedding,
      queryNorm,
      item.embedding,
      item.norm
    );
    
    // FIXED scoring: Higher similarity = better (lower score)
    // Layer rank: Lower number = more important (summary=1, detail=3)
    const layerRank = Number(meta.layer_rank || 2);
    const layerBoost = (4 - layerRank) * 0.02; // Small boost for important layers
    
    // Combined score: distance minus boost (lower is better)
    const distance = 1 - sim;
    const score = distance - layerBoost;
    
    // If topic matches exactly, give extra boost
    const topicBoost = (topic && meta.topic === topic) ? 0.1 : 0;
    
    scored.push({
      score: score - topicBoost,
      similarity: sim,
      metadata: meta,
      content: item.content,
    });
  }
  
  if (!scored.length) {
    return [];
  }
  
  // Sort by score ascending (lower = better)
  scored.sort((a, b) => a.score - b.score);
  
  // Return top matches with decent similarity
  const results = scored.slice(0, 5);
  console.log(`Top similarity: ${results[0]?.similarity?.toFixed(3)}, Score: ${results[0]?.score?.toFixed(3)}`);
  
  // Only filter out if similarity is extremely low (< 0.2)
  if (results[0].similarity < 0.2) {
    console.log("Best match has very low similarity, returning empty");
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
    // FIXED URL - no space
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
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
      signal: controller.signal,
    });
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Gemini API error:", resp.status, errorText.slice(0, 500));
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
    
    const finishReason = candidates[0].finishReason;
    if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
      console.warn("Gemini finish reason:", finishReason);
      if (finishReason === "SAFETY") {
        return "I'd prefer to discuss that topic in person. Is there something else about my portfolio you'd like to know?";
      }
    }
    
    const parts = candidates[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || "").join("").trim();
    
    if (!text) {
      throw new Error("Empty response");
    }
    
    return text;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("Response timeout");
    }
    throw err;
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
    // FIXED URL - no space
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
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
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
          
          if (payload.error) {
            console.error("Stream error:", payload.error);
            continue;
          }
          
          const candidates = payload.candidates || [];
          for (const candidate of candidates) {
            if (candidate.finishReason === "SAFETY") {
              res.write("I'd prefer to discuss that in person. What else would you like to know?");
              wrote = true;
              return { wrote, fullText };
            }
            
            const parts = candidate.content?.parts || [];
            for (const part of parts) {
              if (part.text) {
                res.write(part.text);
                fullText += part.text;
                wrote = true;
                
                if (typeof res.flush === "function") {
                  res.flush();
                }
              }
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    
    return { wrote, fullText };
  } catch (err) {
    if (err?.name === "AbortError") {
      console.log("Stream timeout, returning partial");
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

    console.log("Processing query:", question);

    const contexts = await retrieveContext(question);
    const summaryIntent = isSummaryIntent(question);
    const topic = inferTopic(question);

    console.log(`Found ${contexts.length} contexts`);

    // Handle sensitive queries
    if (isSensitiveQuery(question) && !hasEvidence(question, contexts)) {
      res.end("I'd prefer to discuss those details in person during our conversation.");
      return;
    }

    // Only block truly empty contexts for topic-specific queries
    if (!contexts.length && topic && !summaryIntent) {
      res.end("I don't have specific details about that in my portfolio, but I'd be happy to discuss it with you directly!");
      return;
    }

    const prompt = buildPrompt(question, contexts);
    const fallbackAnswer = buildFallbackAnswer(contexts, question);

    // Try streaming first
    try {
      const streamResult = await streamGemini(prompt, res);
      
      if (!streamResult.wrote) {
        // If nothing written, try non-streaming
        const answer = await callGemini(prompt);
        res.end(answer);
      } else {
        res.end();
      }
    } catch (streamErr) {
      console.error("Streaming failed:", streamErr.message);
      // Fall back to non-streaming
      try {
        const answer = await callGemini(prompt);
        res.end(answer);
      } catch (geminiErr) {
        console.error("Non-streaming also failed:", geminiErr.message);
        res.end(fallbackAnswer);
      }
    }
    
  } catch (err) {
    console.error("Handler error:", err.message, err.stack);
    
    if (res.headersSent) {
      res.end();
      return;
    }
    
    res.status(500).json({ error: "Service temporarily unavailable" });
  }
}