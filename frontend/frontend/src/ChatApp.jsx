// ChatApp.jsx — Advanced UI (auto dark mode, typing animation, smooth UX)
import React, { useEffect, useMemo, useRef, useState } from "react";

export default function ChatApp() {
  // ---- Theme: auto-detect system preference (no manual toggle) ----
  const prefersDark = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches,
    []
  );
  const [isDark, setIsDark] = useState(prefersDark);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  // ---- Chat state ----
  const [started, setStarted] = useState(true); // skip welcome for now; set to false to show splash
  const [msgs, setMsgs] = useState([]); // {role: "user"|"assistant", content: string}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  // auto-scroll when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // show/hide "scroll to bottom" button
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      setShowScrollBtn(!nearBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // ---- Helpers ----
  const addAssistantWithTyping = async (fullText) => {
    // append an assistant message with incremental typing effect
    const idx = msgs.length; // capture index position where message will end up
    setMsgs((m) => [...m, { role: "assistant", content: "" }]);

    let i = 0;
    const speed = 18; // ms per char for the retro-type effect
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        i += 1;
        setMsgs((m) => {
          const copy = [...m];
          const current = copy[idx] || { role: "assistant", content: "" };
          copy[idx] = { role: "assistant", content: fullText.slice(0, i) };
          return copy;
        });
        if (i >= fullText.length) {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  };

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    // tiny delay to let UI update before fetch (improves perceived responsiveness)
    await new Promise((r) => setTimeout(r, 30));

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: "web-user", message: userMsg }),
      });
      const data = await res.json();
      const reply = (data && data.reply) || "…";
      await addAssistantWithTyping(reply);
    } catch (e) {
      await addAssistantWithTyping(`(Error) ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  // Enter = send, Shift+Enter = newline
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ---- Optional welcome screen (toggle started=false to show) ----
  if (!started) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 dark:from-slate-900 dark:to-slate-800">
        <div className="bg-white dark:bg-slate-900 dark:text-slate-100 p-6 rounded-2xl shadow-xl w-96 text-center space-y-4">
          <h2 className="text-2xl font-bold">Finance Copilot</h2>
          <p className="text-sm opacity-75">Ask anything about your spending, budgets, and trends.</p>
          <button
            className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
            onClick={() => setStarted(true)}
          >
            Start Chat
          </button>
        </div>
      </div>
    );
  }

  // ---- Main chat UI ----
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-slate-900">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-950 dark:text-slate-100 shadow-2xl rounded-2xl flex flex-col h-[94vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-lg font-semibold">Finance Copilot</div>
          <div className="text-xs opacity-60">
            {isDark ? "Auto: Dark" : "Auto: Light"}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-900/60"
        >
          {msgs.map((m, i) => (
            <MessageBubble key={i} role={m.role} text={m.content} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="flex items-end gap-2">
            <textarea
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 resize-none"
              rows={2}
              placeholder="Type your question…  (Enter = send, Shift+Enter = new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className={`px-4 py-3 rounded-xl text-white transition ${
                loading || !input.trim()
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Send
            </button>
          </div>
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={() =>
              bottomRef.current?.scrollIntoView({ behavior: "smooth" })
            }
            className="absolute right-6 bottom-24 px-3 py-2 rounded-full bg-black/70 text-white text-xs shadow hover:bg-black"
            aria-label="Scroll to latest"
            title="Scroll to latest"
          >
            ↓ New
          </button>
        )}
      </div>
    </div>
  );
}

/* --------------------------- Components --------------------------- */

function MessageBubble({ role, text }) {
  // subtle fade-in
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}
      style={{ opacity: mounted ? 1 : 0, transition: "opacity 160ms ease-in" }}
    >
      <div
        className={`px-4 py-2 rounded-2xl max-w-[80%] whitespace-pre-wrap leading-relaxed ${
          role === "user"
            ? "bg-blue-600 text-white"
            : "bg-white dark:bg-slate-800 dark:text-slate-100 text-gray-800 border border-gray-200 dark:border-slate-700"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const iv = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 350);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="flex justify-start">
      <div className="px-4 py-2 rounded-2xl max-w-[80%] bg-white dark:bg-slate-800 dark:text-slate-100 text-gray-500 border border-gray-200 dark:border-slate-700">
        Thinking{dots}
      </div>
    </div>
  );
}
