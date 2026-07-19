import { useId, useState } from "react";

// ---------------------------------------------------------------------------
// Palette des graphiques
//
// Deux familles de couleurs, traitees differemment.
//
// 1. Les COULEURS DE SERIES (violet, bleu) portent la donnee. Elles ne sont PAS choisies a
//    l'oeil : validees par script, elles gardent une separation daltonisme (deuteranopie)
//    ΔE 21.6 — tres au-dessus du seuil de 12 — qui ne depend PAS du fond. Elles restent donc
//    identiques dans les deux themes.
//    - `#6c5ce7` : le violet primary du theme, tel quel.
//    - `#5c8fe6` : l'accent bleu, LEGEREMENT assombri (l'accent d'origine #6495ed sortait de la
//      bande de luminosite admise en mode sombre, L 0.675 > 0.67).
//    Ordre FIXE : la 1re serie prend toujours le violet, la 2e le bleu — la couleur suit
//    l'entite, on ne la reattribue jamais selon le classement.
//
// 2. Les couleurs STRUCTURELLES (grille, encre des axes, anneau autour des marques) ne portent
//    aucune donnee : elles doivent juste se poser sur le fond. Elles etaient figees en dur pour
//    le sombre (#23282b, #3a4044…) — ce qui dessinait des traits SOMBRES sur une carte CLAIRE
//    des l'ajout du mode clair. Elles pointent desormais vers les variables du theme, et suivent
//    donc la bascule toutes seules.
//
// Piege technique : une variable CSS ne se resout PAS dans un attribut de presentation SVG
// (`stroke="var(--x)"` est ignore). Ces couleurs passent donc par `style={{ stroke: … }}`, ou
// `var()` est bien interprete — et recalcule au changement de theme sans re-rendu React.
// eslint-disable-next-line react-refresh/only-export-components -- constantes de theme co-localisees avec les graphiques ; impact fast-refresh (dev) uniquement
export const COULEURS = ["#6c5ce7", "#5c8fe6"];

// La surface sur laquelle les graphiques sont poses (carte en `bg-background/50`). Sert d'anneau
// autour des marques et d'ecart entre les barres : dessine dans la couleur du fond, il fond la
// separation au lieu d'ajouter de l'encre. Suit le theme.
const SURFACE = "var(--background)";

const ENCRE_DISCRETE = "var(--muted-foreground)";
const GRILLE = "var(--border)"; // les traits de grille = la couleur des bordures du theme

const formatJour = (valeur) =>
  new Date(valeur).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

