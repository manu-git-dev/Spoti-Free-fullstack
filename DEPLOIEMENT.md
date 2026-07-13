# Mise en production

Checklist à dérouler **avant** d'ouvrir le site au public. Chaque point correspond à un vrai
risque, pas à une formalité.

---

## 1. Variables d'environnement

Le `.env` de développement ne doit **jamais** partir en production. Repartir des modèles :
`backend/.env.example` et `frontend/.env.example`.

**Backend** (`backend/.env`) :

| Variable | Valeur en production |
|---|---|
| `NODE_ENV` | **`production`** — active `trust proxy` (voir §2) |
| `FRONTEND_URL` | l'URL réelle du front (ex. `https://spotifree.fr`) — c'est l'origine autorisée par CORS |
| `JWT_SECRET` | une **nouvelle** clé aléatoire, différente de celle de dev |
| `DB_*` | les identifiants de la base de production |
| `MAIL_*` | le compte d'envoi et son mot de passe d'application |

Générer la clé JWT :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> **Pourquoi une clé différente ?** C'est elle qui **signe** tous les tokens. Si celle de dev
> a traîné (ancien commit, machine partagée, capture d'écran), quelqu'un pourrait forger un
> token `admin` et prendre le contrôle du site.

**Frontend** (`frontend/.env`) : `VITE_API_URL` = l'URL publique de l'API. Attention, les
variables `VITE_*` sont **injectées dans le bundle** envoyé au navigateur : n'y mettre jamais
de secret, uniquement des valeurs publiques comme une URL.

---

## 2. `trust proxy` (sinon le rate limiter bloque tout le monde)

En production, l'app tourne derrière un reverse proxy (Nginx, hébergeur). Sans `trust proxy`,
Express voit l'IP **du proxy** sur toutes les requêtes : `express-rate-limit` croit alors que
tout le trafic vient d'un seul visiteur, et **bloque tous les utilisateurs d'un coup** au
11ᵉ échec de connexion.

C'est déjà géré dans `server.js`, à condition que `NODE_ENV=production` :

```js
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);   // 1 = un seul proxy devant nous
}
```

> Ne jamais mettre `true` : n'importe qui pourrait alors usurper une IP en envoyant lui-même
> un en-tête `X-Forwarded-For`, et contourner toutes les limites.

---

## 3. Base de données

Rejouer les migrations sur la base de production, dans cet ordre :

```bash
mysql -u <user> -p <base> < backend/scripts/add-role-column.sql   # colonne users.role
mysql -u <user> -p <base> < backend/scripts/add-play-count.sql    # colonne musics.play_count
```

Puis **backfiller les durées** des morceaux (`node scripts/backfill-duration.js`), sans quoi
elles s'afficheront `--:--`.

---

## 4. Purger les comptes de démonstration ⚠️

La base de développement contient des comptes de test (`patrick@test.fr`, `admin@admin.fr`,
`testshadcn…`) — **dont un administrateur**, avec des mots de passe faibles ou oubliés.

Les emmener en production, c'est laisser une porte ouverte : un compte admin dont on ne
maîtrise plus le mot de passe permet de modifier ou supprimer tout le catalogue.

**En production, partir d'une base vide** (uniquement le catalogue de musiques), puis créer
son compte admin proprement :

```sql
-- 1. s'inscrire normalement via l'interface, avec un vrai mot de passe fort
-- 2. puis se promouvoir administrateur :
UPDATE users SET role = 'admin' WHERE email = 'mon.vrai.email@exemple.fr';

-- 3. verifier qu'il n'y a AUCUN autre admin :
SELECT id_user, email, role FROM users WHERE role = 'admin';
```

---

## 5. Vérifications finales

```bash
cd backend && npm audit      # doit afficher : found 0 vulnerabilities
cd frontend && npm audit
cd frontend && npm run build # doit passer sans erreur
cd tests && npm test         # les 44 tests doivent passer
```

Une fois en ligne, vérifier à la main :

- [ ] Le site est bien en **HTTPS** (le token JWT transite dans les en-têtes : en HTTP simple,
      il est lisible par n'importe qui sur le réseau).
- [ ] Une origine étrangère ne peut pas appeler l'API (CORS).
- [ ] Le formulaire de contact fonctionne — et se bloque au 4ᵉ envoi (anti-spam).
- [ ] Les fichiers audio et les pochettes se chargent.

---

## Limites connues (assumées à ce stade)

- **Le token est stocké dans `localStorage`.** C'est simple et suffisant ici, mais un token
  y est lisible par du JavaScript : une faille XSS permettrait de le voler. L'alternative
  (cookie `httpOnly` + `SameSite`) est plus sûre mais demande de revoir l'authentification.
- **Le bundle frontend dépasse 500 kB.** Sans conséquence fonctionnelle, mais un
  code-splitting (`import()` dynamique) accélérerait le premier chargement.
- **Pas de sauvegarde automatique de la base.** À mettre en place côté hébergeur.
