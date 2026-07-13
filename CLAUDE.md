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
- Les routes API sont préfixées `/api/musics`, `/api/users`, `/api/playlists` (voir `server.js`).
- Les routes protégées passent par `authMiddleware` (JWT dans le header `Authorization: Bearer <token>`), qui attache le payload décodé à `req.user`.
- Les routes d'**administration** (gestion du catalogue : `POST /api/musics/ajouter`, `PUT /api/musics/update/:id`, `DELETE /api/musics/delete/:id`, et `GET /api/users`) passent par `authMiddleware` **puis** `adminMiddleware`, qui relit le rôle en base (colonne `users.role`, valeurs `user`/`admin`) et répond `403` si l'utilisateur n'est pas admin.
- Auth : hash des mots de passe avec `bcrypt.hash` à l'inscription (`POST /api/users/inscription`), vérif avec `bcrypt.compare` + génération JWT (expiration **24h**) à la connexion (`POST /api/users/connexion`). À l'expiration, le front purge la session automatiquement quand une route protégée répond `401` (voir `App.jsx`).

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

## Suivi du projet

`SUIVI-PROJET.md` à la racine liste l'état d'avancement actuel (ce qui est en cours, les
bugs connus, les décisions pas encore prises). À consulter en début de session pour savoir
où reprendre, et à tenir à jour au fil du travail plutôt que de laisser une conversation
être la seule trace de l'état courant.

## Notes d'apprentissage (spécifique à ce projet)

Contrairement à la règle "tous projets" du CLAUDE.md global (qui pointe vers `~/Documents/Notes-Dev/notes-apprentissage-dev.md`, hors Git), les notes d'apprentissage prises sur Spoti-Free vont dans `NOTES-APPRENTISSAGE.md` à la racine de ce repo et sont committées (pas de gitignore) : ce projet sert de vitrine pour la recherche de stage, et ce journal montre les difficultés rencontrées et comment elles ont été réglées. Même format que la règle globale (contexte/problème/solution, distinction cours générique vs cas réel résolu).
