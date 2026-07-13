import { NavLink, } from "react-router-dom";
import { Home, Library, ListMusic, Heart, User } from "lucide-react";

export default function BottomNav({ user }) {
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
    <div className="pt-3 px-[21px] pb-[21px] bg-background">
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
