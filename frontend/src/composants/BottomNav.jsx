import { NavLink, } from "react-router-dom";
import { Home, Library, ListMusic, Heart, User } from "lucide-react";

export default function BottomNav() {
  const tabs = [
    { to: "/", label: "Accueil", icon: Home, end: true },
    { to: "/bibliotheque", label: "Biblio", icon: Library },
    {
      to: "/playlists",
      label: "Playlists",
      icon: ListMusic,
    },
    {
      to: "/favoris",
      label: "Favoris",
      icon: Heart,
    },
    { to: "/profil", label: "Profil", icon: User },
  ];

  return (
    // Les marges du bas et des cotes tiennent compte des zones ou le systeme dessine ses
    // propres elements : l'indicateur d'accueil des iPhone sans bouton en bas, l'encoche en
    // paysage sur les cotes. `max(21px, env(...))` garde l'espacement voulu quand ces zones
    // sont nulles (Android, iPhone a bouton, navigateur de bureau) et l'elargit juste ce qu'il
    // faut sinon — plutot qu'une valeur en dur qui laisse la barre collee a l'indicateur.
    //
    // Ces `env()` ne valent quelque chose QUE parce que le `<meta name="viewport">` de
    // index.html porte `viewport-fit=cover`. Sans lui, iOS les renvoie a 0 et ces protections
    // ne font rien du tout — c'etait le cas avant le 2026-07-22.
    <div className="pt-3 pb-[max(21px,env(safe-area-inset-bottom))] pl-[max(21px,env(safe-area-inset-left))] pr-[max(21px,env(safe-area-inset-right))] bg-background">
      <nav className="flex items-center gap-1 h-[62px] bg-card border border-border rounded-[36px] p-1">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className={({ isActive }) => {
              return `flex flex-1 flex-col items-center justify-center gap-1 h-full rounded-[26px] transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`;
            }}
          >
            <Icon className="w-[18px] h-[18px]" />
            <span className="text-[9px] font-semibold uppercase tracking-wide">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
