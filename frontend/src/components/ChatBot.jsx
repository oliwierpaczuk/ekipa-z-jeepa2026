import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { api } from "../lib/api";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Cześć! Jestem asystentem EKIPY Z JEEPA. Zapytaj mnie o zawodników, mecze albo klub." },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const { data } = await api.post("/ai/chat", { message: text, session_id: sessionId });
      setSessionId(data.session_id);
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: "Asystent jest chwilowo niedostępny. Spróbuj ponownie." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        data-testid="chatbot-toggle"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#FF007F] text-white flex items-center justify-center shadow-[6px_6px_0_rgba(255,255,255,0.1)] hover:bg-[#E0006F] transition-all animate-pulse-pink"
        aria-label="Asystent AI"
      >
        {open ? <X /> : <MessageCircle />}
      </button>

      {open && (
        <div
          data-testid="chatbot-panel"
          className="fixed bottom-24 right-6 z-50 w-[92vw] sm:w-[400px] h-[560px] bg-[#0A0A0A] border border-white/10 flex flex-col scanlines"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black">
            <Sparkles size={16} className="text-[#FF007F]" />
            <div>
              <div className="font-headings tracking-wide text-sm uppercase">Asystent AI</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em]">EKIPA Z JEEPA · Claude</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" data-testid="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#FF007F] text-white"
                    : "bg-[#121212] border border-white/10 text-zinc-100"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="px-3 py-2 text-sm bg-[#121212] border border-white/10 text-zinc-400">
                  pisze...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t border-white/10 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Zapytaj asystenta..."
              data-testid="chatbot-input"
              className="!py-2 !text-sm"
              disabled={busy}
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              data-testid="chatbot-send"
              className="bg-[#FF007F] hover:bg-[#E0006F] disabled:opacity-40 text-white px-4 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
