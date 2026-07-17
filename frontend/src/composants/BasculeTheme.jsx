import { Moon, Sun } from "lucide-react";
import { useTheme, basculerTheme } from "@/lib/theme";

// Bouton clair/sombre, pose a deux endroits (bas de l'Aside, menu mobile). Il n'impose pas son
// style : chaque hote lui passe la `className` qui l'aligne sur ses autres entrees — les deux
// navigations n'ont pas exactement le meme gabarit.
//
// L'icone et le libelle designent l'ACTION, pas l'etat courant : en sombre, on propose de passer
// au clair (un soleil), et inversement. C'est la convention la plus lisible pour ce genre de
// bascule (on montre la sortie, pas la porte ou l'on est).
export default function BasculeTheme({ className = "" }) {
  const sombre = useTheme() === "dark";

  return (
    <button
      type="button"
      onClick={basculerTheme}
      className={className}
      aria-label={sombre ? "Passer au thème clair" : "Passer au thème sombre"}
    >
      {sombre ? (
        <Sun className="w-4 h-4 shrink-0" />
      ) : (
        <Moon className="w-4 h-4 shrink-0" />
      )}
      {sombre ? "Thème clair" : "Thème sombre"}
    </button>
  );
}
