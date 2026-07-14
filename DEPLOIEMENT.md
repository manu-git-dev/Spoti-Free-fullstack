# Mise en production (VPS)

Guide pour déployer Spoti-Free sur un **VPS** (Hostinger, OVH, Hetzner… — n'importe quelle machine
Ubuntu avec un accès SSH).

> **Pourquoi un VPS et pas un hébergement mutualisé ?**
> L'hébergement mutualisé classique (l'offre à quelques euros) exécute du **PHP**, pas du Node.js
> en continu : le backend Express ne peut pas y tourner. Et un VPS a un **disque qui persiste** —
> indispensable ici, puisque les musiques déposées sont écrites sur le disque. Sur un hébergeur à
> système de fichiers éphémère (Render, Railway, Heroku), elles disparaîtraient à chaque
> redéploiement.

Chaque point ci-dessous correspond à un vrai risque, pas à une formalité.

---

## 0. Ce qu'on met en place

```
                    ┌── / ─────────────► le build React (fichiers statiques)
   Internet ──► nginx ── /api ─────────► Node/Express (127.0.0.1:3000)
      (HTTPS)      └── /musiques,/images ► les fichiers audio et les pochettes
                                          (backend/public/, sur le disque)
```

nginx est en façade (il gère le HTTPS et sert les fichiers) ; Node ne parle qu'à lui, en local.

---

## 1. Préparer le serveur

```bash
ssh root@<ip-du-vps>

apt update && apt upgrade -y
apt install -y nginx mysql-server git curl

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

node -v && nginx -v && mysql --version
```

Sécuriser MySQL (mot de passe root, suppression des comptes anonymes) :

```bash
mysql_secure_installation
```

---

## 2. Récupérer le code

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/manu-git-dev/Spoti-Free-fullstack.git spotifree
cd spotifree

npm ci --prefix backend
npm ci --prefix frontend
```

---

## 3. La base de données

```bash
mysql -u root -p
```

```sql
CREATE DATABASE spotifree CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'spotifree'@'localhost' IDENTIFIED BY 'un-mot-de-passe-long-et-aleatoire';
GRANT ALL PRIVILEGES ON spotifree.* TO 'spotifree'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> **Ne pas utiliser `root`** pour l'application : un compte dédié, limité à cette seule base,
> réduit les dégâts si l'application est un jour compromise.

Créer les tables et le catalogue :

```bash
mysql -u spotifree -p spotifree < backend/scripts/schema.sql       # les 8 tables
mysql -u spotifree -p spotifree < backend/scripts/seed-musics.sql  # les 20 morceaux
```

> Les scripts `add-*.sql` du même dossier sont des **migrations historiques** : leurs
> modifications sont **déjà incluses** dans `schema.sql`. Ne pas les rejouer.

**La base de production ne contient donc AUCUN utilisateur** — ni `admin@admin.fr`, ni les comptes
de test. C'est voulu : voir §8 pour créer ton compte admin proprement.

---

## 4. Les fichiers audio ⚠️

`backend/public/` **n'est pas versionné** (23 Mo, et les droits des morceaux ne permettent pas leur
redistribution). Il faut donc les envoyer à la main, depuis ta machine :

```bash
# depuis ton Mac, pas depuis le VPS
scp -r backend/public/musiques root@<ip>:/var/www/spotifree/backend/public/
scp -r backend/public/images   root@<ip>:/var/www/spotifree/backend/public/
```

Et créer le dossier des dépôts en attente (vide, mais il **doit** exister) :

```bash
mkdir -p /var/www/spotifree/backend/uploads
```

> Sans les fichiers, le catalogue s'affiche mais rien ne se lit. Pour une démo sans les vraies
> musiques : `node tests/preparer-medias.mjs` génère des médias de test (un mp3 silencieux).

---

## 5. Configuration

**`backend/.env`** :

