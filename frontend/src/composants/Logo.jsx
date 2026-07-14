import { NavLink } from "react-router-dom";

// Chaque barre a sa propre hauteur, sa propre duree et son propre retard : sans ca, les quatre
// montent et descendent ensemble — on dirait un accordeon, pas un egaliseur. Ce sont les valeurs
// legerement DESACCORDEES qui donnent l'impression que ca danse.
const BARRES = [
  { hauteur: "55%", duree: "700ms", delai: "0ms" },
  { hauteur: "100%", duree: "500ms", delai: "120ms" },
  { hauteur: "70%", duree: "900ms", delai: "60ms" },
  { hauteur: "85%", duree: "600ms", delai: "200ms" },
];

// Le logo de l'app : un egaliseur qui DANSE quand une musique joue, et retombe au repos sinon.
// L'animation ne tourne donc jamais pour rien — elle dit quelque chose de vrai sur l'etat de
// l'app. `enLecture` vient d'App (voir le "lifting state up" dans App.jsx).
export default function Logo({
  enLecture = false,
  className = "",
  // Le logo est plus petit dans le header mobile que dans l'Aside : la taille se parametre au
  // lieu d'etre figee, sinon il aurait fallu deux composants pour un seul logo.
  tailleTexte = "text-3xl",
  tailleBarres = "h-6",
}) {
  return (
    <NavLink
      to="/"
      className={`group flex items-center gap-2.5 ${className}`}
      aria-label="Spoti-Free — retour à l'accueil"
    >
      {/* Purement decoratif : un lecteur d'ecran n'a rien a y lire, le lien porte deja son nom. */}
      <span
        className={`flex items-end gap-[3px] ${tailleBarres}`}
        aria-hidden="true"
      >
        {BARRES.map((barre, index) => (
          <span
            key={index}
            data-lecture={enLecture}
            className="barre-egaliseur w-[3px] rounded-full bg-gradient-to-t from-primary to-accent"
            style={{
              height: barre.hauteur,
              "--duree-barre": barre.duree,
              "--delai-barre": barre.delai,
            }}
          />
        ))}
      </span>

      {/* Le degrade fait 200% de large : au survol, on le fait GLISSER (`bg-right`) au lieu d'en
          changer les couleurs — le nom semble alors parcouru par un reflet. */}
      <span
        className={`${tailleTexte} font-serif font-bold bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent transition-[background-position] duration-700 group-hover:bg-right`}
      >
        Spoti-Free
      </span>
    </NavLink>
  );
}
