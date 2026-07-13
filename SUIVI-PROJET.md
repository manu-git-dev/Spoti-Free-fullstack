# Suivi du projet

Etat d'avancement et prochaines etapes, pour reprendre le travail sans perdre le fil -
peu importe la machine utilisee. Mis a jour au fil de l'eau (pas un historique complet,
voir les commits Git et `NOTES-APPRENTISSAGE.md` pour ca).

## Phase actuelle (au 2026-07-06)

Refonte visuelle mobile-first : **passe complete site-wide faite le 2026-07-06**
(responsive sur toutes les pages + alignement maquette Login/Register/Aside/mini-player).
Fonctionnalites (playlists, likes, Apropos/Contact) et routes protegees deja faites -
voir commits `df8f4ee` et anterieurs.

## Passe responsive + maquette du 2026-07-06 - faite

- Fait : `Favoris.jsx`/`Playlists.jsx`/`MusicsInPlaylist.jsx` - wrapper `p-4 md:p-8`,
  grille `grid-cols-2 md:grid-cols-5`, titres `text-2xl font-serif`, etats vides avec
  `col-span-2 md:col-span-5` (alignes sur le pattern deja en place dans `Home.jsx`/
  `Bibliotheque.jsx`). Plus aucun overflow horizontal verifie a 390px sur ces 3 pages.
- Fait : `Contact.jsx` - padding mobile (`p-4 md:p-12`) et ligne Nom/Mail qui s'empile
  sur mobile (`flex-col md:flex-row`, `w-full md:w-1/2`).
- Fait : `Home.jsx` - boutons temporaires Connexion/Inscription alignes sur la maquette
  ("S'inscrire" en lien texte, "Connexion" en pilule violette `rounded-full`).
- Fait : bug `Aside.jsx` "Mes playlists" corrige - `useMatch("/playlists")` porte
  maintenant l'etat actif sur le `<div>` parent (texte + icone `+` inclus dans le
  meme fond `bg-accent/15`), au lieu du `NavLink` seul. Verifie visuellement (capture
  desktop), autres items de nav non-regresses.
- Fait : `Login.jsx`/`Register.jsx` - refonte visuelle complete alignee sur la maquette
  (cercle degrade + titre serif + sous-titre, champs a icone via le pattern daisyUI v5
  `label.input` + `lucide-react`, largeur responsive `w-full max-w-sm` a la place des
  `w-xl` fixes qui debordaient sur mobile, bouton pilule `btn-primary rounded-full`,
  lien croise Connexion <-> Inscription). Lien "Mot de passe oublie ?" affiche mais mort
  (pas de backend de reset) - assume. Register a maintenant un champ confirmation de mot
  de passe (verif cote front avant submit, testee : message d'erreur si les deux ne
  correspondent pas). `Aside`/`BottomNav`/`MediaPlayer` restent affiches partout comme
  decide precedemment (pas de panneau gauche gradient, pas de plein-ecran).
- Fait : mini-player mobile dans `MediaPlayer.jsx` - barre compacte (vignette + titre/
  artiste + bouton play/pause) affichee au-dessus de la `BottomNav` en mobile, en
  reutilisant le meme `<audio>`/state/handlers que la barre complete desktop (un seul
  bloc composant, deux blocs JSX freres bascules par `md:hidden`/`hidden md:flex`).
  Verifie avec Playwright : un seul noeud `<audio>` a tout moment (mobile et desktop),
  toggle play/pause fonctionnel, barre complete desktop non regressee.
- Verification faite via un script Playwright (dev servers locaux + compte de test
  cree puis supprime de la base) : 7 routes sans overflow a 390px, flow inscription/
  connexion reel teste de bout en bout, Favoris/Playlists verifies en session authentifiee.

Reste ouvert (mineur, non bloquant) :
- Colonne gauche de `Contact.jsx` en texte/liens bruts plutot que les icones-en-rond-
  colore de la maquette - choix visuel assume, pas re-tranche.
- Mini-player mobile : pas de precedent/suivant/volume/seek, juste play/pause (scope
  volontairement reduit par rapport a la barre desktop).

## Passe 2 du 2026-07-06 - lecteur desktop, header, cards/listes conformes a la maquette - faite

Suite a un retour apres la 1ere passe : le lecteur desktop, l'alignement du header, et les
"cards" ne ressemblaient pas a la maquette. En comparant aux captures
`docs/maquette/desktop-*.png`, l'ecart etait plus large qu'un habillage CSS : **Home (Top 5)
et Favoris/le contenu d'une playlist sont en realite des LISTES** (rang, vignette,
titre/artiste, icones cœur/plus), pas une grille de cards - seule **Bibliotheque reste une
grille**, avec un style de card different (fond uni `bg-base-200`, plus de bordure bleue,
image carree encadree, juste icones en bas).

- Fait : `Card.jsx` restyle (grille, utilise uniquement par `Bibliotheque.jsx` desormais) -
  fond `bg-base-200`, plus de bordure bleue, image carree, titre/artiste discrets, icones
  cœur/plus alignees a droite en bas (plus de gros boutons texte colores).
