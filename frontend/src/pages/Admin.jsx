import { useEffect, useState } from "react";
import { Sparkles, Trash2, Plus, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { toast } from "sonner";

const TABS = [
  { id: "news", label: "Aktualności" },
  { id: "players", label: "Zawodnicy" },
  { id: "matches", label: "Mecze" },
  { id: "gallery", label: "Galeria" },
];

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("news");

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-16" data-testid="admin-page">
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <div className="label-eyebrow">Panel Administratora</div>
          <h1 className="font-headings text-4xl md:text-6xl uppercase mt-2">Zarządzanie</h1>
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Zalogowany: <span className="text-[#FF007F]">{user?.email}</span></div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/5 pb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            data-testid={`admin-tab-${t.id}`}
            className={`px-5 py-2 font-headings uppercase tracking-[0.18em] text-xs border transition-all ${
              tab === t.id ? "bg-[#FF007F] border-[#FF007F] text-white" : "border-white/10 text-zinc-300 hover:border-[#FF007F]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "news" && <NewsAdmin />}
      {tab === "players" && <PlayersAdmin />}
      {tab === "matches" && <MatchesAdmin />}
      {tab === "gallery" && <GalleryAdmin />}
    </div>
  );
}

// ============== NEWS ==============
function NewsAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", excerpt: "", body: "", image: "", author: "Redakcja" });
  const load = async () => setItems((await api.get("/news?limit=100")).data);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/news", form);
      toast.success("Aktualność dodana");
      setForm({ title: "", excerpt: "", body: "", image: "", author: "Redakcja" });
      load();
    } catch (e) { toast.error("Błąd zapisu"); }
  };

  const del = async (id) => {
    if (!window.confirm("Usunąć?")) return;
    await api.delete(`/news/${id}`);
    toast.success("Usunięto");
    load();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <form onSubmit={submit} className="brand-card p-6 space-y-4" data-testid="admin-news-form">
        <h3 className="font-headings text-2xl uppercase flex items-center gap-2"><Plus size={18} /> Nowa aktualność</h3>
        <input placeholder="Tytuł" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="admin-news-title" />
        <input placeholder="Skrót" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} required data-testid="admin-news-excerpt" />
        <textarea placeholder="Treść" rows="5" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required data-testid="admin-news-body" />
        <input placeholder="URL obrazka (opcjonalnie)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} data-testid="admin-news-image" />
        <input placeholder="Autor" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
        <button type="submit" className="btn-primary" data-testid="admin-news-submit">Dodaj</button>
      </form>
      <div className="space-y-3" data-testid="admin-news-list">
        {items.map((n) => (
          <div key={n.id} className="brand-card p-4 flex justify-between gap-4 items-start">
            <div className="min-w-0">
              <div className="font-headings uppercase text-lg truncate">{n.title}</div>
              <div className="text-zinc-500 text-xs truncate">{n.excerpt}</div>
            </div>
            <button onClick={() => del(n.id)} className="text-zinc-500 hover:text-[#FF007F]" data-testid={`admin-news-delete-${n.id}`}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== PLAYERS ==============
function PlayersAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", number: 0, position: "MF", photo: "", bio: "", goals: 0, assists: 0, appearances: 0 });
  const load = async () => setItems((await api.get("/players")).data);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/players", { ...form, number: Number(form.number), goals: Number(form.goals), assists: Number(form.assists), appearances: Number(form.appearances) });
      toast.success("Zawodnik dodany");
      setForm({ name: "", number: 0, position: "MF", photo: "", bio: "", goals: 0, assists: 0, appearances: 0 });
      load();
    } catch { toast.error("Błąd"); }
  };

  const del = async (id) => {
    if (!window.confirm("Usunąć?")) return;
    await api.delete(`/players/${id}`);
    toast.success("Usunięto");
    load();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <form onSubmit={submit} className="brand-card p-6 space-y-3" data-testid="admin-player-form">
        <h3 className="font-headings text-2xl uppercase flex items-center gap-2"><Plus size={18} /> Nowy zawodnik</h3>
        <input placeholder="Imię i nazwisko" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="admin-player-name" />
        <div className="grid grid-cols-2 gap-3">
          <input type="number" placeholder="Numer" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required data-testid="admin-player-number" />
          <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} data-testid="admin-player-position">
            <option value="GK">Bramkarz</option>
            <option value="DF">Obrońca</option>
            <option value="MF">Pomocnik</option>
            <option value="FW">Napastnik</option>
          </select>
        </div>
        <input placeholder="URL zdjęcia" value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} />
        <textarea placeholder="Bio" rows="2" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <div className="grid grid-cols-3 gap-3">
          <input type="number" placeholder="Wyst." value={form.appearances} onChange={(e) => setForm({ ...form, appearances: e.target.value })} />
          <input type="number" placeholder="Gole" value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} />
          <input type="number" placeholder="Asysty" value={form.assists} onChange={(e) => setForm({ ...form, assists: e.target.value })} />
        </div>
        <button className="btn-primary" data-testid="admin-player-submit">Dodaj</button>
      </form>
      <div className="space-y-2" data-testid="admin-player-list">
        {items.map((p) => (
          <div key={p.id} className="brand-card p-3 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="font-headings text-2xl text-[#FF007F] w-10 text-center">{p.number}</div>
              <div className="min-w-0">
                <div className="font-headings uppercase truncate">{p.name}</div>
                <div className="text-xs text-zinc-500">{p.position} · {p.goals}G {p.assists}A</div>
              </div>
            </div>
            <button onClick={() => del(p.id)} className="text-zinc-500 hover:text-[#FF007F]" data-testid={`admin-player-delete-${p.id}`}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== MATCHES ==============
function MatchesAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ home_team: "EKIPA Z JEEPA", away_team: "", date: "", venue: "Stadion Miejski", competition: "Liga Okręgowa", status: "scheduled", home_score: "", away_score: "" });
  const [busyId, setBusyId] = useState(null);

  const load = async () => setItems((await api.get("/matches")).data);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.home_score === "") delete payload.home_score; else payload.home_score = Number(payload.home_score);
      if (payload.away_score === "") delete payload.away_score; else payload.away_score = Number(payload.away_score);
      payload.date = new Date(payload.date).toISOString();
      await api.post("/matches", payload);
      toast.success("Mecz dodany");
      setForm({ home_team: "EKIPA Z JEEPA", away_team: "", date: "", venue: "Stadion Miejski", competition: "Liga Okręgowa", status: "scheduled", home_score: "", away_score: "" });
      load();
    } catch { toast.error("Błąd"); }
  };

  const del = async (id) => {
    if (!window.confirm("Usunąć mecz?")) return;
    await api.delete(`/matches/${id}`);
    toast.success("Usunięto");
    load();
  };

  const generateSummary = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/ai/match-summary/${id}`);
      toast.success("Wygenerowano podsumowanie AI");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Błąd generowania");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <form onSubmit={submit} className="brand-card p-6 space-y-3" data-testid="admin-match-form">
        <h3 className="font-headings text-2xl uppercase flex items-center gap-2"><Plus size={18} /> Nowy mecz</h3>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Gospodarze" value={form.home_team} onChange={(e) => setForm({ ...form, home_team: e.target.value })} required data-testid="admin-match-home" />
          <input placeholder="Goście" value={form.away_team} onChange={(e) => setForm({ ...form, away_team: e.target.value })} required data-testid="admin-match-away" />
        </div>
        <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required data-testid="admin-match-date" />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Stadion" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} required />
          <input placeholder="Rozgrywki" value={form.competition} onChange={(e) => setForm({ ...form, competition: e.target.value })} />
        </div>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} data-testid="admin-match-status">
          <option value="scheduled">Zaplanowany</option>
          <option value="finished">Zakończony</option>
        </select>
        {form.status === "finished" && (
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Gole gospodarzy" value={form.home_score} onChange={(e) => setForm({ ...form, home_score: e.target.value })} />
            <input type="number" placeholder="Gole gości" value={form.away_score} onChange={(e) => setForm({ ...form, away_score: e.target.value })} />
          </div>
        )}
        <button className="btn-primary" data-testid="admin-match-submit">Dodaj mecz</button>
      </form>
      <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1" data-testid="admin-match-list">
        {items.map((m) => (
          <div key={m.id} className="brand-card p-4">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <div className="text-xs text-zinc-500 uppercase tracking-[0.18em]">{new Date(m.date).toLocaleString("pl-PL")} · {m.competition}</div>
                <div className="font-headings uppercase truncate">{m.home_team} {m.status === "finished" && <span className="text-[#FF007F]">{m.home_score}:{m.away_score}</span>} {m.away_team}</div>
                <div className="text-xs text-zinc-500 mt-1">Status: {m.status === "finished" ? "Zakończony" : "Zaplanowany"}{m.summary && " · AI ✓"}</div>
              </div>
              <div className="flex gap-2">
                {m.status === "finished" && (
                  <button
                    onClick={() => generateSummary(m.id)}
                    disabled={busyId === m.id}
                    className="text-[#FF007F] hover:text-[#E0006F] disabled:opacity-40 px-2 py-1 border border-[#FF007F]/40 text-xs uppercase tracking-[0.18em] flex items-center gap-1"
                    data-testid={`admin-match-ai-${m.id}`}
                  >
                    {busyId === m.id ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI
                  </button>
                )}
                <button onClick={() => del(m.id)} className="text-zinc-500 hover:text-[#FF007F]"><Trash2 size={16} /></button>
              </div>
            </div>
            {m.summary && (
              <div className="mt-3 pt-3 border-t border-white/5 text-zinc-300 text-sm">{m.summary}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== GALLERY ==============
function GalleryAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ url: "", caption: "" });
  const load = async () => setItems((await api.get("/gallery")).data);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/gallery", form);
      toast.success("Dodano");
      setForm({ url: "", caption: "" });
      load();
    } catch { toast.error("Błąd"); }
  };

  const del = async (id) => {
    if (!window.confirm("Usunąć?")) return;
    await api.delete(`/gallery/${id}`);
    toast.success("Usunięto");
    load();
  };

  return (
    <div>
      <form onSubmit={submit} className="brand-card p-6 space-y-3 mb-8 max-w-xl" data-testid="admin-gallery-form">
        <h3 className="font-headings text-2xl uppercase flex items-center gap-2"><Plus size={18} /> Nowe zdjęcie</h3>
        <input placeholder="URL zdjęcia" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required data-testid="admin-gallery-url" />
        <input placeholder="Podpis (opcjonalnie)" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
        <button className="btn-primary" data-testid="admin-gallery-submit">Dodaj</button>
      </form>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="admin-gallery-list">
        {items.map((g) => (
          <div key={g.id} className="relative aspect-square overflow-hidden border border-white/10 group">
            <img src={g.url} alt="" className="w-full h-full object-cover" />
            <button onClick={() => del(g.id)} className="absolute top-2 right-2 bg-black/80 text-white p-2 hover:bg-[#FF007F] opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`admin-gallery-delete-${g.id}`}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
