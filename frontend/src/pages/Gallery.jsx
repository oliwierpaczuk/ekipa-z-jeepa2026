import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/gallery").then((r) => setItems(r.data)).catch(() => {});
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-24" data-testid="gallery-page">
      <div className="label-eyebrow">Galeria</div>
      <h1 className="font-headings text-5xl md:text-7xl uppercase mt-2 mb-10">Najlepsze Kadry</h1>

      {items.length === 0 && <div className="text-zinc-500">Brak zdjęć.</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((g, i) => (
          <motion.button
            key={g.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="aspect-square overflow-hidden bg-black border border-white/5 group cursor-zoom-in"
            onClick={() => setActive(g)}
            data-testid={`gallery-item-${i}`}
          >
            <img src={g.url} alt={g.caption || ""} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
          </motion.button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6" onClick={() => setActive(null)} data-testid="gallery-modal">
          <img src={active.url} alt={active.caption || ""} className="max-h-[90vh] max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}
