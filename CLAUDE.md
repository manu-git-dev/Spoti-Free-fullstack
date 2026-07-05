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
- Auth : hash des mots de passe avec `bcrypt.hash` à l'inscription (`POST /api/users/inscription`), vérif avec `bcrypt.compare` + génération JWT (expiration 2h) à la connexion (`POST /api/users/connexion`).

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
