# Suivi du projet

Etat d'avancement et prochaines etapes, pour reprendre le travail sans perdre le fil -
peu importe la machine utilisee. Mis a jour au fil de l'eau (pas un historique complet,
voir les commits Git et `NOTES-APPRENTISSAGE.md` pour ca).

## EN SUSPENS — a lire en premier (mis a jour le 2026-07-18, fin de session)

> Ce qui attend une decision ou du travail. **Rien de ce qui est fait ne figure ici** : c'est
> dans les commits et `NOTES-APPRENTISSAGE.md`. Tenu a jour a chaque fin de session (protocole
> dans `CLAUDE.md`). Manuel dit « reprenons » -> Claude restitue cette liste.

### En attente d'une DECISION de Manuel

- **Agent de relecture** (`.claude/agents/relecteur.md`) : relirait un diff AVANT commit contre les
  invariants du projet (surfaces, `apiFetch`, licence `NOT NULL`, fichiers partages jamais
  supprimes…) — ce qu'un relecteur generique ignore. Discute le 2026-07-17, pas cree. **En attente
  du feu vert** (le monter sur ce projet, ou en perso).
- **Note d'apprentissage a ecrire ?** (question posee le 2026-07-18, sans reponse) : Claude a propose de
  consigner dans `NOTES-APPRENTISSAGE.md` la lecon « echantillonnage discret vs paliers de rupture »
  (des captures a 5 largeurs isolees avaient rate le bug d'en-tete de la bande 1024-1077px). A decider.

### En attente de TRAVAIL

- **PROCHAINE GROSSE SESSION — test d'architecture archi-complet de toute l'app** (dicte par Manuel
  le 2026-07-18, a attaquer a la reprise) : une revue de fond de bout en bout (architecture + tests)
  de l'application entiere, page par page et flux par flux. C'est LE gros chantier de la reprise.
- **Passe responsive + tests manuels** (#7/#8) : **la passe automatisee est faite** le 2026-07-18 —
  13 pages x 5 largeurs (390/820/1440/1920/2560) mesurees (**0 debordement, 0 erreur JS**) + captures,
  etats remplis (favoris/playlists/detail) verifies, et **deux bugs d'en-tete corriges** : titre casse
  en 3 lignes sur tablette (-> seuil `lg`) et recherche de la Bibliotheque qui recouvrait le titre en
  1024-1077px (-> seuil `xl` via la nouvelle prop `actionsLarges` de `Page`/`EnTetePage`). **Restent
  deux verifications HUMAINES** que les captures ne remplacent pas :
  - le **vrai test tactile du lecteur sur le tel de Manuel** (la cible au doigt, pas la mise en page) —
    toujours bloque par le wifi de l'armee (isole les clients ; hotspot du tel KO, l'iPhone route par la 4G) ;
  - la **verif visuelle des grands ecrans (1920/2560) sur le PC de la formation** — Manuel n'a pas
    d'ecran plus grand que son portable a la maison. Les captures 2560 sont saines, mais il veut voir en vrai.
- **Passe d'accessibilite** (#20) : irregulier (des `aria-label` par endroits, pas partout ; le lecteur
  n'est probablement pas pilotable au clavier). Note du 2026-07-18 : les boutons de transport **desktop**
  font **16-20px** (icone seule, sans padding) — cible souris petite, a agrandir dans cette passe (le
  plein ecran mobile, lui, est correct). C'est le manque « invisible » qui compte le plus en entretien.

### A faire par MANUEL (bloquant pour la mise en ligne)

- **⚠️ RAPPEL AVANT DEPLOIEMENT — coordonnees de l'HEBERGEUR dans `MentionsLegales.jsx`** (#11) :
  directeur de publication (Manuel Mattana) et contact (renvoi vers `/contact`) sont **faits** le
  2026-07-18. Reste **le seul `A_COMPLETER`** : nom + adresse + telephone de l'hebergeur, a prendre
  sur la page legale d'Hostinger / le mail de commande **une fois le paiement passe** (#12). Manuel a
  explicitement demande qu'on le lui **rappelle avant tout deploiement** : les mentions legales sont
  incompletes tant que ce bloc reste en `A_COMPLETER`.
- **La validation du paiement Hostinger** (#12) : la seule chose qui bloque encore le deploiement
  cote machine.

### Decisions reportees (avec leur raison)

- **Auth : `localStorage` -> cookie `httpOnly`** (#9, tranche le 2026-07-18) : on **garde
  `localStorage`** pour l'instant — choix courant et defendable sur une vitrine sans donnees
  sensibles, et surtout **explicable en entretien**. La migration cookie `httpOnly` (la solution
  idiomatique) se fera **APRES le deploiement** : c'est exactement le genre de changement qui casse
  l'authentification, et on ne debugge pas une auth cassee le soir d'une mise en ligne. Raisonnement
  complet : **note 67** de `NOTES-APPRENTISSAGE.md`.
- **Panneau « file d'attente » visible** (#19, tranche le 2026-07-18) : APRES le deploiement.
  **Modele retenu = Spotify** (tranche par Manuel), pas « afficher le contexte tel quel » : deux
  listes distinctes — le *contexte* (`currentQueue` actuel : la playlist/le catalogue d'ou on a
  lance) et une *file « a suivre »* que l'utilisateur alimente (`Ajouter a la file`), prioritaire sur
  la suite du contexte puis videe une fois jouee. Reporte pour la meme raison que l'auth (note 67) :
  la version propre **refactore le coeur de la lecture**, la zone la mieux couverte par les tests de
  non-regression (shuffle/repeat), et on ne refactore pas ca juste avant une mise en ligne. C'est une
  amelioration, pas un bloquant.
  - **Cle d'architecture a ne pas reperdre** : la file utilisateur est un **tableau separe sans index
    derive** -> la reorganisation (drag) y est triviale, le piege « index vs id » ne touche que le
    contexte (qu'on ne reordonne jamais). MAIS : `currentIndex` est aujourd'hui *derive* de
    `currentMusic` par `findIndex` (`App.jsx:214`), ce qui suppose que le titre courant est toujours
    dans `currentQueue`. Des qu'un titre vient de la file utilisateur (hors contexte), `findIndex`
    renvoie -1. Il faut donc **remplacer le `currentIndex` derive par un pointeur de contexte
    explicite** qui reste fige pendant qu'on depile la file utilisateur, et ne reprend qu'a
    l'epuisement de celle-ci. C'est LA decision de conception du chantier.
  - Restait a trancher cote UI (repris a la reprise) : placement propose par Claude = **3e colonne
    grille a droite** (bureau) + **dans le Dialog plein ecran existant** (mobile) ; drag = `@dnd-kit`
    (effet vitrine) vs boutons haut/bas (a11y gratuite, cocherait #20) ; persistance = en memoire.
- **Pagination du catalogue** (#13) : APRES le deploiement. A 100 morceaux elle ne resout rien
  (`GET /api/musics` ~35 Ko) et casserait la recherche + le tri (cote client) et **la file du
  lecteur** (`TrackRow` fait `setCurrentQueue(queue)` avec le catalogue entier). Necessaire vers
  300-500 morceaux.
- **Monter le catalogue au-dela de 100** (#14) : necessite la pagination d'abord (~6 Mo/morceau ;
  100 = 590 Mo, 300 = ~2 Go).
- **Tags non classes a l'import** (#15) : `indie`, `filmscore`… finissent sans genre. Assume — le
  script les liste a chaque import ; si l'un revient souvent, c'est qu'il manque une famille dans
  `GENRES`.