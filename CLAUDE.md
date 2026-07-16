# Spotifree (Spoti-free-FULLSTACK)

Clone de Spotify en full-stack, projet perso de Manuel pour démontrer ses compétences (recherche de stage dev web).

## Stack

- **Backend** : Node.js + Express 5 (modules ESM), MySQL via `mysql2/promise`, auth JWT (`jsonwebtoken` + `bcryptjs`), `cors`, `dotenv`.
- **Frontend** : React 19 + Vite + React Router 7, Tailwind CSS v4 + daisyUI, icônes `lucide-react`.
- Pas de package.json racine : backend et frontend se lancent séparément, chacun dans son dossier.

## Structure

```
backend/
  server.js              # point d'entrée Express, monte les routes sous /api/*
  db.js                   # connexion MySQL (mysql2/promise), lit process.env
  src/routes/              # userRoute.js, musicRoute.js, playlistRoute.js
  src/middlewares/authMiddleware.js  # vérifie le JWT (Bearer token)
  .env                     # PORT, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, JWT_SECRET (gitignored, ne jamais committer)

frontend/
  src/pages/               # une page par route : Home, Login, Register, Playlists, Favoris, Apropos, Contact
  src/composants/          # ⚠️ nommage en français ("composants", pas "components") — respecter cette convention
  src/main.jsx / App.jsx   # entrée + routing
```

## Conventions du projet

- Les dossiers/fichiers frontend spécifiques au projet sont en français (`composants/`), garder cette cohérence pour les nouveaux fichiers plutôt que de basculer en anglais.
- Les routes API sont préfixées `/api/musics`, `/api/users`, `/api/playlists`, `/api/contact`, `/api/submissions` (voir `server.js`).
- **Dépôts de musique** (`/api/submissions`) : un utilisateur dépose un morceau, l'admin modère. Les fichiers déposés vont dans `backend/uploads/` — **jamais dans `public/`**, qui est servi statiquement (un morceau non validé y serait en ligne avant modération). Ils ne sont déplacés vers `public/` qu'à l'approbation. Voir `docs/FEATURE-depot-musique.md`.
- Les routes protégées passent par `authMiddleware` (JWT dans le header `Authorization: Bearer <token>`), qui attache le payload décodé à `req.user`.
- Les routes d'**administration** (gestion du catalogue : `POST /api/musics/ajouter`, `PUT /api/musics/update/:id`, `DELETE /api/musics/delete/:id`, et `GET /api/users`) passent par `authMiddleware` **puis** `adminMiddleware`, qui relit le rôle en base (colonne `users.role`, valeurs `user`/`admin`) et répond `403` si l'utilisateur n'est pas admin.
- Auth : hash des mots de passe avec `bcrypt.hash` à l'inscription (`POST /api/users/inscription`), vérif avec `bcrypt.compare` + génération JWT (expiration **24h**) à la connexion (`POST /api/users/connexion`). À l'expiration, le front purge la session automatiquement quand une route protégée répond `401` (voir `App.jsx`).
- **Règles de saisie** (email, mot de passe, licence) : `backend/src/validation.js` est la **source de vérité**, importée par l'inscription **et** la réinitialisation de mot de passe — une règle appliquée à l'une mais pas à l'autre se contournerait via « mot de passe oublié ». Mot de passe : **8 caractères, une majuscule, un chiffre**. `frontend/src/lib/validation.js` en est le **miroir d'affichage** (checklist en direct) : il n'impose rien, il explique. Si tu changes une règle, change les deux.
- **Droits d'auteur** : le catalogue ne diffuse que du **CC BY** ou **CC BY-SA** (`LICENCES_ACCEPTEES` dans `validation.js` — les variantes NC/ND sont exclues). `musics.licence` et `musics.licence_url` sont **NOT NULL** : tout chemin qui insère dans `musics` doit les porter, y compris les fixtures de test qui écrivent en SQL direct. L'URL du deed est **dérivée du code de licence**, jamais reçue du client. Ces licences **exigent l'attribution** : `Attribution.jsx` l'affiche dans le lecteur, ne pas la retirer — sans elle, la diffusion viole la licence.

## Lancer le projet en dev

```bash
# Backend (depuis backend/)
npm run dev      # nodemon server.js

# Frontend (depuis frontend/)
npm run dev      # vite
```

Le backend nécessite un fichier `.env` local (non versionné) avec `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `JWT_SECRET`, ainsi qu'une base MySQL démarrée en local (via MAMP, port `8889` par défaut — pas XAMPP).

### Quand Manuel dit "lance mon app" (ou équivalent)

Exécuter dans l'ordre :
1. Ouvrir MAMP : `open -a MAMP` (l'app ne démarre pas Apache/MySQL toute seule — si le backend crashe avec `ECONNREFUSED` sur le port `8889`, demander à Manuel de cliquer sur "Start Servers" dans la fenêtre MAMP, impossible de le faire depuis le terminal).
2. Lancer le backend en arrière-plan depuis `backend/` : `npm run dev`.
3. Lancer le frontend en arrière-plan depuis `frontend/` : `npm run dev`.
4. Confirmer les URLs : backend sur `http://localhost:3000`, frontend sur `http://localhost:5173`.

