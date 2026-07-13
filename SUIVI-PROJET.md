# Suivi du projet

Etat d'avancement et prochaines etapes, pour reprendre le travail sans perdre le fil -
peu importe la machine utilisee. Mis a jour au fil de l'eau (pas un historique complet,
voir les commits Git et `NOTES-APPRENTISSAGE.md` pour ca).

## Prochaines etapes priorisees (mise a jour 2026-07-13, apres la passe shadcn/Midnight Bloom)

Liste dans l'ordre voulu par Manuel - a traiter dans cet ordre, une fois cette liste
terminee : check/test complet de l'app, puis deploiement (serveur Hostinger a acheter),
puis reflexion sur de nouvelles fonctionnalites pour plus tard.

1. ~~Inscription : confirmation du mot de passe + regles de securite~~ - **fait**.
   La confirmation etait deja implementee (verifie par test : deux mots de passe differents
   bloquent la creation du compte). L'audit du 2026-07-13 a montre que l'API acceptait en
   revanche **n'importe quoi** quand on l'appelait directement : `password: "a"` -> 201, et
   `email: "pas-un-email"` -> 201. Les deux sont desormais valides **cote backend**
   (`POST /api/users/inscription`) : format d'email, et mot de passe d'au moins 8 caracteres.
   La regle des 8 caracteres est volontairement sobre - a durcir si tu veux (majuscule,
   chiffre, caractere special). **A retenir** : `type="email"` et une verification en React ne
   protegent que le navigateur, jamais l'API.
2. ~~Logo "Spoti-Free" trop petit~~ - **fait** (agrandi + degrade primary->accent dans
   `Aside.jsx` et `HeaderMobile.jsx`).
3. ~~`Aside.jsx` - liste "Mes playlists" sans scroll interne~~ - **fait** (le bloc
   playlists prend la hauteur restante, `flex-1 min-h-0` + `overflow-y-auto` sur la liste).
   Reste a verifier de visu avec beaucoup d'entrees.
