import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";

const POSITION_LABEL = { GK: "Bramkarz", DF: "Obrońca", MF: "Pomocnik", FW: "Napastnik" };
const POSITION_ORDER = ["GK", "DF", "MF", "FW"];
const PLAYER_FALLBACK = "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800";

export default function Squad() {
  const [players, setPlayers] = useState([]);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    api.get("/players").then((r) => setPlayers(r.data)).catch(() => {});
  }, []);

  const filtered = useMemo(
    () => (filter === "ALL" ? players : players.filter((p) => p.position === filter)),
    [players, filter]
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-24" data-testid="squad-page">
      <div className="label-eyebrow">Drużyna</div>
      <h1 className="font-headings text-5xl md:text-7xl uppercase mt-2 mb-10">Zawodnicy</h1>

      <div className="flex gap-2 mb-10 flex-wrap" data-testid="squad-filters">
        {["ALL", ...POSITION_ORDER].map((p) => (
          <button
            key={p}
            data-testid={`squad-filter-${p}`}
            onClick={() => setFilter(p)}
            className={`px-5 py-2 font-headings uppercase tracking-[0.18em] text-xs border transition-all ${
              filter === p ? "bg-[#FF007F] border-[#FF007F] text-white" : "border-white/10 text-zinc-300 hover:border-[#FF007F]"
            }`}
          >
            {p === "ALL" ? "Wszyscy" : POSITION_LABEL[p]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <div className="text-zinc-500">Brak zawodników w wybranej kategorii.</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="brand-card group relative overflow-hidden"
            data-testid={`squad-player-${i}`}
          >
            <div className="aspect-[3/4] overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] relative">
              <img src={p.photo || PLAYER_FALLBACK} alt={p.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
              <div className="absolute top-3 left-3 font-headings text-7xl md:text-8xl text-[#FF007F] leading-none drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]">
                {p.number}
              </div>
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 text-[10px] uppercase tracking-[0.2em] border border-white/10">
                {POSITION_LABEL[p.position] || p.position}
              </div>
            </div>
            <div className="p-4">
              <div className="font-headings text-xl uppercase truncate">{p.name}</div>
              <div className="grid grid-cols-3 mt-3 text-center text-[10px] uppercase tracking-[0.18em] text-zinc-500 border-t border-white/5 pt-3">
                <div><div className="font-headings text-lg text-white">{p.appearances}</div>Wyst.</div>
                <div className="border-x border-white/5"><div className="font-headings text-lg text-white">{p.goals}</div>Gole</div>
                <div><div className="font-headings text-lg text-white">{p.assists}</div>Asysty</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
