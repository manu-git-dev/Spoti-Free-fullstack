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
export default function EnTetePage({
  icone: Icone,
  titre,
  sousTitre,
  actions,
  classeIcone,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 mb-6">
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
        <div className="lg:ml-auto w-full lg:w-auto shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}
