# Dépôt de musique par un utilisateur (avec modération)

Spec commune : **Manuel implémente le backend**, Claude implémente le frontend contre ce
contrat. Ce document fait foi — si un point doit changer, on le change ici d'abord.

---

## 1. Le principe

Un utilisateur connecté dépose un morceau (titre, artiste, genre, fichier audio, pochette).
Le dépôt part **en attente**. L'admin reçoit un mail, consulte les dépôts sur une page dédiée,
écoute le morceau, puis **approuve** ou **refuse**. Ce n'est qu'à l'approbation que le morceau
rejoint le catalogue.

---

## 2. La règle non négociable : le fichier hors de `public/`

`server.js` fait `app.use(express.static("public"))` : **tout ce qui est dans `public/` est
servi publiquement, immédiatement**.

Un fichier déposé mais pas encore validé ne doit donc **jamais** y être écrit — sinon il est en
ligne avant modération, et la modération ne sert plus à rien.

```
backend/
├── uploads/            ← NOUVEAU. Fichiers en attente. Hors public/, donc inaccessible.
│   └── .gitignore      ← ignorer le contenu (fichiers d'utilisateurs, pas du code)
└── public/             ← servi statiquement
    ├── images/         ← la pochette n'arrive ici QU'À l'approbation
    └── musiques/       ← le morceau n'arrive ici QU'À l'approbation
```

**À l'approbation** : déplacer les deux fichiers de `uploads/` vers `public/…`, puis insérer
dans `musics` avec les chemins finaux (`musiques/xxx.mp3`, `images/xxx.jpg` — mêmes conventions
que l'existant, chemins **relatifs** à `public/`).

**Au refus** : supprimer les fichiers de `uploads/`.

---

## 3. Le modèle : une table `submissions` séparée

On **ne met pas** un statut sur `musics`. Sinon, toutes les requêtes existantes (`GET /api/musics`,
le Top 5, la recherche…) devraient penser à filtrer `WHERE statut = 'approuve'` : le jour où on
en oublie une, un morceau non validé apparaît dans l'app.

Avec une table séparée, **un morceau non validé ne peut pas fuiter, même par oubli** : il n'est
pas dans la table que l'app lit.

| colonne | type | note |
|---|---|---|
| `id_submission` | INT, PK, AI | |
| `id_user` | INT, FK → `users` | qui a déposé. `ON DELETE CASCADE` |
| `title` | VARCHAR(255) | |
| `artist` | VARCHAR(255) | |
| `genre` | VARCHAR(100) | nullable |
| `fichier_audio` | VARCHAR(255) | nom du fichier dans `uploads/` |
| `fichier_image` | VARCHAR(255) | idem |
| `duration` | INT | **extraite côté serveur**, jamais envoyée par le client |
| `statut` | ENUM('en_attente','approuve','refuse') | DEFAULT `'en_attente'` |
| `motif_refus` | TEXT | nullable, rempli au refus |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

Script à créer : `backend/scripts/add-submissions-table.sql` (même style que
`add-role-column.sql`).

---

## 4. Les routes

### Côté utilisateur

**`POST /api/submissions`** — `authMiddleware`
Déposer un morceau. `multipart/form-data` (pas du JSON : il y a des fichiers).

Champs : `title`, `artist`, `genre`, `audio` (fichier), `image` (fichier).

| cas | code | corps |
|---|---|---|
| dépôt accepté | `201` | `{ message }` |
| champ manquant / fichier absent | `400` | `{ message }` |
| fichier audio illisible (voir §5) | `400` | `{ message }` |
| fichier trop gros | `413` | `{ message }` |
| pas connecté | `401` | |

**`GET /api/submissions/mes-depots`** — `authMiddleware`
Les dépôts de l'utilisateur courant, avec leur statut (pour qu'il puisse suivre).
→ `200` + tableau (vide = `200 []`, pas 404 — cf. note 35).

### Côté admin

**`GET /api/submissions`** — `authMiddleware` + `adminMiddleware`
Tous les dépôts. Filtre optionnel `?statut=en_attente`.
→ `200` + tableau, avec le pseudo du déposant (jointure `users`).

**`GET /api/submissions/:id/audio`** — `authMiddleware` + `adminMiddleware`
**Sert le fichier audio en attente**, pour que l'admin puisse l'écouter avant de décider.
C'est la seule façon d'accéder à `uploads/` — et elle est réservée à l'admin.
→ le fichier (`res.sendFile`), ou `404`.

