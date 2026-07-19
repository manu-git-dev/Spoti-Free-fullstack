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

- **Pilotage guidé** (tranché le 2026-07-17 — remplace l'ancien « mode mentor » où Manuel tapait le code lui-même) : **Claude code, Manuel pilote** — il guide, décide, arbitre, relit. Edit/Write sur les fichiers sources est donc la norme, pas l'exception. Mais coder à sa place n'est pas le but : le but est de **muscler son jugement**, parce que la vraie compétence — et ce qu'on lui demandera en entretien de stage — c'est de **pouvoir défendre chaque décision**, pas de savoir taper. La ligne n'est plus « qui écrit le code » mais « Manuel pourrait-il justifier ce choix en entretien ».
  - **Toujours donner le compromis, jamais une reco sèche.** Sur chaque décision de conception, expliciter l'arbitrage : « si on prend l'autre option, voilà ce qu'on perd ». Il doit voir le raisonnement, pas seulement le verdict.
  - **L'inviter à proposer l'architecture EN PREMIER** sur les nouveaux chantiers : il pose l'approche, Claude cherche les failles. C'est l'exercice qui entraîne le plus la décision — ne pas systématiquement pré-mâcher les options.
  - **Expliquer le POURQUOI** des décisions et des invariants : chaque règle de ce fichier encode une décision d'architecture, c'est là qu'il apprend le métier.
  - **L'inciter à lire et attaquer les diffs** plutôt qu'à valider : « pourquoi ça et pas X ? ». Savoir critiquer du code qu'on n'a pas écrit est la compétence du pilote.
  - Il code encore un petit truc de temps en temps, de son propre chef, pour garder la lecture fluide — ce n'est pas une contrainte imposée à Claude.
- **Toujours recommander la bonne pratique, jamais le rafistolage** — même si ça implique de repenser du code déjà écrit. Présenter la solution idiomatique comme LA recommandation, pas comme une alternative parmi d'autres.

## Décisions de design (refonte visuelle en cours)

- Navigation mobile : bottom tab bar, pas de burger/drawer pour les pages principales — 5 onglets (Accueil, Bibliothèque, Playlists, Favoris, Profil). Un burger séparé ne sert que pour les pages secondaires (À propos, Contact).
- Desktop : sidebar (`Aside`) avec Accueil/Bibliothèque/Favoris, puis "Mes Playlists" (+ bouton créer et liste dynamique), puis À propos/Contact.
- `Card.jsx` reste un composant unique avec des props optionnelles (ex. `idPlaylist`, `setMusicsPlaylist`) pour adapter les boutons d'action selon le contexte, plutôt que des variantes de Card dupliquées par page.

## Base de données

- **`backend/scripts/schema.sql` est la source de vérité du schéma** (les 9 tables). Les scripts
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
démarre les serveurs, joue les 189 tests, compile le build et vérifie `npm audit`.

**Rien ne doit dépendre de cette machine.** Un test qui suppose un compte de la base de dev, ou lit
un fichier gitignoré, passera en local et échouera en CI (c'est déjà arrivé — voir la note 55 des
notes d'apprentissage). Les tests créent leurs propres comptes (`creerCompte`, `creerAdmin`) et
lisent leurs médias dans `tests/fixtures/`.

## Tests

`cd tests && npm install && npm test` — **189 tests** contre l'application réellement démarrée
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
  `Page`. Ces états **restent centrés alors que le contenu de leur page est en pleine largeur** —
  c'est **voulu**, tranché par Manuel le 2026-07-17, pas un oubli de la refonte : un état
  « connecte-toi » est un **appel à l'action**, pas du contenu. L'étaler sur 1400 px isolerait un
  bouton au milieu du vide. Ne pas « harmoniser » cette différence.
- **Largeurs** (tranché le 2026-07-17, après trois essais — ne pas rejouer le débat) : l'**en-tête
  est toujours calé à gauche**, sur toutes les pages, sans exception. Le contenu qui a une largeur
  utile bornée par l'œil (prose, formulaires) vit dans un **panneau pleine largeur**
  (`bg-background/50` + `border-border`), **calé à gauche dedans** (`max-w-3xl` pour la prose,
  `max-w-2xl` pour un formulaire) — le panneau remplit l'espace, le vide vit *dedans* et se lit
  comme de la place, pas comme un trou.
  - **Jamais `mx-auto`** sur ce contenu : centrer dans un panneau recrée exactement le
    déséquilibre qu'on supprimait (en-tête à gauche, contenu au milieu). Testé, rejeté.
  - **Jamais de `max-w` sur `Page.jsx`** : ça rétrécirait l'en-tête **et** casserait les grilles.
    Une colonne centrée en-tête compris a aussi été testée et rejetée.
  - **Mieux qu'un panneau, quand la page s'y prête : deux colonnes** (`Deposer`, `MesDepots` —
    `grid max-w-6xl items-start lg:grid-cols-[minmax(0,42rem)_minmax(0,22rem)]`).
    C'est le seul agencement qui *remplit* vraiment, parce qu'il met du contenu **utile** dans
    l'espace au lieu de l'étirer. **Ne jamais inventer de contenu pour le remplir** : sur ces
    pages, la colonne de droite ne contient que du **déjà-là déplacé** (les explications des
    champs, la légende des statuts). Du remplissage se verrait.
    Ne s'applique pas à la prose, qui n'a rien à mettre à droite.
  - **Une page dont le contenu est DÉJÀ fait de panneaux** (Profil, Mes demandes) ne peut pas
    recevoir l'enveloppe grise : même fond sur même fond, les panneaux du dedans disparaissent. La
    règle des surfaces n'a pas de troisième niveau. Pour celles-là, c'est deux colonnes ou rien.
  - **`Profil` a quitté les deux colonnes pour l'empilement** (tranché avec Manuel le 2026-07-18) :
    la colonne de droite (les stats à côté de l'identité) le gênait. Trois panneaux empilés
    (identité → stats → actions), calés à gauche, **`max-w-[1600px]`** — plafond plus large que le
    `max-w-6xl` des deux-colonnes, parce qu'un empilement a besoin de plus de place pour remplir un
    portable large sans laisser de vide à droite. Reste **borné** (il ne suit pas l'écran sur 4K) :
    c'est un élargissement assumé de la règle, pas son abandon. Le test e2e "largeur" lui donne sa
    **propre limite (1700 px)**, pour ne pas desserrer celle des pages de prose et de `Deposer`.
  - La pleine largeur **sans panneau** reste juste pour la **Bibliothèque**, le **Catalogue** et le
    **Tableau de bord** : ce sont des grilles, elles gagnent des cartes par rangée.
  - Verrouillé par les tests e2e "largeur", qui mesurent en **2560 px** — le viewport que personne
    n'ouvre, donc celui où une régression passerait inaperçue le plus longtemps.
- **`Select` (Base UI)** : passer **`items`** (un objet `{ valeur: libellé }`) au `Select` racine,
  sinon `<Select.Value>` affiche la **valeur brute** — l'identifiant, pas le nom (bug réel du
  2026-07-17 : on choisissait une playlist, le champ affichait `1332`). Et
  `alignItemWithTrigger={false}` sur `SelectContent` : par défaut le popup se pose **sur** le
  déclencheur et le masque. Même famille de piège que le `Slider` ci-dessus — les wrappers shadcn
  de Base UI ont des défauts qui ne se voient qu'à l'usage.
- **Typographie** : `EnTetePage` = le `<h1>` de la page (avec son icône) ; `TitreSection` = un
  `<h2>` dans une page de prose (À propos, Mentions légales). Ne pas redéfinir un composant `Titre`
  local dans une page — c'est exactement comme ça que les tailles ont divergé.

## Suivi du projet

`SUIVI-PROJET.md` à la racine liste l'état d'avancement actuel (ce qui est en cours, les
bugs connus, les décisions pas encore prises). À consulter en début de session pour savoir
où reprendre, et à tenir à jour au fil du travail plutôt que de laisser une conversation
être la seule trace de l'état courant.

### Passage de relais entre sessions (protocole)

Une conversation est **jetable** : elle disparaît à chaque `/clear`. Tout ce qui doit survivre
va dans `SUIVI-PROJET.md`, dont la **première section est `## EN SUSPENS`**.

**Quand Manuel annonce qu'il s'arrête ou qu'il va vider le contexte** — « j'arrête là », « je vais
me coucher », « je dois clear le contexte », « on s'arrête », « à demain »… — **avant de répondre** :

1. Mettre `## EN SUSPENS` à jour dans `SUIVI-PROJET.md`. Y faire figurer, et **rien d'autre** :
   - les **questions posées à Manuel restées sans réponse** (c'est le cas le plus important : elles
     n'existent que dans la conversation, donc elles meurent avec elle) ;
   - les **« à penser »** qu'il dicte en passant — ils arrivent souvent en une ligne (« icône mes
     playlists »), à charge de les étoffer assez pour qu'ils restent compréhensibles ;
   - ce qui est **à lui** de faire (valeurs à compléter, comptes à créer, paiements à valider) ;
   - le **travail commencé et non fini**, avec l'endroit exact où reprendre ;
   - les **décisions reportées**, avec la raison du report.

   Ne PAS y remettre ce qui est fait et testé : ça vit dans le reste du fichier et dans les
   commits. Une liste qui contient tout ne se lit plus.
2. Committer (`Suivi : passage de relais`).
3. Rappeler à Manuel de relire `NOTES-APPRENTISSAGE.md` (règle du `~/.claude/CLAUDE.md` global).

**Quand Manuel dit « reprenons »** (ou équivalent en début de session) : lire `SUIVI-PROJET.md` et
lui **restituer `## EN SUSPENS`**, en distinguant ce qui attend une décision de sa part de ce qui
attend du travail. Ne pas se lancer dans le code avant qu'il ait choisi.

**Chaque entrée dit ce qui bloque et pourquoi, pas seulement son titre** : dans six semaines, « le
select du dépôt » ne voudra plus rien dire. « Le genre du dépôt est en texte libre → un dépôt
approuvé avec "Trap" crée une pastille à un morceau », si.

## Notes d'apprentissage (spécifique à ce projet)

Contrairement à la règle "tous projets" du CLAUDE.md global (qui pointe vers `~/Documents/Notes-Dev/notes-apprentissage-dev.md`, hors Git), les notes d'apprentissage prises sur Spoti-Free vont dans `NOTES-APPRENTISSAGE.md` à la racine de ce repo et sont committées (pas de gitignore) : ce projet sert de vitrine pour la recherche de stage, et ce journal montre les difficultés rencontrées et comment elles ont été réglées. Même format que la règle globale (contexte/problème/solution, distinction cours générique vs cas réel résolu).
