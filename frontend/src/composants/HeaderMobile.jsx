import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Info, Mail } from "lucide-react";

export default function HeaderMobile() {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <header className="relative flex items-center justify-between bg-base-200 rounded-2xl p-3">
      <Link to="/" className="text-xl font-serif font-bold text-primary">
        Spoti-Free
      </Link>

      <button
        onClick={() => setMenuOuvert((prev) => !prev)}
        className="btn btn-ghost btn-circle btn-sm"
        aria-label="Ouvrir le menu"
        aria-expanded={menuOuvert}
      >
        <Menu className="w-5 h-5" />
      </button>

      {menuOuvert && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMenuOuvert(false)}
          />
          <nav className="absolute right-0 top-14 z-20 flex flex-col gap-1 w-40 bg-base-200 border border-base-300 rounded-xl p-2 shadow-lg">
            <Link
              to="/a-propos"
              onClick={() => setMenuOuvert(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-base-300 text-sm"
            >
              <Info className="w-4 h-4" />
              À propos
            </Link>
            <Link
              to="/contact"
              onClick={() => setMenuOuvert(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-base-300 text-sm"
            >
              <Mail className="w-4 h-4" />
              Contact
            </Link>
          </nav>
        </>
      )}
    </header>
  );
}
