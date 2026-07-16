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
export default function TitreSection({ children }) {
  return (
    <h2 className="text-2xl font-serif font-bold text-primary">{children}</h2>
  );
}
