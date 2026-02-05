import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSSIBLE_VECTOR_PATHS = [
  path.join(process.cwd(), "db", "kb_vectors.json"),
  path.join(process.cwd(), "public", "db", "kb_vectors.json"),
  path.join(__dirname, "..", "..", "db", "kb_vectors.json"),
  path.join(__dirname, "..", "..", "..", "db", "kb_vectors.json"),
  "/tmp/kb_vectors.json",
];

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const OPENAI_TIMEOUT = Number(process.env.OPENAI_TIMEOUT_SEC || 15);
const GEMINI_TIMEOUT = Number(process.env.GEMINI_TIMEOUT_SEC || 30);
const MAX_CONTEXT_CHARS = Number(process.env.MAX_CONTEXT_CHARS || 8000);

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have",
  "in", "is", "it", "of", "on", "or", "that", "the", "to", "was", "were", "i", "me", "my",
]);

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
  for (let i = 1; i < lines.length; i++) {
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

function cosineSimilarity(vecA, normA, vecB, normB) {
  if (!normA || !normB) return 0;
  let dot = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
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
      console.error("Vector file not found in any location");
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
    }).filter(v => v.content.length > 10);
    
    console.log(`Loaded ${vectors.length} vectors`);
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

// MUCH STRONGER conversational prompting
function buildSystemInstruction() {
  return `You are Nihal, a friendly and enthusiastic software engineer answering questions about your portfolio and background. You speak in a warm, conversational tone as if chatting with a recruiter or friend over coffee.

KEY BEHAVIORS:
- ALWAYS speak in first person ("I", "my", "me")
- Be warm, enthusiastic, and personable - sound like a real human, not a robot
- Use conversational phrases like "Absolutely!", "I'd love to tell you about...", "Great question!", "So, ..."
- Vary your sentence structure - don't start every sentence the same way
- Show personality and genuine interest in the conversation
- Keep answers concise (2-4 sentences) but friendly and complete

EXAMPLES OF GOOD RESPONSES:
Q: "What do you do?"
A: "I'm a full-stack engineer focused on AI-powered applications! Right now I'm building some really cool stuff at NexApproach using Next.js and LangChain. It's exciting work - we're handling real-time data for hundreds of users."

Q: "Tell me about your experience"
A: "I've been having a blast as an AI and Full Stack Engineer at NexApproach since January! I'm building out a high-performance Next.js platform with LangChain and WebSockets. It's pretty rewarding seeing it handle 500+ users smoothly. Before that, I..."

Q: "Do you know Python?"
A: "Absolutely! Python was actually one of the first languages I really dove into. I use it all the time for backend services, data processing, and AI/ML work. It's my go-to when I need to move fast and build something robust."

NEVER:
- Sound robotic or list-like
- Start with "Based on the provided information..."
- Use formal or stiff language
- Simply restate facts without personality`;
}

function buildPrompt(query, contexts) {
  if (!contexts.length) {
    return `The user asked: "${query}"

You don't have specific information about this in your portfolio. Respond warmly and conversationally, saying you don't have those details handy but would love to discuss it in person. Keep it brief and friendly.`;
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
  
  return `The user asked: "${query}"

Here is information from your portfolio to help answer:
---
${contextBlock}
---

Now answer their question warmly and conversationally in your own voice. Speak as if you're excited to share this with them. Use the information above but make it sound natural and personal, not like you're reading from a resume.`;
}

function buildFallbackAnswer(contexts) {
  if (!contexts.length) {
    return "I'd love to tell you more about that, but I don't have those details in my portfolio yet. Let's chat about it in person!";
  }
  
  const bestContext = contexts[0];
  const text = normalizeWhitespace(bestContext.content);
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let result = sentences.slice(0, 2).join(" ").trim();
  
  if (result.length < 80 && sentences.length > 2) {
    result = sentences.slice(0, 3).join(" ").trim();
  }
  
  return result || text.slice(0, 300);
}

async function retrieveContext(query) {
  const vectors = loadVectors();
  if (!vectors.length) return [];

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

  const scored = [];
  const seenHashes = new Set();
  
  for (const item of vectors) {
    const meta = item.metadata || {};
    const hash = meta.content_hash || item.id;
    if (hash && seenHashes.has(hash)) continue;
    if (hash) seenHashes.add(hash);

    const sim = cosineSimilarity(
      queryEmbedding,
      queryNorm,
      item.embedding,
      item.norm
    );
    
    const layerRank = Number(meta.layer_rank || 2);
    const layerBoost = (4 - layerRank) * 0.02;
    const distance = 1 - sim;
    const score = distance - layerBoost;
    
    scored.push({
      score,
      similarity: sim,
      metadata: meta,
      content: item.content,
    });
  }
  
  if (!scored.length) return [];
  
  scored.sort((a, b) => a.score - b.score);
  
  const results = scored.slice(0, 5);
  
  if (results[0].similarity < 0.2) {
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildSystemInstruction() }]
        },
        contents: [{ 
          role: "user", 
          parts: [{ text: prompt }] 
        }],
        generationConfig: { 
          temperature: 0.8,  // Higher temperature for more personality
          maxOutputTokens: 1024,
          topP: 0.9,
        },
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${apiKey}`;
    
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildSystemInstruction() }]
        },
        contents: [{ 
          role: "user", 
          parts: [{ text: prompt }] 
        }],
        generationConfig: { 
          temperature: 0.8,  // Higher temperature for personality
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
  const MAX_SIZE = 1024 * 10;
  
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

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Transfer-Encoding", "chunked");

    console.log("Processing query:", question);

    const contexts = await retrieveContext(question);
    console.log(`Found ${contexts.length} contexts`);

    const prompt = buildPrompt(question, contexts);
    const fallbackAnswer = buildFallbackAnswer(contexts);

    // Try streaming first
    try {
      const streamResult = await streamGemini(prompt, res);
      
      if (!streamResult.wrote) {
        const answer = await callGemini(prompt);
        res.end(answer);
      } else {
        res.end();
      }
    } catch (streamErr) {
      console.error("Streaming failed:", streamErr.message);
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