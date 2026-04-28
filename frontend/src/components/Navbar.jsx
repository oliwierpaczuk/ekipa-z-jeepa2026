import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Menu, X, LogOut, Shield } from "lucide-react";

const links = [
  { to: "/", label: "Start" },
  { to: "/aktualnosci", label: "Aktualności" },
  { to: "/zawodnicy", label: "Zawodnicy" },
  { to: "/terminarz", label: "Terminarz" },
  { to: "/wyniki", label: "Wyniki" },
  { to: "/galeria", label: "Galeria" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="glass sticky top-0 z-50" data-testid="site-navbar">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-3 group" data-testid="nav-logo-link">
          <div className="w-9 h-9 bg-[#FF007F] flex items-center justify-center font-headings text-black text-xl">EJ</div>
          <div className="leading-none">
            <div className="font-headings text-xl md:text-2xl tracking-tight">EKIPA Z JEEPA</div>
            <div className="text-[10px] tracking-[0.28em] text-zinc-400 uppercase">Klub Piłkarski</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              data-testid={`nav-link-${l.to.replace("/", "") || "home"}`}
              className={({ isActive }) =>
                `px-4 py-2 text-sm uppercase tracking-[0.18em] font-headings transition-colors ${
                  isActive ? "text-[#FF007F]" : "text-zinc-300 hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user && user !== false ? (
            <>
              <Link to="/admin" className="hidden md:inline-flex btn-secondary !py-2 !px-4 text-xs" data-testid="nav-admin-link">
                <Shield size={14} /> Panel
              </Link>
              <button onClick={logout} className="hidden md:inline-flex btn-secondary !py-2 !px-4 text-xs" data-testid="nav-logout-btn">
                <LogOut size={14} /> Wyloguj
              </button>
            </>
          ) : (
            <Link to="/login" className="hidden md:inline-flex btn-primary !py-2 !px-4 text-xs" data-testid="nav-login-link">
              Logowanie
            </Link>
          )}
          <button
            className="lg:hidden btn-secondary !py-2 !px-3"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            data-testid="nav-mobile-toggle"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/5 bg-black/90" data-testid="nav-mobile-menu">
          <div className="flex flex-col px-6 py-4 gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-3 font-headings uppercase tracking-[0.18em] text-sm ${
                    isActive ? "text-[#FF007F]" : "text-zinc-200"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="border-t border-white/5 mt-2 pt-3 flex gap-2">
              {user && user !== false ? (
                <>
                  <Link to="/admin" onClick={() => setOpen(false)} className="btn-secondary !py-2 !px-4 text-xs flex-1 justify-center">
                    Panel
                  </Link>
                  <button onClick={() => { setOpen(false); logout(); }} className="btn-secondary !py-2 !px-4 text-xs flex-1 justify-center">
                    Wyloguj
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="btn-primary !py-2 !px-4 text-xs flex-1 justify-center">
                  Logowanie
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
