import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock } from "lucide-react";

function formatErr(detail) {
  if (!detail) return "Coś poszło nie tak.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  return String(detail);
}

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  if (user && user !== false) return <Navigate to="/admin" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      nav("/admin");
    } catch (err) {
      setError(formatErr(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16" data-testid="login-page">
      <div className="w-full max-w-md brand-card p-8 md:p-10">
        <div className="flex items-center gap-2 mb-2 text-[#FF007F]"><Lock size={16} /><span className="label-eyebrow">Panel Klubu</span></div>
        <h1 className="font-headings text-4xl uppercase mb-8">Logowanie</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-1 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="login-email" autoComplete="email" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-1 block">Hasło</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="login-password" autoComplete="current-password" />
          </div>
          {error && <div className="text-red-400 text-sm border border-red-400/30 bg-red-400/5 px-3 py-2" data-testid="login-error">{error}</div>}
          <button type="submit" disabled={busy} data-testid="login-submit" className="btn-primary w-full justify-center disabled:opacity-50">
            {busy ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>
        <div className="mt-6 text-xs text-zinc-500 border-t border-white/5 pt-4">
          Demo: <span className="text-zinc-300">admin@ekipazjeepa.pl</span> / <span className="text-zinc-300">admin123</span>
        </div>
      </div>
    </div>
  );
}
