import {
  Heart,
  Home,
  Library,
  ListMusic,
  Plus,
  Info,
  Mail,
  User,
  UploadCloud,
  ShieldCheck,
  LayoutDashboard,
  Music,
  Scale,
} from "lucide-react";
import { NavLink, useMatch } from "react-router-dom";
import ButtonAddPlaylist from "./ButtonAddPlaylist";
import Logo from "./Logo";

const lienNav = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
    isActive
      ? "bg-primary/15 text-primary font-semibold"
      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
  }`;

const lienSecondaire = ({ isActive }) =>
  `flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors ${
    isActive
      ? "bg-primary/15 text-primary"
      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
  }`;

// Intitule de section : il donne la hierarchie sans peser visuellement. Volontairement
// discret (petit, en majuscules, encre attenuee) — il structure, il n'attire pas l'oeil.
function Section({ children }) {
  return (
    <p className="shrink-0 px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {children}
    </p>
  );
}

export default function Aside({
  user,
  className = "",
  playlists,
  setPlaylists,
  isPlaying,
}) {
  const isPlaylistsActive = useMatch("/playlists");

  return (
    <aside
      className={`flex-col bg-sidebar border border-border rounded-2xl p-4 gap-3 ${className}`}
    >
      {/* Le logo et les liens de bas de page restent fixes ; c'est la zone du milieu qui
          defile. Sans cela, un admin (9 liens + ses playlists) ferait deborder l'Aside sur un
          petit ecran. */}
      <Logo enLecture={isPlaying} className="shrink-0 px-3 py-1" />

      <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
        {/* --- Ce que l'on vient faire ici tous les jours --- */}
        <Section>Écouter</Section>
        <nav className="flex flex-col gap-0.5 shrink-0">
          <NavLink to="/" end className={lienNav}>
            <Home className="w-5 h-5 shrink-0" />
            Accueil
          </NavLink>
          <NavLink to="/bibliotheque" className={lienNav}>
            <Library className="w-5 h-5 shrink-0" />
            Bibliothèque
          </NavLink>
          <NavLink to="/favoris" className={lienNav}>
            <Heart className="w-5 h-5 shrink-0" />
            Favoris
          </NavLink>
        </nav>

        <div className="h-px w-full bg-border my-2 shrink-0" />

        {/* --- Playlists : la liste peut etre longue, elle a son propre defilement ---
                `shrink-0` est indispensable : dans une colonne flex, un enfant se comprime par
                defaut pour faire tenir ses voisins. Sans lui, ce bloc s'ecrasait a zero et la
                liste des playlists disparaissait purement et simplement. */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <div
            className={`flex items-center rounded-xl transition-colors ${
              isPlaylistsActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {/* Le `gap-3` reprend celui de `lienNav` : ce lien ne peut pas s'en servir (l'etat
                actif est porte par le conteneur, qui accueille aussi le bouton +), mais il doit
                s'aligner au pixel pres sur les icones des autres entrees. */}
            <NavLink
              to="/playlists"
              className="flex flex-1 items-center gap-3 px-3 py-2"
            >
              <ListMusic className="w-5 h-5 shrink-0" />
              Mes playlists
            </NavLink>
            {user && (
              <ButtonAddPlaylist
                playlists={playlists}
                setPlaylists={setPlaylists}
              >
                <Plus className="w-5 h-5" />
              </ButtonAddPlaylist>
            )}
          </div>

          <ul className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
            {playlists.map((playlist) => (
              <li key={playlist.id_playlist}>
                <NavLink
                  to={`/playlists/${playlist.id_playlist}`}
                  className={({ isActive }) =>
                    `block truncate text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`
                  }
                >
                  {playlist.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="h-px w-full bg-border my-2 shrink-0" />

        {/* --- Ce qui touche a SON compte --- */}
        <Section>Mon compte</Section>
        <nav className="flex flex-col gap-0.5 shrink-0">
          <NavLink to="/profil" className={lienNav}>
            <User className="w-5 h-5 shrink-0" />
            Profil
          </NavLink>
          {/* « Mes demandes » n'est PAS ici : la page ne concerne que ceux qui ont deja depose,
              et `Deposer.jsx` y mene par une carte conditionnee a `nbDepots > 0`. Un lien
              permanent vers une page vide pour la majorite des comptes coute plus qu'il ne sert.
              Si on le remet, le remettre AUSSI dans `HeaderMobile.jsx` : sinon la navigation dit
              deux choses differentes selon la taille de l'ecran. */}
          {user && (
            <NavLink to="/deposer" className={lienNav}>
              <UploadCloud className="w-5 h-5 shrink-0" />
              Déposer
            </NavLink>
          )}
        </nav>

        {/* --- L'administration : un espace de travail, pas la raison d'etre du site.
                Elle vient donc en dernier, apres tout ce qui sert a ecouter. --- */}
        {user?.role === "admin" && (
          <>
            <div className="h-px w-full bg-border my-2 shrink-0" />
            <Section>Administration</Section>
            <nav className="flex flex-col gap-0.5 shrink-0">
              <NavLink to="/admin" end className={lienNav}>
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                Tableau de bord
              </NavLink>
              <NavLink to="/admin/depots" className={lienNav}>
                <ShieldCheck className="w-5 h-5 shrink-0" />
                Modération
              </NavLink>
              <NavLink to="/admin/utilisateurs" className={lienNav}>
                <User className="w-5 h-5 shrink-0" />
                Utilisateurs
              </NavLink>
              <NavLink to="/admin/musiques" className={lienNav}>
                <Music className="w-5 h-5 shrink-0" />
                Catalogue
              </NavLink>
            </nav>
          </>
        )}
      </div>

      {/* --- Toujours visible, tout en bas --- */}
      <nav className="flex flex-col gap-0.5 shrink-0 pt-2 border-t border-border">
        <NavLink to="/a-propos" className={lienSecondaire}>
          <Info className="w-4 h-4 shrink-0" /> A propos
        </NavLink>
        <NavLink to="/contact" className={lienSecondaire}>
          <Mail className="w-4 h-4 shrink-0" />
          Contact
        </NavLink>
        <NavLink to="/mentions-legales" className={lienSecondaire}>
          <Scale className="w-4 h-4 shrink-0" />
          Mentions légales
        </NavLink>
      </nav>
    </aside>
  );
}
