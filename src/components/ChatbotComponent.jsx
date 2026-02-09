import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaComment, FaTimes, FaPaperPlane, FaTrash } from "react-icons/fa";

const API_URL = "https://rol2810-my-portfolio-ai.hf.space/ask";
const CLEAR_HISTORY_URL = API_URL.replace(/\/ask\/?$/, "/clear_history");
const SESSION_STORAGE_KEY = "chat_session_id";

const suggestedQuestions = [
  "Tell me about your experience.",
  "What are your key skills?",
  "Describe one of your projects.",
  "How was this chatbot built?",
  "What are your future project ideas?",
  "What is your education background?",
  "Tell me about your role as a Research Assistant.",
  "What is your experience with PyTorch?",
  "List some cloud or DevOps tools you've used.",
  "What is your visa status?",
];

const getOrCreateSessionId = () => {
  try {
    const existingSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (existingSessionId) return existingSessionId;
    const generated =
      "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
    localStorage.setItem(SESSION_STORAGE_KEY, generated);
    return generated;
  } catch {
    return "session_" + Date.now();
  }
};

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatInlineMarkdown = (line) => {
  let output = line;
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  output = output.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
  );
  return output;
};

const markdownToHtml = (raw) => {
  if (!raw) return "";

  const escaped = escapeHtml(raw).replace(/\r\n/g, "\n");
  const fenced = [];
  const withFenceTokens = escaped.replace(/```([\s\S]*?)```/g, (_, block) => {
    fenced.push(`<pre><code>${block.trim()}</code></pre>`);
    return `@@FENCE_${fenced.length - 1}@@`;
  });

  const lines = withFenceTokens.split("\n");
  const html = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      html.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      html.push("</ol>");
      inOl = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeLists();
      continue;
    }

    if (trimmed.startsWith("@@FENCE_")) {
      closeLists();
      html.push(trimmed);
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeLists();
      const level = heading[1].length;
      html.push(`<h${level}>${formatInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        html.push("<ul>");
        inUl = true;
      }
      html.push(`<li>${formatInlineMarkdown(ulMatch[1])}</li>`);
      continue;
    }

    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inUl) {
        html.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        html.push("<ol>");
        inOl = true;
      }
      html.push(`<li>${formatInlineMarkdown(olMatch[1])}</li>`);
      continue;
    }

    if (trimmed.startsWith("&gt;")) {
      closeLists();
      html.push(
        `<blockquote>${formatInlineMarkdown(
          trimmed.replace(/^&gt;\s?/, "")
        )}</blockquote>`
      );
      continue;
    }

    closeLists();
    html.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
  }

  closeLists();
  return html
    .join("")
    .replace(
      /@@FENCE_(\d+)@@/g,
      (_, index) => fenced[Number(index)] || "<pre><code></code></pre>"
    );
};

const TypingDots = () => (
  <div className="flex items-center gap-1.5 py-1">
    <span className="h-2 w-2 rounded-full bg-cyan-300/85 animate-[bounce_0.9s_infinite]" />
    <span className="h-2 w-2 rounded-full bg-cyan-300/85 animate-[bounce_0.9s_0.15s_infinite]" />
    <span className="h-2 w-2 rounded-full bg-cyan-300/85 animate-[bounce_0.9s_0.3s_infinite]" />
  </div>
);

const ChatbotComponent = ({ showBot, setShowBot }) => {
  const [messages, setMessages] = useState([
    {
      type: "ai",
      text: "Hi! I can answer questions about my portfolio. Ask me anything!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showIntroSpotlight, setShowIntroSpotlight] = useState(false);
  const [visibleSuggestions, setVisibleSuggestions] = useState(
    new Set(suggestedQuestions)
  );
  const [showInitialSuggestions, setShowInitialSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const sessionIdRef = useRef(getOrCreateSessionId());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const showTimer = setTimeout(() => setShowIntroSpotlight(true), 750);
    const hideTimer = setTimeout(() => setShowIntroSpotlight(false), 7600);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (showBot) setShowIntroSpotlight(false);
  }, [showBot]);

  const renderedMessages = useMemo(
    () =>
      messages.map((msg) => ({
        ...msg,
        html: msg.type === "ai" ? markdownToHtml(msg.text || "") : "",
      })),
    [messages]
  );

  const clearConversationHistory = async () => {
    try {
      await fetch(CLEAR_HISTORY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionIdRef.current }),
      });
    } catch (error) {
      console.error("Error clearing conversation history:", error);
    }
  };

  const handleClearChat = async () => {
    await clearConversationHistory();
    setMessages([
      {
        type: "ai",
        text: "Hi! I can answer questions about my portfolio. Ask me anything!",
      },
    ]);
    setVisibleSuggestions(new Set(suggestedQuestions));
    setShowInitialSuggestions(true);
  };

  const handleSend = async (query = input) => {
    const userQuestion = query.trim();
    if (!userQuestion || isLoading) return;

    if (messages.length === 1 && messages[0].type === "ai" && !messages[0].isTyping) {
      setShowInitialSuggestions(false);
    }

    if (query === input) setInput("");
    setMessages((prev) => [...prev, { type: "user", text: userQuestion }]);
    setIsLoading(true);
    setMessages((prev) => [...prev, { type: "ai", text: "", isTyping: true }]);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userQuestion,
          session_id: sessionIdRef.current,
        }),
      });

      if (!response.ok) {
        let errorDetails = `Request failed (${response.status})`;
        try {
          const errorJson = await response.json();
          if (errorJson?.error) {
            errorDetails = `Request failed (${response.status}): ${errorJson.error}`;
          } else if (errorJson?.answer) {
            errorDetails = `Request failed (${response.status}): ${errorJson.answer}`;
          }
        } catch {
          try {
            const errorText = await response.text();
            if (errorText) {
              errorDetails = `Request failed (${response.status}): ${errorText.substring(
                0,
                300
              )}...`;
            }
          } catch {
            errorDetails = `Request failed (${response.status})`;
          }
        }

        setMessages((prev) => {
          const idx = prev.findIndex((msg) => msg.type === "ai" && msg.isTyping);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = { ...next[idx], text: `Error: ${errorDetails}`, isTyping: false };
          return next;
        });
        return;
      }

      if (!response.body) {
        setMessages((prev) => {
          const idx = prev.findIndex((msg) => msg.type === "ai" && msg.isTyping);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            text: "Error: Response body is empty.",
            isTyping: false,
          };
          return next;
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let receivedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        receivedText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const idx = prev.findIndex((msg) => msg.type === "ai" && msg.isTyping);
          if (idx === -1) return [...prev, { type: "ai", text: receivedText, isTyping: true }];
          const next = [...prev];
          next[idx] = { ...next[idx], text: receivedText };
          return next;
        });
      }

      setMessages((prev) => {
        const idx = prev.findIndex((msg) => msg.type === "ai" && msg.isTyping);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          isTyping: false,
          text: next[idx].text || "AI response finished with no text.",
        };
        return next;
      });
    } catch (error) {
      setMessages((prev) => {
        const idx = prev.findIndex((msg) => msg.type === "ai" && msg.isTyping);
        const msgText =
          error?.message || "An unexpected error occurred while fetching response.";
        if (idx === -1) return [...prev, { type: "ai", text: `Error: ${msgText}` }];
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          isTyping: false,
          text: next[idx].text ? `${next[idx].text}\n\nError: ${msgText}` : `Error: ${msgText}`,
        };
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestionClick = (question) => {
    setVisibleSuggestions((prev) => {
      const next = new Set(prev);
      next.delete(question);
      return next;
    });
    handleSend(question);
  };

  return (
    <>
      <AnimatePresence>
        {showIntroSpotlight && !showBot && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={() => setShowIntroSpotlight(false)}
            aria-hidden="true"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at calc(100% - 94px) calc(100% - 58px), rgba(15,23,42,0.05) 0, rgba(15,23,42,0.05) 66px, rgba(2,6,23,0.74) 98px)",
              }}
            />
            <motion.div
              className="absolute bottom-[46px] right-[34px] h-[58px] w-[180px] rounded-full border border-cyan-300/55"
              animate={{ scale: [1, 1.08, 1], opacity: [0.8, 0.25, 0.8] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[120px] right-[30px] rounded-xl border border-cyan-400/40 bg-slate-950/85 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-cyan-200 shadow-lg backdrop-blur"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              Open AI Assistant
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-5 right-5 z-50">
        <motion.button
          onClick={() => setShowBot((prev) => !prev)}
          className={`group flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/85 text-white shadow-[0_18px_50px_-20px_rgba(14,165,233,0.75)] backdrop-blur-xl transition-colors ${
            showBot
              ? "h-12 w-12 justify-center bg-slate-800/95"
              : "h-12 px-4 pr-5 hover:bg-slate-800/95"
          }`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          animate={
            showBot
              ? { y: 0, boxShadow: "0 18px 50px -20px rgba(14,165,233,0.75)" }
              : {
                  y: [0, -2, 0],
                  boxShadow: [
                    "0 18px 50px -20px rgba(14,165,233,0.35)",
                    "0 18px 50px -20px rgba(14,165,233,0.75)",
                    "0 18px 50px -20px rgba(14,165,233,0.35)",
                  ],
                }
          }
          transition={
            showBot ? { duration: 0.15 } : { duration: 2.3, repeat: Infinity, ease: "easeInOut" }
          }
          aria-label={showBot ? "Close chatbot" : "Open chatbot"}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
            {showBot ? <FaTimes size={13} /> : <FaComment size={13} />}
          </span>
          {!showBot && (
            <span className="text-sm font-medium tracking-wide text-slate-100">
              Ask AI
            </span>
          )}
        </motion.button>

        <AnimatePresence>
          {showBot && (
            <motion.div
              className="absolute bottom-16 right-0 mt-2 flex h-[min(76vh,680px)] w-[min(440px,calc(100vw-1.25rem))] flex-col overflow-hidden rounded-3xl border border-white/12 bg-slate-950/82 shadow-[0_35px_70px_-30px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
              initial={{ opacity: 0, y: 34, scale: 0.92, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(6px)" }}
              transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.95 }}
            >
              <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-slate-900/95 via-slate-900/75 to-cyan-900/25 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300 ring-1 ring-cyan-300/35">
                    <FaComment size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Nihal Assistant</p>
                    <p className="text-[11px] text-slate-400">Portfolio AI</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearChat}
                    className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
                    aria-label="Clear conversation history"
                    title="Clear conversation"
                  >
                    <FaTrash size={13} />
                  </button>
                  <button
                    onClick={() => setShowBot(false)}
                    className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
                    aria-label="Close chatbot"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 text-sm custom-scrollbar">
                <div className="space-y-3">
                  {renderedMessages.map((msg, index) => (
                    <motion.div
                      key={index}
                      className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { duration: 0.16, ease: "easeOut" },
                      }}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                          msg.type === "user"
                            ? "rounded-br-md bg-cyan-500 text-slate-950 shadow-[0_10px_25px_-18px_rgba(34,211,238,0.9)]"
                            : "rounded-bl-md border border-white/10 bg-slate-900/85 text-slate-100"
                        }`}
                      >
                        {msg.type === "user" ? (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        ) : (
                          <div
                            className="leading-relaxed [&_a]:text-cyan-300 [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-400/60 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:mb-2 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-white/10 [&_pre]:bg-slate-950/95 [&_pre]:p-3"
                            dangerouslySetInnerHTML={{ __html: msg.html }}
                          />
                        )}
                        {msg.type === "ai" && msg.isTyping && (
                          <div className="mt-1 flex items-center">
                            {msg.text ? (
                              <span className="inline-block h-4 w-[2px] animate-pulse bg-cyan-300/80" />
                            ) : (
                              <TypingDots />
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {showInitialSuggestions && visibleSuggestions.size > 0 && (
                <div className="border-t border-white/10 bg-slate-900/70 px-4 py-3">
                  <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Suggested prompts
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {[...visibleSuggestions].map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestionClick(question)}
                        disabled={isLoading}
                        className="shrink-0 rounded-full border border-cyan-300/35 bg-cyan-300/5 px-3 py-1.5 text-xs text-cyan-200 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 bg-slate-950/85 p-3">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/95 px-3 py-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !isLoading) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask anything about Nihal..."
                    disabled={isLoading}
                    className="h-9 flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-60"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={isLoading || input.trim() === ""}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    aria-label="Send message"
                  >
                    <motion.div
                      animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                      transition={
                        isLoading
                          ? { duration: 0.95, repeat: Infinity, ease: "linear" }
                          : { duration: 0.15 }
                      }
                    >
                      <FaPaperPlane size={13} />
                    </motion.div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ChatbotComponent;
