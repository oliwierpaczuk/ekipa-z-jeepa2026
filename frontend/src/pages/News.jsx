import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";

const FALLBACK = "https://images.unsplash.com/photo-1763494392794-a07d77898569?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

export default function NewsPage() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/news?limit=50").then((r) => setItems(r.data)).catch(() => {});
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-24" data-testid="news-page">
      <div className="label-eyebrow">News</div>
      <h1 className="font-headings text-5xl md:text-7xl uppercase mt-2 mb-12">Aktualności</h1>

      {items.length === 0 && (
        <div className="text-zinc-500" data-testid="news-empty">Brak aktualności.</div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((n, i) => (
          <motion.article
            key={n.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="brand-card group cursor-pointer"
            onClick={() => setActive(n)}
            data-testid={`news-item-${i}`}
          >
            <div className="aspect-[16/10] overflow-hidden bg-black">
              <img src={n.image || FALLBACK} alt={n.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#FF007F] mb-2">{n.author}</div>
              <h3 className="font-headings text-2xl uppercase leading-tight mb-2 group-hover:text-[#FF007F] transition-colors">{n.title}</h3>
              <p className="text-zinc-400 text-sm">{n.excerpt}</p>
            </div>
          </motion.article>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setActive(null)} data-testid="news-modal">
          <div className="bg-[#0A0A0A] border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <img src={active.image || FALLBACK} alt={active.title} className="w-full aspect-[16/9] object-cover" />
            <div className="p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-[#FF007F] mb-3">{active.author}</div>
              <h2 className="font-headings text-3xl md:text-4xl uppercase mb-4">{active.title}</h2>
              <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{active.body}</p>
              <button onClick={() => setActive(null)} data-testid="news-modal-close" className="btn-secondary mt-8">Zamknij</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
