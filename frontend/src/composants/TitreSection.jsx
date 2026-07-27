// Le titre d'une section a l'interieur d'une page de contenu (A propos, Mentions legales).
//
// Il vit dans un composant pour une raison tres concrete : `Apropos` et `MentionsLegales`
// definissaient CHACUNE leur propre petit composant `Titre`, avec le meme role mais pas la meme
// taille (`text-2xl` d'un cote, `text-xl` de l'autre). Personne ne l'avait decide — les deux
// pages ont simplement ete ecrites a des moments differents. C'est le mecanisme meme de la
// derive : deux copies du meme markup finissent toujours par ne plus se ressembler.
//
// A ne pas confondre avec `EnTetePage`, qui porte le titre DE LA PAGE (le <h1>, avec son icone).
// Celui-ci est un <h2> : une subdivision a l'interieur de la page.
// Couleur : `text-foreground`, pas `text-primary` (change le 2026-07-27). Le violet de la marque
// sur le fond sombre ne donne qu'un contraste de 3,51 — au-dessus du minimum absolu pour du grand
// texte (3,0), mais tres en dessous du confort, et sur une page entiere de prose il se lisait
// comme delave. La hierarchie d'un titre se porte d'abord par la TAILLE et la GRAISSE ; la
// couleur d'accent est plus utile la ou elle designe une action (les liens, l'en-tete de page).
export default function TitreSection({ children }) {
  return (
    <h2 className="text-2xl font-serif font-bold text-foreground">{children}</h2>
  );
}