```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=spotifree
DB_PASSWORD=<le mot de passe choisi au §3>
DB_NAME=spotifree

JWT_SECRET=<une NOUVELLE clé, voir ci-dessous>
IP_HASH_SALT=<un autre sel aléatoire>

FRONTEND_URL=https://ton-domaine.fr

MAIL_USER=ton.adresse@gmail.com
MAIL_PASS=<mot de passe d'application Gmail, 16 caractères>
```

Générer les deux secrets :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> **Pourquoi un `JWT_SECRET` différent de celui de dev ?** C'est la clé qui **signe tous les
> jetons**. Si celle de développement a traîné quelque part (ancien commit, capture d'écran,
> machine partagée), quelqu'un pourrait forger un jeton `admin` et prendre le contrôle du site.

> **`NODE_ENV=production` n'est pas cosmétique.** Il active `trust proxy` : sans lui, derrière
> nginx, Express verrait l'IP **du proxy** sur toutes les requêtes. `express-rate-limit` croirait
> alors que tout le trafic vient d'un seul visiteur et **bloquerait tous les utilisateurs d'un
> coup** au 11ᵉ échec de connexion. Il rend aussi `RATE_LIMIT_DISABLED` **sans effet** : même
> oubliée dans le `.env`, cette variable ne peut plus désactiver les protections.

**`frontend/.env`** :

```env
VITE_API_URL=https://ton-domaine.fr
```

> Les variables `VITE_*` sont **compilées dans le bundle** envoyé au navigateur : n'y mettre
> jamais un secret, uniquement des valeurs publiques comme une URL.

Puis construire le front :

```bash
npm run build --prefix frontend    # produit frontend/dist/
```

---

## 6. Lancer le backend en service (systemd)

Sans ça, le backend s'arrête dès que tu fermes ta session SSH — et ne redémarre pas après un reboot.

`/etc/systemd/system/spotifree.service` :

```ini
[Unit]
Description=Spoti-Free API
After=network.target mysql.service

[Service]
Type=simple
User=www-data

# INDISPENSABLE : `dotenv.config()` et `express.static("public")` sont relatifs au DOSSIER
# COURANT. Lancé d'ailleurs, le backend ne trouverait ni son .env ni ses fichiers audio.
WorkingDirectory=/var/www/spotifree/backend
ExecStart=/usr/bin/node server.js

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
chown -R www-data:www-data /var/www/spotifree/backend/public /var/www/spotifree/backend/uploads
systemctl daemon-reload
systemctl enable --now spotifree
systemctl status spotifree          # doit afficher "active (running)"
journalctl -u spotifree -f          # les logs en direct
```

---

## 7. nginx

`/etc/nginx/sites-available/spotifree` :

```nginx
server {
    listen 80;
    server_name ton-domaine.fr www.ton-domaine.fr;

    # ⚠️ SANS CETTE LIGNE, LES DÉPÔTS DE MUSIQUE ÉCHOUENT.
    # nginx limite les envois à 1 Mo par défaut ; les morceaux montent à 10 Mo. Le dépôt
    # renverrait un 413 avant même d'atteindre Node — et rien dans le code ne serait en cause.
    client_max_body_size 12M;

    # Le build React
    root /var/www/spotifree/frontend/dist;
    index index.html;

    # LE FALLBACK SPA. React Router gère les routes CÔTÉ NAVIGATEUR : le serveur, lui, n'a aucun
    # fichier "/favoris" sur son disque. Sans cette ligne, ouvrir directement
    # https://ton-domaine.fr/favoris renvoie un 404 — alors que la navigation interne fonctionne.
    # C'est LE piège classique du déploiement d'une SPA.
    location / {
        try_files $uri $uri/ /index.html;
    }

    # L'API
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Sans cet en-tête, `trust proxy` n'a rien à lire : Express verrait l'IP de nginx pour
        # tout le monde, et le rate limiter bloquerait tous les visiteurs ensemble.
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Les fichiers audio et les pochettes, servis directement par nginx (plus rapide que de les
    # faire transiter par Node). `root` (et non `alias`) : nginx colle simplement l'URI derrière ce
    # chemin — /musiques/x.mp3 devient /var/www/.../public/musiques/x.mp3. C'est exactement le
    # dossier qu'`express.static("public")` sert de son côté.
    location ~ ^/(musiques|images)/ {
        root /var/www/spotifree/backend/public;
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

```bash
ln -s /etc/nginx/sites-available/spotifree /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t          # doit dire "syntax is ok"
systemctl reload nginx
```

### HTTPS

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ton-domaine.fr -d www.ton-domaine.fr
```