> ⚠️ Utiliser le nom stocké **en base**, jamais un nom venu de l'URL : sinon
> `GET /api/submissions/../../.env/audio` devient possible (*path traversal*).

**`PATCH /api/submissions/:id/approuver`** — `authMiddleware` + `adminMiddleware`
Déplace les fichiers vers `public/`, insère dans `musics`, passe le statut à `approuve`.
→ `200`. Si déjà traité → `409`.

**`PATCH /api/submissions/:id/refuser`** — `authMiddleware` + `adminMiddleware`
Corps : `{ motif }` (optionnel). Supprime les fichiers de `uploads/`, statut `refuse`.
→ `200`. Si déjà traité → `409`.

---

## 5. La validation du fichier (le cœur du sujet)

**Ni l'extension ni le `Content-Type` envoyé par le navigateur ne prouvent quoi que ce soit** :
les deux se falsifient trivialement. Un `.mp3` peut contenir n'importe quoi.

L'ordre des contrôles :

1. **`multer`** (`npm i multer`) — écrit dans `uploads/`, avec :
   - `limits: { fileSize: … }` → **10 Mo** pour l'audio, **2 Mo** pour l'image ;
   - un **nom de fichier régénéré par toi** : `crypto.randomUUID() + extension`.
     **Ne jamais réutiliser le nom fourni par l'utilisateur** — un nom comme `../../server.js`
     écraserait ton code.
   - une whitelist d'extensions (`.mp3`, `.jpg`, `.png`…) — premier filtre, pas une preuve.

2. **Vérifier le contenu réel** : parser le fichier audio avec **`music-metadata`** (déjà
   installé, tu t'en es servi pour `backfill-duration.js`).
   - S'il ne se parse pas comme de l'audio → **c'est un faux** : supprimer le fichier, `400`.
   - S'il se parse → tu récupères **la durée gratuitement**. Un seul geste te donne la
     validation *et* la donnée.

3. **La durée vient du serveur, jamais du client.** Si tu acceptais un champ `duration` envoyé
   par le formulaire, n'importe qui pourrait mentir.

> Si l'un des deux fichiers est rejeté, **penser à supprimer l'autre** : sinon `uploads/` se
> remplit de fichiers orphelins.

---

## 6. La notification

Pas de WebSocket, pas de table `notifications`. `nodemailer` est déjà configuré
(`contactRoute.js` en est un exemple) :

- à chaque dépôt → mail à `MAIL_TO` : « Nouveau dépôt : *titre* — *artiste*, par *pseudo* ».
- l'admin va sur `/admin/depots`, écoute, décide.

Ne pas oublier une **limite anti-abus** sur `POST /api/submissions` (`express-rate-limit`, déjà
utilisé) : sans elle, on peut te remplir le disque **et** noyer ta boîte mail. Suivre le pattern
de `limitesDesactivees` (`src/config.js`) pour que les tests puissent tourner.

---

## 7. Le frontend (Claude)

- **`/deposer`** (connecté) — formulaire : titre, artiste, genre, zone de **drag & drop** pour
  l'audio et la pochette (aperçu du nom de fichier + taille, validation côté client comme
  simple confort), bouton d'envoi avec état de chargement. Plus la liste « mes dépôts » et leur
  statut.
- **`/admin/depots`** (admin) — liste des dépôts en attente : infos, **lecteur audio** pour
  écouter, boutons Approuver / Refuser (avec motif). Toast + retrait de la liste.
- Entrée dans la navigation : « Déposer une musique » (visible si connecté), et « Modération »
  (visible si `role === 'admin'`).

> Pour que le front sache si l'utilisateur est admin, **le `role` doit être renvoyé dans l'objet
> `user` de `POST /api/users/connexion`** (il ne l'est pas aujourd'hui). C'est le seul changement
> à faire sur une route existante.
>
> Le front s'en sert **uniquement pour afficher ou masquer le lien** : c'est du confort, pas de
> la sécurité. La protection réelle reste `adminMiddleware`, côté serveur — un utilisateur qui
> modifierait son `localStorage` verrait le lien, et se prendrait un `403`.

---

## 8. Ordre de travail conseillé

1. La migration SQL + le dossier `uploads/` (avec son `.gitignore`).
2. `POST /api/submissions` avec multer + la validation `music-metadata`. **Le tester avec un
   faux `.mp3`** (renomme un `.txt` en `.mp3` : il doit être rejeté en 400).
3. Les routes admin (liste, écoute, approuver, refuser).
4. Le mail de notification.
5. Le `role` dans la réponse de connexion.

Pendant ce temps, Claude code les deux pages du front contre ce contrat, et on branche.