Si le backend a déjà crashé faute de MySQL et que MAMP vient d'être démarré, un `touch backend/server.js` suffit à déclencher le redémarrage de nodemon (pas besoin de retuer/relancer le process).

## Git

- `.env` est déjà dans `.gitignore` (backend) — ne jamais le committer ni y mettre de vraies valeurs dans ce fichier CLAUDE.md.
- Préférences Git générales (commit libre, push toujours confirmé) : voir `~/.claude/CLAUDE.md`.

## Comment travailler avec Manuel sur ce projet

- **Mode mentor** : Manuel écrit le code lui-même sur ce projet. Ne pas utiliser Edit/Write sur les fichiers sources (`.jsx`, `.js`, etc.) sauf demande explicite et sans ambiguïté ("code-le", "applique le fix", "modifie le fichier toi-même"). Accepter un plan ou son timing ("faisons-le maintenant", "ok", "vas-y") n'autorise PAS à coder à sa place — ça répond à "quand", pas à "qui tape le code". En cas de doute, demander explicitement qui écrit.
  - Par défaut : donner la vue d'ensemble (fichiers à toucher, pattern existant à suivre, pourquoi) et le laisser essayer seul en entier, plutôt que de découper en étapes guidées. Ne passer en mode pas-à-pas que s'il le demande explicitement.
  - Ne jamais donner d'exemple de code utilisant ses noms de variables/fichiers réels, même à l'oral dans le chat — utiliser un exemple générique différent de son cas concret, pour qu'il fasse lui-même la traduction vers son code.
  - Une demande de contenu/texte (ex. "fais-moi une présentation") n'est pas une demande de coder le fichier — donner le texte brut dans le chat, pas l'intégrer directement en JSX.
- **Toujours recommander la bonne pratique, jamais le rafistolage** — même si ça implique de repenser du code déjà écrit. Présenter la solution idiomatique comme LA recommandation, pas comme une alternative parmi d'autres.

## Décisions de design (refonte visuelle en cours)

- Navigation mobile : bottom tab bar, pas de burger/drawer pour les pages principales — 5 onglets (Accueil, Bibliothèque, Playlists, Favoris, Profil). Un burger séparé ne sert que pour les pages secondaires (À propos, Contact).
- Desktop : sidebar (`Aside`) avec Accueil/Bibliothèque/Favoris, puis "Mes Playlists" (+ bouton créer et liste dynamique), puis À propos/Contact.
- `Card.jsx` reste un composant unique avec des props optionnelles (ex. `idPlaylist`, `setMusicsPlaylist`) pour adapter les boutons d'action selon le contexte, plutôt que des variantes de Card dupliquées par page.

## Base de données

- **`backend/scripts/schema.sql` est la source de vérité du schéma** (les 8 tables). Les scripts
  `add-*.sql` du même dossier sont des **migrations historiques** — leurs modifications sont déjà
  incluses dans `schema.sql`. Sur une base neuve, celui-ci suffit, suivi de `seed-musics.sql` (le
  catalogue). Si tu modifies une table, mets `schema.sql` à jour : c'est ce fichier que rejoue la CI.
- `backend/public/` (audio + pochettes) est **gitignoré** (~590 Mo, 100 morceaux). `node tests/preparer-medias.mjs`
  recrée les fichiers manquants avec un mp3 de test silencieux. Il n'écrase jamais un fichier
  existant, et lit la liste des fichiers **dans le seed** (ne pas y recoder de liste en dur).
