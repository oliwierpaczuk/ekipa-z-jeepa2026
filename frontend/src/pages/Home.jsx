import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Marquee from "react-fast-marquee";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Trophy, Users } from "lucide-react";
import { api } from "../lib/api";

const HERO_IMG = "https://images.unsplash.com/photo-1776160043138-52e2cf9c6e4e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920";
const ACTION_IMG = "https://images.pexels.com/photos/221253/pexels-photo-221253.jpeg?auto=compress&cs=tinysrgb&w=1600";

function fmtDate(d) {
  return new Date(d).toLocaleDateString("pl-PL", { day: "2-digit", month: "long" });
}

export default function Home() {
  const [news, setNews] = useState([]);
  const [matches, setMatches] = useState([]);
  const [results, setResults] = useState([]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    api.get("/news?limit=3").then((r) => setNews(r.data)).catch(() => {});
    api.get("/matches?status=scheduled").then((r) => setMatches(r.data.slice(0, 3))).catch(() => {});
    api.get("/matches?status=finished").then((r) => setResults(r.data.slice(-3).reverse())).catch(() => {});
    api.get("/players").then((r) => setPlayers(r.data)).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Stadion" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
        </div>
        <div className="relative max-w-[1400px] mx-auto px-6 md:px-12 pt-20 pb-32 md:pt-32 md:pb-44">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="label-eyebrow mb-6">Sezon 2025/26 · Liga Okręgowa</div>
            <h1 className="font-headings text-6xl sm:text-7xl md:text-8xl lg:text-9xl uppercase leading-[0.85] mb-6 max-w-5xl">
              Różowi.<br />
              <span className="text-[#FF007F]">Bezkompromisowi.</span><br />
              Razem.
            </h1>
            <p className="text-zinc-300 text-lg max-w-xl mb-10">
              EKIPA Z JEEPA to nie tylko klub — to ruch. Każdy mecz, każdy gol, każda akcja —
              dla tych, którzy nie wybierają drogi na skróty.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/terminarz" data-testid="hero-cta-schedule" className="btn-primary">
                <Calendar size={16} /> Terminarz
              </Link>
              <Link to="/zawodnicy" data-testid="hero-cta-squad" className="btn-secondary">
                Skład <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="absolute -bottom-6 left-0 right-0 pointer-events-none select-none">
          <Marquee speed={50} gradient={false}>
            <span className="massive-outline mr-12">EKIPA Z JEEPA · EKIPA Z JEEPA · EKIPA Z JEEPA · </span>
          </Marquee>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-white/5 bg-black/60">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4">
          {[
            { n: players.length || 0, l: "Zawodników" },
            { n: results.filter((r) => (r.home_team === "EKIPA Z JEEPA" ? r.home_score > r.away_score : r.away_score > r.home_score)).length, l: "Wygranych" },
            { n: results.reduce((a, m) => a + (m.home_team === "EKIPA Z JEEPA" ? m.home_score || 0 : m.away_score || 0), 0), l: "Goli" },
            { n: matches.length, l: "Nadchodzących" },
          ].map((s, i) => (
            <div key={i} className={`px-6 py-8 md:py-10 ${i < 3 ? "md:border-r border-white/5" : ""} ${i < 2 ? "border-r border-white/5" : ""} ${i < 2 ? "border-b md:border-b-0 border-white/5" : ""}`}>
              <div className="font-headings text-5xl md:text-6xl text-[#FF007F]">{s.n}</div>
              <div className="text-xs uppercase tracking-[0.25em] text-zinc-400 mt-2">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* NEXT MATCH */}
      {matches[0] && (
        <section className="max-w-[1400px] mx-auto px-6 md:px-12 py-24 md:py-32">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="label-eyebrow">Najbliższy mecz</div>
              <h2 className="font-headings text-4xl md:text-6xl uppercase mt-3">Następne starcie</h2>
            </div>
            <Link to="/terminarz" className="hidden md:inline-flex btn-secondary !py-2 !px-4 text-xs">
              Cały terminarz <ArrowRight size={14} />
            </Link>
          </div>
          <div className="brand-card p-8 md:p-14 grid md:grid-cols-3 gap-8 items-center">
            <div className="text-center md:text-left">
              <div className="font-headings text-3xl md:text-5xl uppercase">{matches[0].home_team}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mt-2">Gospodarze</div>
            </div>
            <div className="text-center">
              <div className="font-headings text-7xl md:text-8xl text-[#FF007F]">VS</div>
              <div className="mt-3 text-zinc-400 text-sm">{fmtDate(matches[0].date)} · {matches[0].venue}</div>
              <div className="text-xs uppercase tracking-[0.25em] text-zinc-500 mt-1">{matches[0].competition}</div>
            </div>
            <div className="text-center md:text-right">
              <div className="font-headings text-3xl md:text-5xl uppercase">{matches[0].away_team}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mt-2">Goście</div>
            </div>
          </div>
        </section>
      )}

      {/* NEWS */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 pb-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="label-eyebrow">Aktualności</div>
            <h2 className="font-headings text-4xl md:text-6xl uppercase mt-3">Z życia klubu</h2>
          </div>
          <Link to="/aktualnosci" className="hidden md:inline-flex btn-secondary !py-2 !px-4 text-xs">
            Wszystkie <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {news.map((n, i) => (
            <motion.article
              key={n.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="brand-card group"
              data-testid={`home-news-${i}`}
            >
              <div className="aspect-[16/10] overflow-hidden bg-black">
                <img
                  src={n.image || ACTION_IMG}
                  alt={n.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
              </div>
              <div className="p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-[#FF007F] mb-2">{n.author}</div>
                <h3 className="font-headings text-2xl uppercase leading-tight mb-2 group-hover:text-[#FF007F] transition-colors">{n.title}</h3>
                <p className="text-zinc-400 text-sm">{n.excerpt}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* SQUAD TEASER */}
      <section className="relative overflow-hidden border-t border-white/5">
        <img src={ACTION_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="relative max-w-[1400px] mx-auto px-6 md:px-12 py-24 md:py-32">
          <div className="max-w-2xl">
            <Users className="text-[#FF007F] mb-4" size={32} />
            <div className="label-eyebrow">Drużyna</div>
            <h2 className="font-headings text-5xl md:text-7xl uppercase leading-none mt-3 mb-6">
              Skład,<br />który <span className="text-[#FF007F]">walczy</span>
            </h2>
            <p className="text-zinc-300 mb-8 text-lg">
              {players.length} zawodników. Jedna drużyna. Każdy z nich wnosi coś unikalnego — od bramki, przez środek, po atak.
            </p>
            <Link to="/zawodnicy" className="btn-primary"><Trophy size={16} /> Poznaj skład</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