- Fait : `ButtonLike.jsx`/`AddMusicPlaylist.jsx`/`RemoveMusicPlaylist.jsx` - boutons texte
  remplaces par des icones (`Heart`/`Plus`/`Trash2`, lucide-react), meme logique/fetch/state
  qu'avant, seule la presentation change.
- Fait : nouveau composant `composants/TrackRow.jsx` - ligne de liste (rang, vignette,
  titre/artiste, cœur/plus) pour les contextes "liste" (Home Top 5, Favoris, contenu d'une
  playlist). Pas de colonne "ecoutes"/"duree" comme sur la maquette : aucune des deux
  donnees n'existe reellement cote backend (`duration` referencee dans `musicRoute.js`
  mais colonne absente de la table `musics` en base - route deja cassee, hors scope) - pas
  de donnee fantaisiste affichee a la place.
- Fait : `Home.jsx`/`Favoris.jsx`/`MusicsInPlaylist.jsx` reconnectes sur `TrackRow` (liste
  `flex flex-col`) au lieu de la grille `Card`/`ListesCard`. `Bibliotheque.jsx` inchange
  (reste une grille, herite du nouveau style de `Card.jsx`). `Playlists.jsx` (grille de
  tuiles de playlists, pas de pistes) laisse tel quel - aucune maquette n'existe pour cet
  ecran.
- Fait : `Home.jsx` - boutons Connexion/Inscription (temporaires) colles a droite
  (`justify-end w-full`).
- Fait : `MediaPlayer.jsx` - barre desktop entierement reconstruite sur 2 rangees fidele a
  la maquette (vignette+titre/artiste a gauche, precedent/lecture(bouton rond)/suivant au
  centre, icone volume+slider a droite, rangee temps/seek en dessous). Reutilise
  integralement `handlePlay`/`handleNext`/`handlePrevious`/`audioRef` deja partages avec le
  mini-player mobile - aucun changement de logique.
- Verifie avec Playwright (compte de test cree puis supprime) : navigation SPA reelle
  (clics sur les liens de la sidebar, pas de rechargement de page) confirmee sans
  interruption de lecture (meme `<audio>`, `isPlaying` conserve) ; precedent/suivant
  testes (`Around the World` -> `Bad Guy` -> `Believer` -> retour `Bad Guy`) ; capture des
  nouveaux styles Bibliotheque/Home/Favoris/lecteur comparee a la maquette.

## Page Profil + toggle liste/grille Bibliotheque du 2026-07-13 - faite

- Fait : route backend `GET /api/users/profil` (`userRoute.js`) protegee par
  `authMiddleware`, filtree sur `req.user.id_user` (pas de parametre d'URL, evite l'IDOR).
- Fait : nouvelle page `frontend/src/pages/Profil.jsx` - avatar en cercle dégradé
  `primary -> accent` avec l'initiale du pseudo, prenom/nom/pseudo/email, stats
  (playlists/favoris/membre depuis), bouton Deconnexion restyle (`Deconnexion.jsx`, pilule
  contour `error` + icone `LogOut`, partage avec `Home.jsx`). Route `/profil` volontairement
  **publique** (pas de `ProtectedRoute`) - `Profil.jsx` gere lui-meme l'etat invite (message
  + liens Connexion/Inscription) si `user === null`, pour que l'onglet Profil de la
  `BottomNav` ait un sens meme deconnecte sur mobile.
- Fait : simplification de `BottomNav.jsx` - l'onglet Profil pointe desormais
  inconditionnellement vers `/profil` (avant : `/connexion` en dur) ; suppression du hack
  `redirectedFromProtected`/`fromProtected` qui n'existait que pour compenser cette
  redirection forcee.
- Fait : petit avatar rond (lien vers `/profil`) ajoute a cote du bouton
  Deconnexion dans `Home.jsx`, visible seulement si connecte (pas de doublon avec les
  boutons Connexion/Inscription pour un visiteur).
- Fait : suppression de `composants/Header.jsx` (code mort, plus utilise depuis le passage
  de la nav desktop sur `Aside.jsx`).
- Fait : `Bibliotheque.jsx` - toggle d'affichage liste/grille (`useState viewMode`, defaut
  `"liste"`). Mode liste reutilise `TrackRow` (meme pattern que le Top 5 de `Home.jsx`,
  `.map` avec `index` pour le rang) ; mode grille inchange (`ListesCard`/`Card.jsx`). Toggle
  stylise en pilule `bg-base-200` avec icones `List`/`LayoutGrid` (lucide-react), calque sur
  le style des tabs de `BottomNav`/`Aside`.

Les deux points "reste ouvert" de cette passe (bug Rules of Hooks dans `Profil.jsx`, lien
Profil manquant dans `Aside.jsx`) ont ete corriges le jour meme, voir section suivante.

## File de lecture contextuelle, invite sur Favoris/Playlists, duree des pistes - 2026-07-13

