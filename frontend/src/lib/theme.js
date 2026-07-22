import { useSyncExternalStore } from "react";

// Le theme vit sur la classe `dark` de <html> (c'est la variante Tailwind declaree dans
// index.css : `@custom-variant dark (&:is(.dark *))`). Les valeurs des deux palettes sont deja
// definies la-bas : `:root` = clair, `.dark` = sombre. Ce module ne fait donc que LIRE et
// BASCULER cette classe — il ne touche a aucune couleur.
//
// Le theme est applique une premiere fois AVANT le rendu de React, par `public/theme-init.js`
// (charge en tete de index.html) : sinon la page s'afficherait brievement en clair (le `:root`)
// avant que le script ne monte, le fameux "flash of unstyled content". Ici, on reprend juste la
// main dessus.
//
// Sombre par defaut (tranche avec Manuel) : seul un choix explicite memorise ("light") passe en
// clair. La meme regle est ecrite dans public/theme-init.js — les deux doivent rester d'accord.

const CLE = "theme";
const EVENEMENT = "theme-change";

export function themeActuel() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function appliquerTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(CLE, theme);
  // Les boutons de bascule (bas de l'Aside, menu mobile) s'abonnent a cet evenement pour se
  // reafficher. Un changement de classe sur <html> n'est pas un etat React : sans ce signal,
  // rien ne redemanderait a React de relire le theme.
  window.dispatchEvent(new Event(EVENEMENT));
}

export function basculerTheme() {
  appliquerTheme(themeActuel() === "dark" ? "light" : "dark");
}

// `useSyncExternalStore` est l'outil prevu pour lire une source d'etat EXTERNE a React (ici la
// classe sur <html>, modifiee hors du cycle de rendu). On lui donne de quoi s'abonner aux
// changements et de quoi lire la valeur courante ; il gere le reste.
function sAbonner(rappel) {
  window.addEventListener(EVENEMENT, rappel);
  return () => window.removeEventListener(EVENEMENT, rappel);
}

export function useTheme() {
  return useSyncExternalStore(sAbonner, themeActuel);
}
