import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Info, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeaderMobile() {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <header className="relative flex items-center justify-between bg-card border border-border rounded-2xl p-3 m-3 mb-0">
      <Link
        to="/"
        className="text-2xl font-serif font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
      >
        Spoti-Free
      </Link>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setMenuOuvert((prev) => !prev)}
        aria-label="Ouvrir le menu"
        aria-expanded={menuOuvert}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {menuOuvert && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMenuOuvert(false)}
          />
          <nav className="absolute right-0 top-14 z-20 flex flex-col gap-1 w-40 bg-popover text-popover-foreground border border-border rounded-xl p-2 shadow-lg">
            <Link
              to="/a-propos"
              onClick={() => setMenuOuvert(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm"
            >
              <Info className="w-4 h-4" />
              À propos
            </Link>
            <Link
              to="/contact"
              onClick={() => setMenuOuvert(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm"
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
