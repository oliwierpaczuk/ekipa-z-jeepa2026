import { useEffect, useState } from "react";
import { Calendar, MapPin, Trophy } from "lucide-react";
import { api } from "../lib/api";

function fmt(d) {
  return new Date(d).toLocaleString("pl-PL", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Schedule() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    api.get("/matches?status=scheduled").then((r) => setMatches(r.data)).catch(() => {});
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-24" data-testid="schedule-page">
      <div className="label-eyebrow">Terminarz</div>
      <h1 className="font-headings text-5xl md:text-7xl uppercase mt-2 mb-10">Nadchodzące Mecze</h1>

      {matches.length === 0 && <div className="text-zinc-500" data-testid="schedule-empty">Brak nadchodzących meczów.</div>}

      <div className="space-y-3">
        {matches.map((m, i) => (
          <div key={m.id} className="brand-card grid grid-cols-1 md:grid-cols-12 gap-4 p-6 md:p-8 items-center hover:border-[#FF007F]/40" data-testid={`schedule-match-${i}`}>
            <div className="md:col-span-2">
              <div className="font-headings text-3xl text-[#FF007F]">{new Date(m.date).toLocaleDateString("pl-PL", { day: "2-digit" })}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">{new Date(m.date).toLocaleDateString("pl-PL", { month: "short", year: "numeric" })}</div>
              <div className="text-xs text-zinc-500 mt-1">{new Date(m.date).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
            <div className="md:col-span-7">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-headings text-xl md:text-2xl uppercase">{m.home_team}</span>
                <span className="text-[#FF007F] font-headings text-2xl">VS</span>
                <span className="font-headings text-xl md:text-2xl uppercase">{m.away_team}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-zinc-400 text-xs uppercase tracking-[0.15em] mt-2">
                <span className="flex items-center gap-1"><MapPin size={12} /> {m.venue}</span>
                <span className="flex items-center gap-1"><Trophy size={12} /> {m.competition}</span>
              </div>
            </div>
            <div className="md:col-span-3 flex md:justify-end">
              <div className="px-4 py-2 border border-[#FF007F]/40 text-[#FF007F] uppercase text-xs tracking-[0.2em] font-headings flex items-center gap-2">
                <Calendar size={12} /> Zaplanowany
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
