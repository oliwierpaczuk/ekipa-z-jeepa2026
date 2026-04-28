import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../lib/api";

function fmtDate(d) {
  return new Date(d).toLocaleDateString("pl-PL", { day: "2-digit", month: "long", year: "numeric" });
}

const isUs = (t) => t === "EKIPA Z JEEPA";

function outcome(m) {
  if (m.home_score == null || m.away_score == null) return "";
  const usHome = isUs(m.home_team);
  const ours = usHome ? m.home_score : m.away_score;
  const theirs = usHome ? m.away_score : m.home_score;
  if (ours > theirs) return "W";
  if (ours < theirs) return "L";
  return "D";
}
const outcomeColor = { W: "text-emerald-400 border-emerald-400/40", L: "text-red-400 border-red-400/40", D: "text-zinc-400 border-zinc-400/40" };

export default function Results() {
  const [matches, setMatches] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/matches?status=finished").then((r) => setMatches(r.data.reverse())).catch(() => {});
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-24" data-testid="results-page">
      <div className="label-eyebrow">Wyniki</div>
      <h1 className="font-headings text-5xl md:text-7xl uppercase mt-2 mb-10">Ostatnie Mecze</h1>

      {matches.length === 0 && <div className="text-zinc-500">Brak rozegranych meczów.</div>}

      <div className="grid gap-4">
        {matches.map((m, i) => {
          const o = outcome(m);
          return (
            <div key={m.id} className="brand-card p-6 md:p-8 cursor-pointer hover:border-[#FF007F]/40" onClick={() => setActive(m)} data-testid={`result-match-${i}`}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">{fmtDate(m.date)}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">{m.competition}</div>
                </div>
                <div className="md:col-span-7 flex items-center gap-4 flex-wrap">
                  <span className={`font-headings text-xl md:text-2xl uppercase ${isUs(m.home_team) ? "text-white" : "text-zinc-400"}`}>{m.home_team}</span>
                  <span className="font-headings text-3xl md:text-4xl text-[#FF007F]">{m.home_score}:{m.away_score}</span>
                  <span className={`font-headings text-xl md:text-2xl uppercase ${isUs(m.away_team) ? "text-white" : "text-zinc-400"}`}>{m.away_team}</span>
                </div>
                <div className="md:col-span-3 flex justify-start md:justify-end gap-2">
                  {o && (
                    <div className={`px-3 py-1 border text-xs font-headings uppercase tracking-[0.2em] ${outcomeColor[o]}`}>
                      {o === "W" ? "Wygrana" : o === "L" ? "Porażka" : "Remis"}
                    </div>
                  )}
                  {m.summary && (
                    <div className="px-3 py-1 border border-[#FF007F]/40 text-[#FF007F] text-xs font-headings uppercase tracking-[0.2em] flex items-center gap-1">
                      <Sparkles size={10} /> AI
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {active && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setActive(null)} data-testid="result-modal">
          <div className="bg-[#0A0A0A] border border-white/10 max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">{fmtDate(active.date)} · {active.competition}</div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <div className="font-headings text-3xl uppercase">{active.home_team}</div>
              <div className="font-headings text-5xl text-[#FF007F]">{active.home_score}:{active.away_score}</div>
              <div className="font-headings text-3xl uppercase">{active.away_team}</div>
            </div>
            <div className="text-zinc-500 text-sm mb-6">Stadion: {active.venue}</div>

            {active.summary ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-[#FF007F]" />
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#FF007F] font-headings">Podsumowanie AI</div>
                </div>
                <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{active.summary}</p>
              </div>
            ) : (
              <p className="text-zinc-500 italic">Podsumowanie nie zostało jeszcze wygenerowane.</p>
            )}
            <button onClick={() => setActive(null)} className="btn-secondary mt-8">Zamknij</button>
          </div>
        </div>
      )}
    </div>
  );
}