> **Le HTTPS n'est pas optionnel.** Le jeton JWT circule dans les en-têtes de chaque requête : en
> HTTP simple, n'importe qui sur le réseau (un wifi public) peut le lire et se faire passer pour
> l'utilisateur. Certbot renouvelle le certificat automatiquement.

---

## 8. Créer ton compte administrateur

La base de production n'a **aucun utilisateur**. Donc :

1. Va sur le site et **inscris-toi normalement**, avec un vrai mot de passe fort.
2. Promeus-toi :

```sql
UPDATE users SET role = 'admin' WHERE email = 'ton.vrai.email@exemple.fr';

-- Puis VÉRIFIE qu'il n'y a aucun autre admin :
SELECT id_user, email, role FROM users WHERE role = 'admin';
```

> C'est la bonne façon de faire : le mot de passe est haché par l'application, et tu es le seul
> admin. Ne jamais insérer un compte admin à la main en SQL avec un mot de passe en clair.

---

## 9. Vérifications, une fois en ligne

- [ ] Le site s'ouvre en **HTTPS** (cadenas dans le navigateur).
- [ ] **Ouvrir directement `https://ton-domaine.fr/favoris`** dans un nouvel onglet → l'app
      s'affiche (et non un 404). C'est le test du fallback SPA.
- [ ] Une musique **se lit** (les fichiers audio sont bien servis).
- [ ] Inscription, connexion, like, playlist.
- [ ] **Mot de passe oublié** → le mail arrive vraiment.
- [ ] **Déposer un morceau de ~8 Mo** → accepté (et non un 413 : c'est le test de
      `client_max_body_size`).
- [ ] Le formulaire de contact fonctionne, et se bloque au 4ᵉ envoi (anti-spam).
- [ ] `journalctl -u spotifree -n 50` → aucune erreur.

---

## 10. Sauvegardes ⚠️

**Rien n'est sauvegardé automatiquement.** Deux choses à protéger, et elles vivent à deux endroits
différents :

```bash
# La base (comptes, playlists, likes, catalogue)
mysqldump -u spotifree -p spotifree > /var/backups/spotifree-$(date +%F).sql

# Les fichiers audio et les pochettes — ils ne sont dans AUCUN dépôt Git.
tar czf /var/backups/medias-$(date +%F).tar.gz -C /var/www/spotifree/backend public
```

À automatiser dans un `cron` quotidien, et à **recopier hors du VPS** (une sauvegarde qui vit sur
la machine qu'elle protège ne protège de rien).

---

## Mettre à jour le site

```bash
cd /var/www/spotifree
git pull
npm ci --prefix backend
npm ci --prefix frontend
npm run build --prefix frontend
systemctl restart spotifree
```

> Si le `pull` amène une modification de schéma, penser à l'appliquer sur la base **avant** de
> redémarrer.

---

## Limites connues (assumées)

- **Le jeton est stocké dans `localStorage`** : lisible par du JavaScript, donc volable en cas de
  faille XSS. L'alternative (cookie `httpOnly` + `SameSite`) est plus sûre mais demande de revoir
  l'authentification.
- **Le bundle dépasse 500 kB** : sans conséquence fonctionnelle, mais un code-splitting
  (`import()` dynamique) accélérerait le premier chargement.
- **Pas de CDN** : les fichiers audio sont servis par le VPS. Suffisant pour une vitrine.