4. ~~`Playlists.jsx` - contenu trop pauvre~~ - **fait** (vraies cartes : pochette degradee
   generee depuis l'id, actions renommer/supprimer en icones revelees au survol).
5. Revoir le contenu texte de la page A propos (`Apropos.jsx`).
6. ~~Modals au style a revoir~~ - **fait** (actions regroupees dans le `DialogFooter`,
   `Annuler`/`Ajouter` cote a cote au lieu d'un bouton pleine largeur + un footer separe ;
   textes anglais residuels traduits).
7. ~~Messages d'erreur/succes mal affiches~~ - **fait**. Systeme de **toasts global**
   (`sonner`, le standard shadcn) : un seul `<Toaster />` monte dans `App.jsx`, et les
   actions ponctuelles (like/unlike, ajout/retrait dans une playlist, creation/renommage/
   suppression de playlist, deconnexion, formulaire de contact) appellent `toast()`.
   Les `<Alert>` etaient rendues *dans* le composant declencheur - celle de `ButtonLike`/
   `RemoveMusicPlaylist` etait donc rendue dans la `TrackRow` et deformait la ligne.
   `Login.jsx`/`Register.jsx` gardent volontairement leurs `<Alert>` inline : une erreur de
   validation doit rester a cote du champ concerne, ce n'est pas le role d'un toast.
8. ~~Codes de statut HTTP du backend~~ - **fait** (passe complete route par route lors de
   l'audit du 2026-07-13) :
   - like en doublon : `500` -> **`409`** (c'etait la cause visible du bug des likes)
   - musique deja dans une playlist : `404` -> **`409`**
   - nom de playlist vide : `404` -> **`400`** (+ la creation ne validait pas du tout le nom)
   - listes vides (`/likes`, `/playlists`, contenu d'une playlist) : `404` -> **`200 []`**
     (une liste vide est un resultat valide, pas une ressource introuvable)

## Audit complet de l'application - 2026-07-13 - fait

Passe de verification de bout en bout (backend route par route + 21 tests de parcours
Playwright sur l'app reelle). Tout ce qui suit a ete **reproduit** avant d'etre corrige.

### Faille de securite (critique) - corrigee

`POST /api/musics/ajouter`, `PUT /api/musics/update/:id` et `DELETE /api/musics/delete/:id`
n'avaient **aucun middleware**. Verifie en conditions reelles : sans le moindre token, on
pouvait creer, modifier **et supprimer** les musiques du catalogue.

- Nouvelle colonne `users.role` (`user` | `admin`), voir `backend/scripts/add-role-column.sql`
  (a rejouer sur toute autre machine / base).
- Nouveau `adminMiddleware` : relit le role **en base** a chaque requete plutot que de le lire
  dans le JWT, pour qu'un retrait de droits prenne effet immediatement sans attendre
  l'expiration du token.
- Les 3 routes du catalogue + `GET /api/users` passent par `authMiddleware` + `adminMiddleware`
  (`401` sans token, `403` pour un utilisateur normal). Le test `idUser !== 10` code en dur a
  disparu.

### Bug des likes - corrige

Cause : dans `App.jsx`, les effets qui chargent likes et playlists avaient `[]` en dependances
et lisaient `localStorage` a l'interieur. **localStorage n'est pas reactif** : les effets ne se
relancaient donc jamais apres une connexion. `musiquesLikee` restait vide -> les coeurs des
musiques deja likees s'affichaient vides -> recliquer dessus declenchait un `INSERT` en doublon
-> violation de la cle primaire `(id_user, id_music)` -> `500`.

Les deux effets dependent maintenant de `token` (le state). Voir la note 31 de
`NOTES-APPRENTISSAGE.md`.

### Autres bugs corriges

- `GET /api/playlists/musics/:idPlaylist` oubliait `duration` dans son `SELECT` : les durees
  s'affichaient `--:--` dans le contenu d'une playlist.
- `MusicsInPlaylist` : `useEffect` avec `[]` alors qu'il depend de `idPlaylist`. En passant
  d'une playlist a une autre, React Router reutilise le composant sans le remonter -> la page
  affichait le contenu de la **playlist precedente**. Corrige avec `[idPlaylist]`.
- **JWT expire** (l'ancien point ouvert) : le front croyait l'utilisateur connecte ("Bonjour X",
  bouton Deconnexion) alors que chaque action echouait avec "Token invalide". La session est
  desormais purgee des qu'une route protegee repond `401`.
- Les toasts, places en haut a droite, recouvraient les boutons "Connexion"/"Se deconnecter" -
  regression introduite par la passe precedente. Ils sont remontes au-dessus du lecteur.
- `express.json()` ne renseigne `req.body` que si le `Content-Type` est json. Sans ce header,
  toute route POST/PUT levait une `TypeError` et repondait `500` au lieu de `400`. Garde-fou
  global ajoute dans `server.js`.
- Inscription : l'API acceptait `password: "a"` et `email: "pas-un-email"` (201 !). Le
  `type="email"` du formulaire et la verification React ne protegent que le navigateur.
  Validation ajoutee **cote serveur**.

### Robustesse

- `db.js` : `createConnection` -> **`createPool`** (une connexion unique est un point de rupture
  unique : si MySQL la ferme, tout echoue jusqu'au redemarrage). L'API des routes est inchangee.
- `express-generator` retire (outil de scaffolding CLI jamais utilise a l'execution) : il portait
  les 5 vulnerabilites de `npm audit`. **0 vulnerabilite** sur le backend comme sur le frontend.
- Imports morts supprimes (`useState`/`useEffect` dans Favoris et Playlists, `Link` dans App).

### Points restants (non bloquants)

Tous les points listes ici apres l'audit ont ete traites le 2026-07-13 (voir la section
suivante). Restent :

- Le `dist/` du frontend depasse 500 kB : envisager du code-splitting (`dynamic import()`)
  avant un vrai deploiement. Non bloquant.
- `express-rate-limit` compte par IP : derriere un reverse proxy (Nginx, Hostinger), il faudra
  `app.set("trust proxy", 1)` dans `server.js`, sinon toutes les requetes paraitront venir de
  la meme IP (celle du proxy) et la limite bloquerait tout le monde.
- Deploiement : rejouer `backend/scripts/add-role-column.sql` et `add-play-count.sql` sur la
  base de production, et definir `VITE_API_URL` dans l'environnement du frontend.

## Top 5 reel, apiFetch, anti brute-force, a11y, fix de l'Aside - 2026-07-13 - fait

### L'app depassait la hauteur de l'ecran (Aside)

Symptome signale par Manuel : avec beaucoup de playlists, l'Aside grandit et fait deborder
toute l'app. Le scroll interne ajoute a la passe design (`overflow-y-auto`) ne s'activait
jamais.

**Cause** : le shell utilisait `grid-rows-[1fr_88px]`. En CSS Grid, **`1fr` vaut
`minmax(auto, 1fr)`** : ce `auto` en minimum interdit a la ligne de descendre sous la taille
de son contenu. Rien ne contraignait donc jamais la hauteur de l'Aside, et l'`overflow-y-auto`
n'avait aucune raison de s'activer. Corrige avec **`minmax(0, 1fr)`**.

Mesure avec 15 playlists : page = 900px pour un ecran de 900px (et 720/720 en 1280x720), la
liste scrolle a l'interieur, "A propos"/"Contact" restent visibles.

**Conclusion sur la question posee** (limiter a 5-6 playlists dans l'Aside, ou abandonner
l'affichage ?) : **ni l'un ni l'autre**. Le probleme etait le CSS, pas le nombre d'entrees —
avec 6 playlists sur un petit portable, ca aurait deborde quand meme. L'affichage complet est
conserve.

### Top 5 : un vrai classement par ecoutes

- Colonne `musics.play_count` (`scripts/add-play-count.sql`), amorcee sur 5 titres (5, 4, 3,
  2, 1) pour que le classement soit credible des la premiere visite.
- `POST /api/musics/ecoute/:id` (volontairement publique : l'ecoute d'un visiteur compte) et
  `GET /api/musics/top`.
- `MediaPlayer` compte une ecoute a chaque **nouvelle** piste lancee (dependance sur
  `music?.id_music` : reprendre apres une pause ne recompte pas), puis rafraichit le Top 5.

**Pas de tache planifiee** : le classement est un `ORDER BY play_count DESC`, il est donc
toujours a jour. Un cron hebdomadaire n'aurait rien apporte. (Un vrai "top de la semaine"
glissant aurait demande une table `plays` avec un `played_at` — option ecartee au profit du
compteur simple.)

### `src/lib/api.js` : point de passage unique de tous les appels API

Resout trois problemes d'un coup :

- **401 sur une action isolee** (le point restant de l'audit) : un like avec un token expire
  affichait "Token invalide" et laissait l'utilisateur dans une session morte. Desormais
  *tout* 401 purge la session, quel que soit l'appel qui l'a provoque. Le helper
  `messageErreur()` evite d'afficher deux toasts (le jargon technique + le message utile).
- **URL en dur** : `http://localhost:3000` etait ecrit dans 14 fichiers. Elle vient maintenant
  de `VITE_API_URL` (voir `frontend/.env.example` ; le `.env` est gitignore).
- **Token** : chaque composant relisait localStorage et reconstruisait son header
  `Authorization`. C'est fait une fois, dans `apiFetch`.

Un **`AuthContext` n'est du coup plus necessaire** : plus aucun composant n'a besoin du token.

### Anti brute-force

`express-rate-limit` sur `/connexion` (10 tentatives par IP / 15 min ; `skipSuccessfulRequests`
: seuls les **echecs** comptent, un utilisateur normal n'est donc jamais bloque) et sur
`/inscription` (20/h). Verifie : la 11e tentative ratee renvoie un `429`.

### Accessibilite

Les boutons "Connexion" / "Me contacter" etaient des `<a role="button">` (shadcn `Button` +
`render={<Link/>}`) : un lecteur d'ecran annoncait "bouton" alors que l'element **navigue**.
Ils utilisent maintenant le pattern shadcn correct : un vrai `<Link>` stylé via
`buttonVariants()`.

## Passe shadcn/ui + theme Midnight Bloom - 2026-07-13 - faite

Contexte : la migration vers shadcn/ui (composants dans `src/components/ui/`, en anglais,
a cote des composants metier de `src/composants/` en francais - les deux cohabitent
volontairement) etait faite mais non commitee, et l'app restait visuellement monochrome.

Diagnostic : les tokens du theme **etaient deja corrects** dans `index.css` (les valeurs
oklch correspondent exactement au preset officiel `midnight-bloom` de tweakcn : primary
`#6c5ce7` violet, card `#2f3436` gris, accent `#6495ed` bleu, secondary `#4b0082` indigo).
Le probleme n'etait pas les couleurs mais leur **usage** :

- `App.jsx` gardait `bg-zinc-900` sur le `main` - un gris Tailwind **hors theme**, et plus
  sombre que la sidebar : les deux zones se fondaient l'une dans l'autre. C'etait le dernier
  reliquat des "classes couleur en dur" listees dans les points ouverts.
- Le token `--card` (le gris du theme) n'etait utilise **nulle part** dans le contenu : les
  `TrackRow` et les pages flottaient directement sur `--background`, d'ou l'aplat noir.
- `secondary` et `accent` etaient quasi absents. Le seul element colore de la Home etait le
  bouton **rouge** "Se deconnecter" - l'oeil etait attire par la pire action de la page.

Hierarchie de surfaces retenue (a respecter pour tout nouveau composant) :
- `bg-background` : le fond de l'app, sert de gouttiere entre les panneaux.
- `bg-card` / `bg-sidebar` + `border-border` : les panneaux (main, Aside, MediaPlayer,
  BottomNav, HeaderMobile).
- `bg-background/50` + `border-border` : les elements **a l'interieur** d'un panneau
  (TrackRow, Card, cartes de playlist, blocs de Profil, formulaire de Contact). Ils se
  "creusent" dans le panneau clair. **Ne plus utiliser `bg-card` la-dedans** : depuis que le
  `main` est en `bg-card`, un enfant en `bg-card` devient invisible.

Roles couleur (a suivre) :
- **primary** (violet) : identite + etat actif (logo, nav active, piste en cours, player).
- **accent** (bleu) : survol et interactions secondaires.
- **secondary** (indigo) : decor (le halo "bloom" en haut du contenu).
- **destructive** (rouge) : suppressions reelles uniquement - **pas** la deconnexion.

Corrige au passage : `ButtonAddPlaylist` forcait `size="icon-sm"` sur son trigger, donc le
bouton "Ajouter une playlist" (texte long) debordait de l'ecran - le trigger est desormais
parametrable (`variant`/`size`/`className`). Icones `Github`/`Linkedin` remplacees par
`Code2`/`Briefcase` (les logos de marques ont ete retires de lucide-react). Cle React
manquante sur la liste de `Playlists.jsx`.

Verifie avec Playwright en session authentifiee reelle (compte de test peuple avec
playlists + likes, puis supprime de la base), desktop 1440 et mobile 390, sur toutes les
routes + l'etat "en lecture" + les modales.

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

Liste nettoyee apres l'audit du 2026-07-13 : les couleurs en dur, le bug JWT, le check admin
`idUser !== 10`, `createConnection`, les codes HTTP et les vulnerabilites `npm audit` sont
desormais **regles** (voir la section "Audit complet"). Le point `event.stopPropagation()` etait
**obsolete** : verifie par test, les boutons (coeur, ajout, renommer/supprimer) sont des freres
du conteneur cliquable dans le DOM, pas ses enfants - un clic dessus ne lance donc pas la lecture
et ne navigue pas.

Restent :

- **Feedback des 401 sur une action isolee** : la session expiree est bien detectee au chargement
  (effets d'`App.jsx`), mais un like effectue avec un token expire affiche "Token invalide" sans
  deconnecter. Le design cible est un **`AuthContext` + wrapper `apiFetch`** interceptant tous les
  `401` - refactor d'architecture, a faire consciemment.
- Top 5 de `Home.jsx` : simple `.slice(0, 5)`, pas un vrai compteur d'ecoutes (aucune table de
  comptage cote backend - fonctionnalite a part, pour plus tard).
- `AddMusicPlaylist` : pas de filtre cote frontend pour retirer de la liste deroulante les
  playlists qui contiennent deja la musique. Le backend bloque le doublon (409, message clair),
  mais l'UX pourrait l'empecher avant meme la tentative.
- Accessibilite : le bouton "Connexion" est un `<a role="button">` (shadcn `Button` +
  `render={<Link/>}`) - un lecteur d'ecran annonce "bouton" alors que l'element navigue.
- Pas de limitation du nombre de tentatives de connexion (brute force) - a prevoir avant un vrai
  deploiement public.
- Deploiement : penser a rejouer `backend/scripts/add-role-column.sql` sur la base de production,
  et a passer les URLs `http://localhost:3000` du frontend en variable d'environnement (elles sont
  ecrites en dur dans les composants).

## Maquette Pencil

Fichier source : `~/Documents/Maquette-Spoti-Free.pen` (hors Git, local a cette machine,
necessite l'app Pencil pour etre edite). Export statique (PNG/JPEG) disponible dans
`docs/maquette/`, consultable sans Pencil et sur n'importe quelle machine - a regenerer
depuis le fichier source si la maquette evolue.

Ecrans maquettes (mobile + desktop pour chacun) : Home, Bibliotheque, Favoris, A propos,
Contact, Connexion, Inscription, Profil (ajoute le 2026-07-13, voir docs/maquette/README.md
pour la note sur l'onglet Profil ajoute a l'Aside desktop). Pas encore maquette : Playlists.
