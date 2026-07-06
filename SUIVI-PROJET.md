# Suivi du projet

Etat d'avancement et prochaines etapes, pour reprendre le travail sans perdre le fil -
peu importe la machine utilisee. Mis a jour au fil de l'eau (pas un historique complet,
voir les commits Git et `NOTES-APPRENTISSAGE.md` pour ca).

## Phase actuelle (au 2026-07-06)

Refonte visuelle mobile-first en cours. Fonctionnalites (playlists, likes, Apropos/Contact)
et routes protegees deja faites - voir commits `df8f4ee` et anterieurs.

## En cours : restyle de `Aside.jsx` (sidebar desktop)

- Fait : nav Accueil/Bibliotheque/Favoris avec etat actif (`rounded-[10px]` +
  `bg-accent/15 text-accent` quand actif), conforme a la maquette Pencil.
- **Bug connu, pas encore corrige** : sur la ligne "Mes playlists", le fond actif ne
  couvre que le texte, pas l'icone `+` a cote (le `<NavLink>` n'enveloppe que le texte,
  le `+` est un element frere en dehors). Piste retenue : calculer l'etat actif un niveau
  au-dessus (`useMatch("/playlists")` de react-router) et appliquer le style au `<div>`
  parent qui contient texte + `+`, plutot qu'au `NavLink` seul.
- **Decision pas encore prise** : d'ou vient la liste de playlists affichee dans `Aside`
  (toujours monte) ? Soit on remonte `playlists`/`setPlaylists` dans `App.jsx` (comme
  `musiquesLikee`/`currentMusic`) et on les passe a `Aside` + `Playlists.jsx`, soit `Aside`
  fait son propre fetch independant (risque : desync si un fetch se met a jour sans
  l'autre, meme genre de bug que la note d'apprentissage #7).

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

Fichier source : `~/Documents/Maquette-Spoti-Free.pen` (hors Git, local a cette machine).
Ecrans deja maquettes : Home (mobile/desktop), Bibliotheque (mobile/desktop). Prochains
candidats pas encore maquettes : Playlists, Favoris, Profil.
