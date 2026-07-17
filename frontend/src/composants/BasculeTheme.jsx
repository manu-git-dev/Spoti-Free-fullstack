import { Moon, Sun } from "lucide-react";
import { useTheme, basculerTheme } from "@/lib/theme";

// Interrupteur clair/sombre, pose a deux endroits (bas de l'Aside, menu mobile). Il n'impose pas
// son style de rangee : chaque hote lui passe la `className` qui l'aligne sur ses autres entrees.
//
// C'est un vrai `role="switch"` (et non un simple bouton) : l'etat "coche" (`aria-checked`) porte
// l'information active/inactive pour les lecteurs d'ecran, et la piste + le pouce ne sont que sa
// traduction visuelle (`aria-hidden`). Le libelle visible "Theme" est contenu dans le nom
// accessible "Theme sombre" (WCAG 2.5.3), donc les deux canaux disent la meme chose.
export default function BasculeTheme({ className = "" }) {
  const sombre = useTheme() === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={sombre}
      aria-label="Thème sombre"
      onClick={basculerTheme}
      className={className}
    >
      <span className="flex items-center gap-2">
        {/* L'icone reflete le theme COURANT (lune en sombre, soleil en clair) : un repere
            visuel qui complete la position du pouce. */}
        {sombre ? (
          <Moon className="w-4 h-4 shrink-0" />
        ) : (
          <Sun className="w-4 h-4 shrink-0" />
        )}
        Thème
      </span>

      {/* La piste et le pouce : purement decoratifs. L'etat vit sur le bouton. */}
      <span
        aria-hidden
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          sombre ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            sombre ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