// ---------------------------------------------------------------------------
// Courbe temporelle — 1 ou 2 series, un SEUL axe des ordonnees.
//
// Jamais de double axe : deux echelles differentes sur un meme graphique trompent l'oeil (la
// comparaison visuelle devient arbitraire). Ici, visiteurs et pages vues se comptent dans la
// meme unite, ils partagent donc naturellement l'axe.
// ---------------------------------------------------------------------------
export function CourbeTemporelle({ donnees, series, titre, sousTitre }) {
  const id = useId();
  const [survol, setSurvol] = useState(null);

  const L = 640;
  const H = 220;
  const MARGE = { haut: 16, droite: 16, bas: 28, gauche: 40 };
  const largeurTrace = L - MARGE.gauche - MARGE.droite;
  const hauteurTrace = H - MARGE.haut - MARGE.bas;

  if (!donnees.length) {
    return (
      <CarteGraphique titre={titre} sousTitre={sousTitre}>
        <EtatVide message="Pas encore de données sur cette période." />
      </CarteGraphique>
    );
  }

  const maxi =
    Math.max(
      1,
      ...donnees.flatMap((d) => series.map((s) => Number(d[s.cle]) || 0)),
    ) * 1.15;

  const x = (i) =>
    MARGE.gauche +
    (donnees.length === 1 ? largeurTrace / 2 : (i / (donnees.length - 1)) * largeurTrace);
  const y = (v) => MARGE.haut + hauteurTrace - (v / maxi) * hauteurTrace;

  // Graduations : 3 lignes suffisent a donner l'echelle sans encombrer.
  const graduations = [0, maxi / 2, maxi].map((v) => Math.round(v));

  return (
    <CarteGraphique titre={titre} sousTitre={sousTitre} donnees={donnees} series={series}>
      {/* Legende : obligatoire des 2 series. On ne fait jamais reposer l'identite sur la
          seule couleur. */}
      {series.length > 1 ? (
        <ul className="flex flex-wrap items-center gap-4 mb-3">
          {series.map((s, i) => (
            <li key={s.cle} className="flex items-center gap-1.5 text-xs">
              <span
                aria-hidden
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: COULEURS[i] }}
              />
              <span className="text-muted-foreground">{s.libelle}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <svg
        viewBox={`0 0 ${L} ${H}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={titre}
        onMouseLeave={() => setSurvol(null)}
      >
        {/* Grille : trait plein d'un cheveu, jamais en pointilles, toujours en retrait. */}
        {graduations.map((v) => (
          <g key={v}>
            <line
              x1={MARGE.gauche}
              x2={L - MARGE.droite}
              y1={y(v)}
              y2={y(v)}
              style={{ stroke: GRILLE }}
              strokeWidth="1"
            />
            <text
              x={MARGE.gauche - 8}
              y={y(v) + 4}
              textAnchor="end"
              fontSize="10"
              style={{ fill: ENCRE_DISCRETE }}
            >
              {v}
            </text>
          </g>
        ))}

        {/* Dates : seulement la premiere et la derniere — inutile de saturer l'axe. */}
        <text
          x={MARGE.gauche}
          y={H - 8}
          fontSize="10"
          style={{ fill: ENCRE_DISCRETE }}
        >
          {formatJour(donnees[0].jour)}
        </text>
        {donnees.length > 1 ? (
          <text
            x={L - MARGE.droite}
            y={H - 8}
            textAnchor="end"
            fontSize="10"
            style={{ fill: ENCRE_DISCRETE }}
          >
            {formatJour(donnees[donnees.length - 1].jour)}
          </text>
        ) : null}

        {series.map((s, i) => {
          const couleur = COULEURS[i];
          const points = donnees.map(
            (d, j) => `${x(j)},${y(Number(d[s.cle]) || 0)}`,
          );

          return (
            <g key={s.cle}>
              {/* Aire : un lavis a ~10% d'opacite, jamais un aplat sature. */}
              <polygon
                points={`${MARGE.gauche},${y(0)} ${points.join(" ")} ${x(donnees.length - 1)},${y(0)}`}
                fill={couleur}
                opacity="0.1"
              />
              {/* Ligne : 2px, jointures arrondies. */}
              <polyline
                points={points.join(" ")}
                fill="none"
                stroke={couleur}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Point final : marque >= 8px, cernee d'un anneau de 2px COULEUR DU FOND, pour
                  rester lisible la ou deux series se croisent. */}
              <circle
                cx={x(donnees.length - 1)}
                cy={y(Number(donnees[donnees.length - 1][s.cle]) || 0)}
                r="4"
                fill={couleur}
                style={{ stroke: SURFACE }}
                strokeWidth="2"
              />
            </g>
          );
        })}

        {/* Couche de survol : une bande invisible par point, plus large que la marque —
            un point de 8px est bien trop petit a viser a la souris. */}
        {donnees.map((d, i) => (
          <rect
            key={`${id}-${i}`}
            x={x(i) - largeurTrace / (2 * Math.max(1, donnees.length - 1))}
            y={MARGE.haut}
            width={largeurTrace / Math.max(1, donnees.length - 1)}
            height={hauteurTrace}
            fill="transparent"
            onMouseEnter={() => setSurvol(i)}
          />
        ))}

        {survol !== null ? (
          <g pointerEvents="none">
            <line
              x1={x(survol)}
              x2={x(survol)}
              y1={MARGE.haut}
              y2={MARGE.haut + hauteurTrace}
              style={{ stroke: GRILLE }}
              strokeWidth="1"
            />
            {series.map((s, i) => (
              <circle
                key={s.cle}
                cx={x(survol)}
                cy={y(Number(donnees[survol][s.cle]) || 0)}
                r="4"
                fill={COULEURS[i]}
                style={{ stroke: SURFACE }}
                strokeWidth="2"
              />
            ))}
          </g>
        ) : null}
      </svg>

      {survol !== null ? (
        <div className="mt-2 rounded-lg border border-border bg-popover px-3 py-2 text-xs">
          <p className="font-medium mb-1">{formatJour(donnees[survol].jour)}</p>
          {series.map((s, i) => (
            <p key={s.cle} className="flex items-center gap-1.5 text-muted-foreground">
              <span
                aria-hidden
                className="w-2 h-2 rounded-full"
                style={{ background: COULEURS[i] }}
              />
              {s.libelle} :{" "}
              <span className="text-foreground font-medium">
                {donnees[survol][s.cle]}
              </span>
            </p>
          ))}
        </div>
      ) : null}
    </CarteGraphique>
  );
}

// ---------------------------------------------------------------------------
// Barres horizontales — une seule serie, donc UNE seule couleur.
//
// On ne colore jamais chaque barre d'une teinte differente : la couleur porterait alors une
// information qui n'existe pas (le rang n'est pas une categorie). La longueur suffit.
// ---------------------------------------------------------------------------
export function BarresClassement({ donnees, cleValeur, titre, sousTitre, suffixe = "" }) {
  const [survol, setSurvol] = useState(null);

  if (!donnees.length) {
    return (
      <CarteGraphique titre={titre} sousTitre={sousTitre}>
        <EtatVide message="Pas encore de données." />
      </CarteGraphique>
    );
  }

  const maxi = Math.max(1, ...donnees.map((d) => Number(d[cleValeur]) || 0));

  return (
    <CarteGraphique titre={titre} sousTitre={sousTitre}>
      <ul className="flex flex-col gap-2.5">
        {donnees.map((d, i) => {
          const valeur = Number(d[cleValeur]) || 0;
          const pourcentage = (valeur / maxi) * 100;

          return (
            <li
              key={`${d.title}-${i}`}
              className="group"
              onMouseEnter={() => setSurvol(i)}
              onMouseLeave={() => setSurvol(null)}
            >
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="truncate text-sm">
                  {d.title}
                  <span className="text-muted-foreground"> — {d.artist}</span>
                </span>
                {/* Etiquette directe sur la valeur : elle remplace un axe entier. */}
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {valeur}
                  {suffixe}
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-muted/40">
                <div
                  className="h-2 rounded-full transition-[width] duration-500"
                  style={{
                    width: `${Math.max(2, pourcentage)}%`,
                    background: COULEURS[0],
                    opacity: survol === null || survol === i ? 1 : 0.55,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </CarteGraphique>
  );
}

// ---------------------------------------------------------------------------
// Colonnes — une serie (ex : inscriptions par jour).
// ---------------------------------------------------------------------------
export function Colonnes({ donnees, cleValeur, titre, sousTitre }) {
  const [survol, setSurvol] = useState(null);

  if (!donnees.length) {
    return (
      <CarteGraphique titre={titre} sousTitre={sousTitre}>
        <EtatVide message="Pas encore de données sur cette période." />
      </CarteGraphique>
    );
  }

  const maxi = Math.max(1, ...donnees.map((d) => Number(d[cleValeur]) || 0));

  return (
    <CarteGraphique titre={titre} sousTitre={sousTitre}>
      <div className="flex items-end gap-[2px] h-[140px]">
        {donnees.map((d, i) => {
          const valeur = Number(d[cleValeur]) || 0;
          const hauteur = Math.max(3, (valeur / maxi) * 100);

          return (
            <div
              key={i}
              className="relative flex-1 flex items-end"
              style={{ height: "100%" }}
              onMouseEnter={() => setSurvol(i)}
              onMouseLeave={() => setSurvol(null)}
            >
              {/* Barre : bout arrondi (4px) cote donnee, carre sur la ligne de base.
                  L'ecart de 2px entre colonnes est fait par `gap`, dans la couleur du fond —
                  jamais par une bordure. */}
              <div
                className="w-full rounded-t transition-opacity"
                style={{
                  height: `${hauteur}%`,
                  maxWidth: "24px",
                  margin: "0 auto",
                  background: COULEURS[0],
                  opacity: survol === null || survol === i ? 1 : 0.55,
                }}
              />
              {survol === i ? (
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2 py-1 text-xs">
                  <span className="font-medium">{valeur}</span>{" "}
                  <span className="text-muted-foreground">
                    le {formatJour(d.jour)}
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{formatJour(donnees[0].jour)}</span>
        {donnees.length > 1 ? (
          <span>{formatJour(donnees[donnees.length - 1].jour)}</span>
        ) : null}
      </div>
    </CarteGraphique>
  );
}

// ---------------------------------------------------------------------------
// Habillage commun + vue tableau
//
// Chaque graphique expose ses donnees sous forme de tableau : c'est l'echappatoire quand la
// couleur ou la forme ne passent pas (lecteur d'ecran, impression, daltonisme severe).
// ---------------------------------------------------------------------------
function CarteGraphique({ titre, sousTitre, children, donnees, series }) {
  const [tableau, setTableau] = useState(false);

  return (
    <section className="rounded-2xl border border-border bg-background/50 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold">{titre}</h2>
          {sousTitre ? (
            <p className="text-xs text-muted-foreground">{sousTitre}</p>
          ) : null}
        </div>

        {donnees && series ? (
          <button
            type="button"
            onClick={() => setTableau((v) => !v)}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            {tableau ? "Voir le graphique" : "Voir le tableau"}
          </button>
        ) : null}
      </div>

      {tableau && donnees && series ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Jour</th>
                {series.map((s) => (
                  <th key={s.cle} className="pb-2 font-medium text-right">
                    {s.libelle}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donnees.map((d, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-1.5">{formatJour(d.jour)}</td>
                  {series.map((s) => (
                    <td key={s.cle} className="py-1.5 text-right tabular-nums">
                      {d[s.cle]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function EtatVide({ message }) {
  return (
    <div className="flex items-center justify-center h-[140px] text-sm text-muted-foreground">
      {message}
    </div>
  );
}
