// En-tete de page : le carre degrade avec l'icone de la rubrique, le titre, et un sous-titre
// facultatif. Le modele est celui de la page Favoris.
//
// Il vit dans UN composant parce que trois patterns differents cohabitaient jusqu'ici : ce carre,
// une petite barre verticale degradee (Bibliotheque, Contact, contenu d'une playlist), et rien du
// tout (Playlists). Recopier le markup dans chaque page, c'est se garantir qu'il divergera a
// nouveau des la prochaine page ajoutee.
//
// `actions` accueille ce qui vit a droite du titre (la recherche de la Bibliotheque, le bouton
// "Ajouter une playlist"…). Il ne passe A COTE du titre qu'a partir de `lg` (1024px), pas de `md`
// (768px) : dans la bande tablette, la sidebar (260px) + l'action laissaient trop peu de place, et
// un titre long ("Mes demandes de depot") se cassait en trois lignes. En dessous de `lg`, l'en-tete
// s'empile (titre pleine largeur, action dessous) — le meme comportement que sur mobile.
//
// `actionsLarges` repousse ce passage en rangee de `lg` (1024px) a `xl` (1280px). C'est pour les
// pages dont le bloc `actions` est LARGE : la recherche de la Bibliotheque fait ~480px (champ 384px
// + selecteur d'affichage), elle ne tient pas a cote du titre entre 1024 et ~1080px et le recouvrait.
// On garde donc la barre EMPILEE plus longtemps pour ces pages-la. Les deux jeux de classes sont
// ecrits en toutes lettres (pas construits) pour que le JIT de Tailwind les voie.
const RUPTURES = {
  lg: { conteneur: "lg:flex-row lg:items-center lg:gap-4", actions: "lg:ml-auto lg:w-auto" },
  xl: { conteneur: "xl:flex-row xl:items-center xl:gap-4", actions: "xl:ml-auto xl:w-auto" },
};

// Ce que devient le bloc `actions` tant que l'en-tete est EMPILE (donc sous `lg`, ou sous `xl`
// pour les actions larges). Une seule prop a trois valeurs plutot que deux booleens : les trois
// cas s'excluent, ils repondent a la meme question.
//
//   "sous"      (defaut) — sous le titre. Le cas general : une recherche, un bouton d'ajout…
//                          appartiennent a la page, ils viennent apres son titre.
//   "a_cote"             — sur la MEME ligne que le titre, calees a droite. Reserve a un bloc
//                          etroit (une seule pastille, un avatar) : deux boutons y tiendraient
//                          mal a 390px, et c'est justement pour ca que l'empilement est le
//                          defaut. `items-start` et non `items-center` : le bloc titre fait deux
//                          lignes (titre + sous-titre), un centrage vertical poserait l'avatar
//                          entre les deux au lieu de l'aligner sur le titre.
//   "dessus"             — au-dessus du titre, sur sa propre ligne. Pour une barre de session
//                          qui ne tient pas a cote du titre.
//   "masquees"           — retire, conteneur compris. Pour ce qui est repris ailleurs sur mobile
//                          (l'accueil met sa connexion/inscription dans le menu du HeaderMobile).
//                          Un `hidden` pose sur le CONTENU ne suffirait pas ICI : le conteneur
//                          resterait un enfant du flex, et son `gap-3` ajouterait un vide sous le
//                          titre pour un bloc de hauteur nulle. (A l'interieur du bloc `actions`,
//                          en revanche, un simple `hidden` suffit : l'element masque EST alors le
//                          conteneur flex, et `display:none` le retire entierement du calcul.)
//
// Chaque disposition decrit la LARGEUR du bloc `actions` elle-meme, au lieu de corriger une
// largeur posee en dur ailleurs. Deux utilitaires Tailwind qui reglent la meme propriete
// (`w-full` et `w-auto`) ne s'arbitrent PAS selon leur ordre dans l'attribut `class` : c'est
// l'ordre dans la feuille generee qui tranche, et il ne se lit nulle part dans le JSX. Le
// premier jet posait `w-full shrink-0` en dur puis ajoutait `w-auto` par-dessus — `w-full`
// gagnait, le bloc reclamait toute la largeur SANS pouvoir retrecir, et le titre etait ecrase.
const DISPOSITIONS_MOBILE = {
  sous: { direction: "flex-col", actions: "w-full shrink-0" },
  a_cote: { direction: "flex-row items-start", actions: "ml-auto shrink-0" },
  dessus: { direction: "flex-col-reverse", actions: "w-full shrink-0" },
  masquees: { direction: "flex-col", actions: "w-full shrink-0 max-md:hidden" },
};

export default function EnTetePage({
  icone: Icone,
  titre,
  sousTitre,
  actions,
  classeIcone,
  actionsLarges = false,
  // "sous" | "a_cote" | "dessus" | "masquees" — voir DISPOSITIONS_MOBILE ci-dessus.
  actionsMobile = "sous",
}) {
  const rupture = actionsLarges ? RUPTURES.xl : RUPTURES.lg;
  const mobile = DISPOSITIONS_MOBILE[actionsMobile] ?? DISPOSITIONS_MOBILE.sous;
  return (
    <div className={`flex ${mobile.direction} gap-3 mb-6 ${rupture.conteneur}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Icone className={`w-6 h-6 text-white ${classeIcone ?? ""}`} />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-serif font-bold">{titre}</h1>
          {sousTitre ? (
            <p className="text-sm text-muted-foreground">{sousTitre}</p>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div className={`${mobile.actions} ${rupture.actions}`}>
          {actions}
        </div>
      ) : null}
    </div>
  );
}