- Fait : bug Rules of Hooks corrige dans `Profil.jsx` (le test sur `token` est deplace a
  l'interieur du `useEffect`, dependance `[token]`).
- Fait : lien "Profil" ajoute dans `Aside.jsx` (4e item du groupe de nav principal, sous
  Favoris), conforme a la maquette.
- Fait : **file de lecture contextuelle**. Avant, `MediaPlayer` naviguait toujours (next/
  precedent) dans `musiquesFiltre` (bibliotheque complete triee alphabetiquement), peu
  importe la liste depuis laquelle la lecture avait ete lancee - Top 5, Favoris, playlist
  et Bibliotheque avaient donc toutes ce bug, pas seulement le Top 5. Nouvel etat
  `currentQueue` dans `App.jsx` ; `TrackRow`/`Card` recoivent une prop `queue` (la liste a
  laquelle ils appartiennent) et appellent `setCurrentQueue(queue)` en plus de
  `setCurrentMusic` au clic. `MediaPlayer` navigue desormais dans cette queue plutot que
  dans la bibliotheque complete.
- Fait : `/favoris` et `/playlists` ne sont plus derriere `ProtectedRoute` - meme pattern
  que `/profil` (voir passe precedente) : `Favoris.jsx`/`Playlists.jsx` gerent elles-memes
  l'etat invite (message + liens Connexion/Inscription) si `user === null`. Corrige au
  passage un bug de nav mobile : en etant deconnecte, cliquer sur Favoris/Playlists dans
  la `BottomNav` redirigeait de force vers `/connexion`, donc aucun onglet ne s'affichait
  actif (on n'etait plus reellement sur la page). `/playlists/:idPlaylist` reste protegee
  (pas de playlists a voir pour un invite de toute facon).
- Fait : colonne `duration` (INT, secondes) ajoutee a la table `musics`, backfillee avec
  les vraies durees des fichiers mp3 (`backend/scripts/backfill-duration.js`, lib
  `music-metadata`, pas de valeurs inventees). `GET /api/musics` la remonte automatiquement
  (`SELECT *`). Affichee dans `TrackRow.jsx`, format `mm:ss` toujours sur 2 chiffres
  (`01:43`).

## Autres points ouverts (pas urgents, a reprendre quand on y arrive)

- Classes couleur encore en dur (`bg-black`, `bg-zinc-800`, `bg-zinc-900`...) dans le
  shell `App.jsx`, pas encore migrees vers les tokens du theme (`base-100/200/300`).
- Top 5 de `Home.jsx` : simple `.slice(0, 5)`, pas un vrai compteur d'ecoutes (aucune
  table/colonne de comptage n'existe encore cote backend - fonctionnalite a part, pour
  plus tard).
- Bug JWT : a l'expiration (2h), le frontend ne deconnecte pas automatiquement
  l'utilisateur - a detecter via un 401/403 sur une route protegee.
- Nettoyage differe : `userRoute.js` a un check admin en dur (`idUser !== 10`, pas de
  role/flag propre) ; `db.js` utilise une connexion unique (`createConnection`) plutot
  qu'un pool (`createPool`), a changer avant un vrai deploiement.
- Codes HTTP a harmoniser : certains cas utilisent `404` alors que `409 Conflict` ou
  `400 Bad Request` seraient plus corrects (ex: doublon dans une playlist, nom vide).
- `AddMusicPlaylist` : pas de filtre cote frontend pour retirer de la liste deroulante
  les playlists qui contiennent deja la musique (le backend bloque deja le doublon, mais
  l'UX pourrait l'empecher avant meme la tentative).
- `event.stopPropagation()` a ajouter sur les boutons imbriques dans des conteneurs
  cliquables (`ButtonLike`/`AddMusicPlaylist`/`RemoveMusicPlaylist` dans `Card.jsx`,
  boutons renommer/supprimer dans `Playlist.jsx`) pour eviter la propagation du clic au
  parent.
- `npm audit` (backend) signale 5 vulnerabilites (1 high, 4 critical) portees par
  `express-generator` (deja present avant la passe du 2026-07-13, pas lie a l'ajout de
  `music-metadata`) - `express-generator` est un outil de scaffolding CLI, pas utilise a
  l'execution par `server.js` ; a nettoyer (retirer la dependance si vraiment inutilisee)
  avant un vrai deploiement.

## Maquette Pencil

Fichier source : `~/Documents/Maquette-Spoti-Free.pen` (hors Git, local a cette machine,
necessite l'app Pencil pour etre edite). Export statique (PNG/JPEG) disponible dans
`docs/maquette/`, consultable sans Pencil et sur n'importe quelle machine - a regenerer
depuis le fichier source si la maquette evolue.

Ecrans maquettes (mobile + desktop pour chacun) : Home, Bibliotheque, Favoris, A propos,
Contact, Connexion, Inscription, Profil (ajoute le 2026-07-13, voir docs/maquette/README.md
pour la note sur l'onglet Profil ajoute a l'Aside desktop). Pas encore maquette : Playlists.
