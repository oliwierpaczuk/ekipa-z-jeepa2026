import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black mt-24" data-testid="site-footer">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#FF007F] flex items-center justify-center font-headings text-black text-2xl">EJ</div>
              <div className="font-headings text-3xl">EKIPA Z JEEPA</div>
            </div>
            <p className="text-zinc-400 max-w-md leading-relaxed">
              Klub piłkarski w barwach różowych. Pasja, wspólnota i futbol bez kompromisów.
              Dołącz do naszej rodziny kibiców.
            </p>
          </div>
          <div>
            <div className="label-eyebrow mb-4">Klub</div>
            <ul className="space-y-2 text-zinc-300">
              <li><Link to="/zawodnicy" className="hover:text-[#FF007F]">Zawodnicy</Link></li>
              <li><Link to="/terminarz" className="hover:text-[#FF007F]">Terminarz</Link></li>
              <li><Link to="/wyniki" className="hover:text-[#FF007F]">Wyniki</Link></li>
              <li><Link to="/galeria" className="hover:text-[#FF007F]">Galeria</Link></li>
            </ul>
          </div>
          <div>
            <div className="label-eyebrow mb-4">Kontakt</div>
            <ul className="space-y-3 text-zinc-300 text-sm">
              <li className="flex items-center gap-2"><Mail size={14} /> kontakt@ekipazjeepa.pl</li>
              <li className="flex gap-3 mt-4">
                <a className="hover:text-[#FF007F]" href="#" aria-label="Instagram"><Instagram size={20} /></a>
                <a className="hover:text-[#FF007F]" href="#" aria-label="Facebook"><Facebook size={20} /></a>
                <a className="hover:text-[#FF007F]" href="#" aria-label="YouTube"><Youtube size={20} /></a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-14 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-zinc-500 uppercase tracking-[0.2em]">
          <div>© {new Date().getFullYear()} EKIPA Z JEEPA — Wszelkie prawa zastrzeżone</div>
          <div>Made with passion · #różowo</div>
        </div>
      </div>
    </footer>
  );
}
