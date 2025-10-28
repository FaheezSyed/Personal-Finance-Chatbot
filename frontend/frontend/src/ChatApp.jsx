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
  const [msgs, setMsgs] = useState([
    { role: "assistant", content: "Hi — I'm Finance Copilot. Ask about budgets, expenses, or trends. Try: \"Show my top merchants this month\"." },
    { role: "user", content: "Show my top merchants this month" },
  ]); // {role: "user"|"assistant", content: string}
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="relative max-w-4xl mx-auto h-screen flex flex-col">
        {/* App shell — fullscreen card with subtle backdrop */}
        <div className="absolute inset-0 pointer-events-none bg-black/6 dark:bg-black/20" aria-hidden="true" />

        <div className="relative z-10 flex-1 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl shadow-xl m-4 overflow-hidden">
          {/* Header (sticky) */}
          <header className="sticky top-0 z-20 backdrop-blur-sm bg-white/60 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-800 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                FC
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-lg font-semibold leading-tight truncate">Finance Copilot</div>
                <div className="text-xs sm:text-sm opacity-60 truncate">Smart insights for your spending</div>
              </div>
            </div>
            <div className="text-xs opacity-60">
              {isDark ? "Auto: Dark" : "Auto: Light"}
            </div>
          </header>

          {/* Messages (main, scrollable) */}
          <main
            ref={scrollRef}
            role="log"
            aria-live="polite"
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-transparent to-white/50 dark:from-transparent dark:to-slate-900/60"
          >
            <div className="max-w-xl sm:max-w-3xl mx-auto w-full space-y-3">
              {msgs.map((m, i) => (
                <MessageBubble key={i} role={m.role} text={m.content} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          </main>

          {/* Composer (sticky bottom) */}
          <div
            className="sticky bottom-0 z-20 border-t border-gray-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
          >
            <div className="max-w-xl sm:max-w-3xl mx-auto w-full flex flex-col sm:flex-row items-end gap-3">
              <textarea
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 resize-none min-h-[44px] max-h-36 w-full"
                rows={1}
                placeholder="Ask about budgets, expenses, or trends… (Enter = send, Shift+Enter = newline)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="Message"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className={`px-4 py-3 rounded-2xl text-white transition shadow-sm w-full sm:w-auto ${
                    loading || !input.trim()
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  aria-label="Send message"
                >
                  {loading ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button
              onClick={() =>
                bottomRef.current?.scrollIntoView({ behavior: "smooth" })
              }
              className="fixed right-4 sm:right-6 bottom-20 sm:bottom-28 z-30 px-3 py-2 rounded-full bg-black/75 text-white text-xs shadow-lg hover:bg-black/90"
              aria-label="Scroll to latest"
              title="Scroll to latest"
            >
              ↓ New
            </button>
          )}
        </div>
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
        className={`px-4 py-2 rounded-2xl max-w-[80%] sm:max-w-[60%] whitespace-pre-wrap leading-relaxed break-words ${
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
      <div className="px-4 py-2 rounded-2xl max-w-[80%] sm:max-w-[60%] bg-white dark:bg-slate-800 dark:text-slate-100 text-gray-500 border border-gray-200 dark:border-slate-700">
        Thinking{dots}
      </div>
    </div>
  );
}
