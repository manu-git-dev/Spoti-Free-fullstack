// Applique le theme AVANT le premier rendu, pour eviter le flash clair au chargement
// (la page s'afficherait sinon avec le `:root` clair avant que React ne monte).
// Sombre par defaut : seul un choix explicite memorise ("light") passe en clair.
// Cette regle doit rester d'accord avec src/lib/theme.js.
//
// POURQUOI CE SCRIPT EST DANS UN FICHIER, et plus inline dans index.html :
// la page est servie avec une Content-Security-Policy dont `script-src 'self'` interdit tout
// script inline. Les deux alternatives etaient d'autoriser 'unsafe-inline' (ce qui desactive
// justement la protection anti-XSS que la CSP apporte) ou de declarer l'empreinte SHA-256 du
// script dans la CSP (qui doit alors etre recalculee a chaque modification — un oubli casse le
// theme en silence). Un fichier a part n'a aucun de ces deux defauts.
//
// Il est charge SANS `defer` ni `type="module"` : les deux repousseraient l'execution apres
// l'analyse du document, donc apres le premier rendu — ce qui ramenerait exactement le flash
// qu'on evite ici.
if (localStorage.getItem("theme") !== "light") {
  document.documentElement.classList.add("dark");
}
