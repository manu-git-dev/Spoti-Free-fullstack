import {
  Heart,
  Home,
  Library,
  Plus,
  Info,
  Mail,
  User,
  UploadCloud,
  ShieldCheck,
} from "lucide-react";
import { NavLink, useMatch } from "react-router-dom";
import ButtonAddPlaylist from "./ButtonAddPlaylist";

const lienNav = ({ isActive }) =>
  `flex items-center gap-3 text-lg px-3 py-2 rounded-xl transition-colors ${
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

export default function Aside({
  user,
  className = "",
  playlists,
  setPlaylists,
}) {
  const isPlaylistsActive = useMatch("/playlists");

  return (
    <aside
      className={`flex-col bg-sidebar border border-border rounded-2xl p-5 gap-6 ${className}`}
    >
      <NavLink
        to="/"
        className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
      >
        Spoti-Free
      </NavLink>

      <nav className="flex flex-col gap-1">
        <NavLink to="/" end className={lienNav}>
          <Home className="w-5 h-5" />
          Accueil
        </NavLink>
        <NavLink to="/bibliotheque" className={lienNav}>
          <Library className="w-5 h-5" />
          Bibliothèque
        </NavLink>
        <NavLink to="/favoris" className={lienNav}>
          <Heart className="w-5 h-5" />
          Favoris
        </NavLink>
        <NavLink to="/profil" className={lienNav}>
          <User className="w-5 h-5" />
          Profil
        </NavLink>
        {user && (
          <NavLink to="/deposer" className={lienNav}>
            <UploadCloud className="w-5 h-5" />
            Déposer
          </NavLink>
        )}
        {/* Affichage conditionnel = confort. La protection reelle est `adminMiddleware`,
            cote serveur : masquer un lien ne protege rien. */}
        {user?.role === "admin" && (
          <NavLink to="/admin/depots" className={lienNav}>
            <ShieldCheck className="w-5 h-5" />
            Modération
          </NavLink>
        )}
      </nav>

      <div className="h-px w-full bg-border" />

      {/* Bloc playlists : occupe la hauteur restante, la liste scrolle a l'interieur */}
      <div className="flex flex-col gap-1 flex-1 min-h-0">
        <div
          className={`flex items-center rounded-xl transition-colors ${
            isPlaylistsActive
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <NavLink to="/playlists" className="flex-1 text-lg px-3 py-2">
            Mes playlists
          </NavLink>
          {user && (
            <ButtonAddPlaylist playlists={playlists} setPlaylists={setPlaylists}>
              <Plus className="w-5 h-5" />
            </ButtonAddPlaylist>
          )}
        </div>

        <ul className="flex flex-col gap-0.5 overflow-y-auto min-h-0">
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

      <div className="h-px w-full bg-border" />

      <nav className="flex flex-col gap-1">
        <NavLink to="/a-propos" className={lienSecondaire}>
          <Info className="w-4 h-4" /> A propos
        </NavLink>
        <NavLink to="/contact" className={lienSecondaire}>
          <Mail className="w-4 h-4" />
          Contact
        </NavLink>
      </nav>
    </aside>
  );
}