- `backend/scripts/seed-musics.sql` est **généré** par `scripts/importer-jamendo.mjs` (catalogue
  Creative Commons récupéré via l'API Jamendo, clé dans `JAMENDO_CLIENT_ID`). Ne pas l'éditer à la
  main : relancer le script.
- **Genres** : Jamendo rend des *tags* (66 valeurs, longue traîne à 1 occurrence), pas des genres.
  `FAMILLES_DE_GENRES` (dans le script d'import) les replie sur les familles de `GENRES`
  (`backend/src/validation.js`, miroir dans `frontend/src/lib/validation.js`), **à l'import** — une
  base contient de la donnée propre. La liste affichée par le filtre est **déduite du catalogue**
  (`genresDisponibles` dans `App.jsx`), jamais écrite en dur.
- **Curseurs (`Slider`)** : Base UI rend un **nombre** quand on lui passe un nombre, un tableau
  quand on lui passe un tableau (`onValueChange?: (value: Value extends number ? number : Value)`).
  Ne pas déstructurer (`([x]) => …`) sur une valeur unique : ça lève « x is not iterable » et le
  gestionnaire meurt **en silence**. Le `volume` d'un `<audio>` est une **propriété du DOM**, pas
  un attribut : il ne se pose pas en JSX, il s'applique via un effet.

## Intégration continue

`.github/workflows/ci.yml` — à chaque push sur `main`, une machine neuve reconstruit la base,
démarre les serveurs, joue les 155 tests, compile le build et vérifie `npm audit`.

**Rien ne doit dépendre de cette machine.** Un test qui suppose un compte de la base de dev, ou lit
un fichier gitignoré, passera en local et échouera en CI (c'est déjà arrivé — voir la note 55 des
notes d'apprentissage). Les tests créent leurs propres comptes (`creerCompte`, `creerAdmin`) et
lisent leurs médias dans `tests/fixtures/`.

## Tests

`cd tests && npm install && npm test` — **155 tests** contre l'application réellement démarrée
(MAMP + backend + frontend). 4 suites : parcours, sécurité, dépôt, admin. Le processus sort en
**code 1** si un test échoue.

Beaucoup sont des **tests de non-régression** : ils verrouillent des bugs réels (le bug des likes
après reconnexion, la faille du catalogue, la pochette partagée supprimée…). Si l'un devient
rouge, c'est qu'une régression est réapparue.

> Pour lancer la suite, mettre `RATE_LIMIT_DISABLED=1` dans `backend/.env` (les tests créent
> plusieurs comptes et se feraient bloquer par leurs propres protections). Cette variable est
> **sans effet si `NODE_ENV=production`**.

## Règles à ne pas enfreindre

- **Tous les appels API passent par `apiFetch`** (`frontend/src/lib/api.js`) : il porte le token,
  l'URL de base et l'interception des 401. Ne jamais écrire `fetch()` nu ni d'URL en dur.
- **Les fichiers déposés ne vont jamais dans `public/`** avant validation (voir
  `docs/FEATURE-depot-musique.md`).
- **Ne jamais supprimer un fichier partagé** : les pochettes sont mutualisées (une image sert à
  plusieurs morceaux). Toujours vérifier qu'aucun autre morceau ne le référence.
- **Ne pas "compléter" le CRUD utilisateurs** : l'absence d'**édition** du pseudo/nom/email est
  volontaire (l'email est l'identifiant de connexion → escalade de privilèges). La **suppression**,
  elle, existe et doit rester (`DELETE /api/users/mon-compte`) : c'est le droit à l'effacement du
  RGPD. Supprimer n'est pas modifier. Elle exige le **mot de passe** (un token prouve qu'une session
  est ouverte, pas qui est devant l'écran), refuse le **dernier admin** (409), et n'efface que les
  fichiers des dépôts `en_attente` — ceux des dépôts approuvés sont dans `public/`, ils
  appartiennent au catalogue et peuvent être partagés.
- **Surfaces** : `bg-background` = fond ; `bg-card`/`bg-sidebar` = panneaux ; `bg-background/50` =
  ce qui vit *dans* un panneau. Jamais `bg-card` sur un enfant du `main`.
- **Structure des pages** : toute page de contenu passe par `composants/Page.jsx` — jamais de
  `<section className="h-full overflow-y-auto">` écrit à la main. L'en-tête (icône + titre) reste
  **figé**, seul le contenu défile. La coquille est `h-full flex flex-col overflow-hidden` + un
  enfant en `flex-1 min-h-0 overflow-y-auto` ; **pas** de `h-[calc(100%-Xrem)]`, qui code en dur
  une hauteur d'en-tête qui varie (sous-titre, `actions` qui passe à la ligne sur mobile). Le
  `min-h-0` n'est pas décoratif : sans lui rien ne défile. Verrouillé par les tests e2e "en-tête".
  Les pages d'authentification (`Login`, `Register`, `MotDePasseOublie`, `ReinitialiserMotDePasse`)
  et les états « connecte-toi » sont des formulaires centrés, sans en-tête : ils n'utilisent pas
  `Page`.
- **Typographie** : `EnTetePage` = le `<h1>` de la page (avec son icône) ; `TitreSection` = un
  `<h2>` dans une page de prose (À propos, Mentions légales). Ne pas redéfinir un composant `Titre`
  local dans une page — c'est exactement comme ça que les tailles ont divergé.

## Suivi du projet

`SUIVI-PROJET.md` à la racine liste l'état d'avancement actuel (ce qui est en cours, les
bugs connus, les décisions pas encore prises). À consulter en début de session pour savoir
où reprendre, et à tenir à jour au fil du travail plutôt que de laisser une conversation
être la seule trace de l'état courant.

## Notes d'apprentissage (spécifique à ce projet)

Contrairement à la règle "tous projets" du CLAUDE.md global (qui pointe vers `~/Documents/Notes-Dev/notes-apprentissage-dev.md`, hors Git), les notes d'apprentissage prises sur Spoti-Free vont dans `NOTES-APPRENTISSAGE.md` à la racine de ce repo et sont committées (pas de gitignore) : ce projet sert de vitrine pour la recherche de stage, et ce journal montre les difficultés rencontrées et comment elles ont été réglées. Même format que la règle globale (contexte/problème/solution, distinction cours générique vs cas réel résolu).
