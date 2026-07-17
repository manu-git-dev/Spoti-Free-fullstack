import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  Info,
  Mail,
  UploadCloud,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Music,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";

// Ce menu est le SEUL acces mobile aux pages absentes de la BottomNav.
//
// La BottomNav ne porte que les 5 onglets principaux (Accueil, Bibliotheque, Playlists,
// Favoris, Profil), et l'Aside — qui contient tout le reste — est masquee sous `md`. Sans ce
// menu, "Déposer", "Mes demandes" et TOUT l'espace d'administration etaient donc inaccessibles
// depuis un telephone : il fallait taper l'URL a la main.
export default function HeaderMobile({ user, isPlaying }) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  const fermer = () => setMenuOuvert(false);

  const lien =
    "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm";

  return (
    <header className="relative flex items-center justify-between bg-card border border-border rounded-2xl p-3 m-3 mb-0">
      <Logo enLecture={isPlaying} tailleTexte="text-2xl" tailleBarres="h-5" />

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
          <div className="fixed inset-0 z-10" onClick={fermer} />

          <nav className="absolute right-0 top-14 z-20 flex flex-col gap-1 w-56 max-h-[70vh] overflow-y-auto bg-popover text-popover-foreground border border-border rounded-xl p-2 shadow-lg">
            {user ? (
              <>
                {/* Pas de « Mes demandes » ici, comme dans l'Aside : `Deposer.jsx` y mene par
                    une carte conditionnee a `nbDepots > 0`. Les deux navigations doivent dire la
                    meme chose — un lien present sur mobile et absent sur bureau (ou l'inverse)
                    est un piege pour la suite. */}
                <Link to="/deposer" onClick={fermer} className={lien}>
                  <UploadCloud className="w-4 h-4" />
                  Déposer une musique
                </Link>
                <div className="h-px bg-border my-1" />
              </>
            ) : null}

            {/* Affichage conditionnel = confort. La protection reelle reste `adminMiddleware`,
                cote serveur. */}
            {user?.role === "admin" ? (
              <>
                <p className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Administration
                </p>
                <Link to="/admin" onClick={fermer} className={lien}>
                  <LayoutDashboard className="w-4 h-4" />
                  Tableau de bord
                </Link>
                <Link to="/admin/depots" onClick={fermer} className={lien}>
                  <ShieldCheck className="w-4 h-4" />
                  Modération
                </Link>
                <Link
                  to="/admin/utilisateurs"
                  onClick={fermer}
                  className={lien}
                >
                  <Users className="w-4 h-4" />
                  Utilisateurs
                </Link>
                <Link to="/admin/musiques" onClick={fermer} className={lien}>
                  <Music className="w-4 h-4" />
                  Catalogue
                </Link>
                <div className="h-px bg-border my-1" />
              </>
            ) : null}

            <Link to="/a-propos" onClick={fermer} className={lien}>
              <Info className="w-4 h-4" />À propos
            </Link>
            <Link to="/contact" onClick={fermer} className={lien}>
              <Mail className="w-4 h-4" />
              Contact
            </Link>
            <Link to="/mentions-legales" onClick={fermer} className={lien}>
              <Scale className="w-4 h-4" />
              Mentions légales
            </Link>
          </nav>
        </>
      )}
    </header>
  );
}
