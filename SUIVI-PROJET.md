# Suivi du projet

Etat d'avancement et prochaines etapes, pour reprendre le travail sans perdre le fil -
peu importe la machine utilisee. Mis a jour au fil de l'eau (pas un historique complet,
voir les commits Git et `NOTES-APPRENTISSAGE.md` pour ca).

## Phase actuelle (au 2026-07-06)

Refonte visuelle mobile-first en cours. Fonctionnalites (playlists, likes, Apropos/Contact)
et routes protegees deja faites - voir commits `df8f4ee` et anterieurs.

## Restyle de `Aside.jsx` (sidebar desktop) - en pause

- Fait : nav Accueil/Bibliotheque/Favoris avec etat actif (`rounded-[10px]` +
  `bg-accent/15 text-accent` quand actif), conforme a la maquette Pencil.
- Fait : liste de playlists dynamique remontee dans `App.jsx` (`playlists`/`setPlaylists`,
  memes principe que `musiquesLikee`/`currentMusic`) et passee a `Aside` + `Playlists.jsx`
  (commit `df8f4ee`).
- **Bug connu, pas encore corrige** : sur la ligne "Mes playlists", le fond actif ne
  couvre que le texte, pas l'icone `+` a cote (le `<NavLink>` n'enveloppe que le texte,
  le `+` est un element frere en dehors). Piste retenue : calculer l'etat actif un niveau
  au-dessus (`useMatch("/playlists")` de react-router) et appliquer le style au `<div>`
  parent qui contient texte + `+`, plutot qu'au `NavLink` seul.

## En cours : pages Connexion / Inscription / Contact (pas besoin de backend/DB pour les styler)

Decisions prises :
- `Aside`/`BottomNav`/`MediaPlayer` restent affiches partout, y compris sur
  `/connexion` et `/inscription` (pas de plein-ecran type maquette, pas de restructuration
  du routing dans `App.jsx`). Le panneau gauche gradient (logo + accroche) et le rond
  gradient mobile de la maquette sont donc abandonnes : ces pages reprennent uniquement le
  contenu du formulaire (titre serif, sous-titre, champs a icones, bouton pill, lien
  croise), recentre dans le `<main>` existant.
- Inscription garde 3 champs identite separes (`pseudo`/`prenom`/`nom`) au lieu du champ
  unique "Nom" de la maquette (pas de refonte du modele de donnees aujourd'hui), + ajout
  d'un champ confirmation de mot de passe (verif cote front uniquement).

Etat de `Contact.jsx` (version desktop) :
- Fait : mise en page a 2 colonnes (texte + infos a gauche, carte formulaire a droite),
  Nom/Mail cote a cote, Sujet, Message, bouton "Envoyer le message" + icone `Send`.
- **Bug a corriger** : les inputs Nom et Mail n'ont pas d'attribut `name` -> `formData.get("nom")`
  et `formData.get("mail")` renvoient `null` au submit (seul `message` a `name="message"`).
- **A trancher** : `required` retire de Nom/Mail (volontaire ou oubli ?) ; colonne gauche
  remplacee par du texte/liens bruts (email perso, GitHub, LinkedIn) au lieu des 3 lignes
  a icones-en-rond-colore de la maquette - a decider si on garde ce traitement visuel plus
  sobre ou si on rajoute les icones.
- Pas encore fait : version mobile de Contact (le `grid grid-cols-2` du conteneur externe
  n'a pas de fallback responsive, `Login.jsx`/`Register.jsx` pas encore touchees du tout).

## Autres points ouverts (pas urgents, a reprendre quand on y arrive)

- Pas de mini-player mobile : `MediaPlayer` est encore desktop-only (`hidden md:contents`),
  rien ne s'affiche sur mobile pendant qu'un titre joue.
- Pas de page Profil : l'onglet "Profil" pointe pour l'instant vers `/connexion` en
  placeholder.
- Boutons connexion/inscription/deconnexion places temporairement dans `Home.jsx`
  (juste pour tester `ProtectedRoute` manuellement) - la vraie destination est `Aside.jsx`
  (desktop) et le menu burger de `HeaderMobile.jsx` (mobile), une fois une vraie zone
  Profil concue.
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

## Maquette Pencil

Fichier source : `~/Documents/Maquette-Spoti-Free.pen` (hors Git, local a cette machine,
necessite l'app Pencil pour etre edite). Export statique (PNG/JPEG) disponible dans
`docs/maquette/`, consultable sans Pencil et sur n'importe quelle machine - a regenerer
depuis le fichier source si la maquette evolue.

Ecrans maquettes (mobile + desktop pour chacun) : Home, Bibliotheque, Favoris, A propos,
Contact, Connexion, Inscription. Pas encore maquette : Playlists, Profil.
