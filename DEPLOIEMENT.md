# Mise en production (VPS)

Guide pour déployer Spoti-Free sur un **VPS** (Hostinger, OVH, Hetzner… — n'importe quelle machine
Ubuntu avec un accès SSH).

> **Une machine, plusieurs sites.** Ce VPS héberge le **portfolio** à la racine
> (`manuelmattana.fr`), et **chaque projet sur son sous-domaine** — Spoti-Free vit donc sur
> `spotifree.manuelmattana.fr`. Un sous-domaine est gratuit et illimité : chaque futur projet
> aura son adresse sans racheter de domaine. nginx aiguille tout ça (§8).
>
> **Machine et domaine réels (2026-07-21)** : VPS Hostinger KVM 2, Ubuntu 24.04, IP
> **`72.62.236.82`**. Domaine **`manuelmattana.fr`**, acheté à part (~12 €/an) et **non** le
> domaine « offert » : celui-ci n'était proposé qu'en `.tech`/`.cloud`, dont le renouvellement
> monte à **70 €/an** dès l'année 2. Un portfolio finit sur un CV et sur LinkedIn — on ne bâtit
> pas son adresse professionnelle sur un nom qu'on sait qu'on abandonnera à l'échéance.
>
> **Déployer Spoti-Free en premier, seul**, avant le portfolio et le WordPress. Quand quelque
> chose casse — et quelque chose cassera —, il faut n'avoir changé qu'une seule chose depuis le
> dernier état qui marchait.

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
                       manuelmattana.fr ───────────► le portfolio
                      /                              (plus tard)
   Internet ──► nginx ── blog.manuelmattana.fr ────► WordPress + PHP-FPM
      (HTTPS)      \                                 (plus tard)
                    \ spotifree.manuelmattana.fr ──┬── /  ─────────────► le build React
                                                   │                      (fichiers statiques)
                                                   ├── /api ───────────► Node/Express
                                                   │                      (127.0.0.1:3000)
                                                   └── /musiques,/images ► audio et pochettes
                                                                          (backend/public/)
```

nginx est en façade : il gère le HTTPS et sert les fichiers. Il **choisit le site d'après le
domaine demandé** (`server_name`), puis, à l'intérieur du site, route selon le chemin. Node ne
parle qu'à nginx, en local — il n'est jamais exposé directement.

---

## 1. Le DNS (à lancer en premier)

Rien ne marchera tant que ton domaine ne pointe pas vers ton VPS. Et comme la propagation prend du
temps, **on la lance en premier** : elle travaillera pendant que tu installes les paquets.

Dans le panneau de ton registrar (ici Hostinger), zone DNS du domaine, créer des enregistrements de
type **A** — un enregistrement `A` associe un **nom** à une **adresse IPv4** :

| Action                  | Type  | Nom         | Valeur             | TTL   | Adresse obtenue                               |
|-------------------------|-------|-------------|--------------------|-------|-----------------------------------------------|
| **MODIFIER** l'existant | A     | `@`         | `72.62.236.82`     | `300` | `manuelmattana.fr` → le portfolio (plus tard) |
| **AJOUTER**             | A     | `spotifree` | `72.62.236.82`     | `300` | `spotifree.manuelmattana.fr` → **Spoti-Free** |
| ne rien toucher         | CNAME | `www`       | `manuelmattana.fr` | —     | `www.manuelmattana.fr`                        |

`@` désigne le domaine nu (la racine, ou *apex*). Les autres lignes sont des **sous-domaines** :
gratuits et illimités, c'est ce qui permet de loger tous les projets sur une seule machine et un
seul domaine. Un futur projet = une ligne de plus, rien à racheter.

> **MODIFIER le `@`, surtout pas en ajouter un second.** Deux enregistrements `A` sur le même nom
> n'est pas une erreur DNS : c'est du **round-robin**, le résolveur en choisit un au hasard. On
> aurait le site une fois sur deux et la page de parking l'autre fois — le pire type de bug, celui
> qui n'est pas reproductible.

> **`www` est un CNAME vers l'apex, on le laisse tel quel.** Un CNAME dit « pour ce nom, va lire cet
> autre nom » : il suivra automatiquement la modification du `@`. C'est mieux qu'un `A` en double —
> une seule adresse à changer le jour où on migre de VPS (échéance ~juin 2027).

> **TTL : 300 s (5 minutes) tant que ça bouge.** C'est la durée pendant laquelle n'importe quel
> résolveur garde la réponse en cache avant de redemander. Bas = une erreur d'IP se corrige en 5
> minutes ; haut (4 h, le défaut « Auto » d'Hostinger) = une erreur coûte 4 heures. Et attention :
> **baisser un TTL est soumis à l'ANCIEN TTL** — d'où la pratique de le baisser *la veille* d'une
> migration. On le remontera à 3600 une fois le site stable, si on veut.

> **Pourquoi en premier ?** Un changement DNS met de quelques minutes à quelques heures à se
> propager. Et surtout : **certbot refuse de délivrer un certificat s'il ne peut pas vérifier que
> le domaine pointe vers cette machine** (§8). Lancer le DNS avant l'installation, c'est laisser la
> propagation travailler pendant que tu fais autre chose — plutôt que de la découvrir en obstacle
> au moment du HTTPS.

Vérifier **depuis ton Mac** (pas depuis le VPS) :

```bash
dig +short spotifree.manuelmattana.fr
# doit afficher l'IP du VPS. Tant que la réponse est vide, c'est que ça propage encore :
# attendre, et ne surtout pas passer au HTTPS (§8).
```

---

## 2. Préparer le serveur

```bash
ssh root@72.62.236.82

apt update && apt upgrade -y
apt install -y nginx mysql-server git curl

# Node.js 22 — télécharger, INSPECTER, puis exécuter LE MÊME fichier
curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/ns.sh
grep -nE 'NODE_MAJOR|nodesource|apt-get|gpg|deb ' /tmp/ns.sh   # ce qu'il fait vraiment
bash /tmp/ns.sh
apt install -y nodejs

node -v && nginx -v && mysql --version
```

> **Pourquoi pas le `curl … | bash -` que donne la doc de NodeSource ?** Parce qu'avec un tube, on
> inspecte un téléchargement puis on en exécute **un second** : rien ne garantit que ce sont les
> mêmes octets. Télécharger, lire, puis exécuter **ce fichier-là** supprime l'écart. C'est la
> différence entre « j'ai regardé quelque chose » et « j'exécute ce que j'ai regardé ».

> **Node 22 et pas la version d'Ubuntu (18), ni celle du Mac (24)** : la prod s'aligne sur
> l'environnement **testé**, c'est-à-dire la CI (`node-version: 22` dans `ci.yml`). Même
> raisonnement que pour MySQL 8.0.

Sécuriser MySQL (suppression des comptes anonymes et de la base `test`) :

```bash
mysql_secure_installation
```

Les réponses, et **le piège** :

| Question | Réponse | Pourquoi |
|---|---|---|
| `Setup VALIDATE PASSWORD component?` | **`n`** | Voir l'encadré ci-dessous |
| *(mot de passe root)* | *(passé tout seul)* | `Skipping password set for root…` — c'est voulu, voir plus bas |
| `Remove anonymous users?` | **`y`** | Ils permettent de se connecter sans s'identifier |
| `Disallow root login remotely?` | **`y`** | Déjà impossible via `auth_socket`, mais gratuit |
| `Remove test database and access to it?` | **`y`** | La base `test` est livrée accessible en écriture à tous |
| `Reload privilege tables now?` | **`y`** | Applique immédiatement |

> **`VALIDATE PASSWORD` → non, et c'est délibéré.** Ce composant vérifie la **forme** des mots de
> passe, pas leur **force** : `Password1!` passe, un aléatoire de 32 caractères sans ponctuation est
> refusé. Il rejette le fort et accepte le faible. Concrètement, il ferait échouer le
> `CREATE USER … IDENTIFIED BY` du §4 (`ERROR 1819`) sur un mot de passe généré par
> `openssl rand -base64 24`. Ce qui compte est l'**entropie**, pas la présence d'un `@` — les règles
> de complexité répondent au problème des mots de passe *choisis par un humain*, or les nôtres sont
> *générés*. Décision réversible :
> `INSTALL COMPONENT 'file://component_validate_password';`

> **Le `root` MySQL reste en `auth_socket` (le défaut Ubuntu), sans mot de passe.** Seul
> l'utilisateur système `root` peut se connecter en `root` MySQL, par la socket Unix locale.
> C'est **plus sûr** qu'un mot de passe : celui qui n'existe pas ne peut être ni volé, ni deviné,
> ni oublié dans un `~/.bash_history` — et une socket Unix est un fichier local, elle ne traverse
> pas le réseau. Vérifiable par
> `mysql -e "SELECT user, host, plugin FROM mysql.user;"`.
> **Conséquence pour la suite : les commandes `root` du §4 s'écrivent `mysql`, sans `-u root -p`.**

---

## 3. Récupérer le code

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/manu-git-dev/Spoti-Free-fullstack.git spotifree
cd spotifree

npm ci --prefix backend
npm ci --prefix frontend
```

---

## 4. La base de données

Tout se fait en **un seul collage**, et il n'y a **rien à remplacer dedans** — c'est délibéré,
voir l'encadré juste après :

```bash
PW=$(openssl rand -base64 24)
mysql <<SQL
CREATE DATABASE spotifree CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'spotifree'@'localhost' IDENTIFIED BY '$PW';
GRANT ALL PRIVILEGES ON spotifree.* TO 'spotifree'@'localhost';
FLUSH PRIVILEGES;
SQL
echo "$PW"
```

**Ranger la sortie du `echo` dans un gestionnaire de mots de passe immédiatement** : elle resservira
au chargement du schéma (ci-dessous) et dans le `backend/.env` du §6.

> ⚠️ **JAMAIS de valeur à remplacer dans un bloc destiné à être collé.** Dans un terminal, chaque
> retour à la ligne d'un collage **est un appui sur Entrée** : il n'existe aucun instant où l'on
> pourrait éditer le texte. Un `IDENTIFIED BY 'mets-ton-mot-de-passe-ici'` au milieu d'un bloc
> **crée un compte dont le mot de passe est la phrase d'exemple** — erreur réellement commise le
> 2026-07-21. Le motif ci-dessus l'évite par construction : le shell génère le secret et l'injecte
> lui-même, la main humaine n'y touche jamais. Si ça arrive quand même, le correctif est
> `ALTER USER 'spotifree'@'localhost' IDENTIFIED BY '$PW';` — il **remplace** le mot de passe, la
> base et les `GRANT` sont conservés, il n'y a rien à recréer.

> `mysql` tout court : le `root` est en `auth_socket` (§2), il n'y a aucun mot de passe à fournir.
> Le `<<SQL … SQL` est un *here-document* : il envoie à `mysql` tout ce qui suit jusqu'au marqueur
> de fin, ce qui permet de scripter la session au lieu de la taper.

> **`utf8mb4` et pas `utf8`** : le `utf8` historique de MySQL est un faux UTF-8, limité à 3 octets
> par caractère — il ne stocke ni les emoji ni certains idéogrammes. Sur un catalogue alimenté par
> une API internationale, un seul titre exotique fait échouer l'insertion.
> **`utf8mb4_0900_ai_ci`** est la *collation* (règles de tri et de comparaison) : `ai` = insensible
> aux accents, `ci` = insensible à la casse — c'est ce qui fait qu'une recherche « eric » trouve
> « Éric ».

> **`ON spotifree.*` et pas `ON *.*`** : le compte applicatif n'a de droits que sur **sa** base. Si
> l'application est un jour compromise (injection SQL, dépendance vérolée), l'attaquant hérite
> exactement de ces droits, pas plus. C'est la réduction du *rayon d'explosion*, et c'est la même
> raison qui interdit de faire tourner l'app en `root`.

> **Ne pas utiliser `root`** pour l'application : un compte dédié, limité à cette seule base,
> réduit les dégâts si l'application est un jour compromise.

Créer les tables et le catalogue :

```bash
mysql -u spotifree -p spotifree < backend/scripts/schema.sql       # les 9 tables
mysql -u spotifree -p spotifree < backend/scripts/seed-musics.sql  # le catalogue (100 morceaux)
```

> Les scripts `add-*.sql` du même dossier sont des **migrations historiques** : leurs
> modifications sont **déjà incluses** dans `schema.sql`. Ne pas les rejouer.

**La base de production ne contient donc AUCUN utilisateur** — ni `admin@admin.fr`, ni les comptes
de test. C'est voulu : voir §9 pour créer ton compte admin proprement.

---

## 5. Les fichiers audio ⚠️

`backend/public/` **n'est pas versionné** : le catalogue pèse ~590 Mo (100 morceaux), ça n'a
rien à faire dans Git. Le seed ne contient que les *métadonnées* — après le §4, la base connaît
les morceaux, mais le serveur n'a pas un seul fichier à servir.

Deux façons de les obtenir sur le VPS. **La première est la bonne** :

```bash
# A. Depuis ton MAC : envoyer les fichiers déjà téléchargés par le script d'import.
#
# rsync et pas scp : il reprend là où il s'est arrêté. Sur ~566 Mo et une connexion qui
# lâche à 80 %, scp recommence tout depuis zéro.
#   --partial : reprend le FICHIER EN COURS (sans lui, rsync reprend au fichier suivant
#               mais jette le mp3 partiellement transféré)
#   --progress : évite de se demander si c'est planté
# PAS de -z : la compression à la volée n'apporte rien sur du mp3 et du jpg, DÉJÀ
# compressés — elle ne fait que brûler du CPU des deux côtés.
# Le `/` final des deux côtés est significatif : `public/` = « le CONTENU de public ».
# Sans lui, tout atterrirait dans public/public/.
rsync -av --partial --progress public/ root@72.62.236.82:/var/www/spotifree/backend/public/
```

```bash
# B. Sur le VPS : re-télécharger depuis Jamendo plutôt que de transférer.
#    Plus long, mais utile si ta connexion montante est mauvaise.
#    Nécessite JAMENDO_CLIENT_ID dans le .env du VPS (§6).
cd /var/www/spotifree/backend
node scripts/importer-jamendo.mjs --nombre 100
```

> ⚠️ L'option B **régénère `seed-musics.sql`** et peut donc tomber sur d'autres morceaux que ceux
> de ta base. Si tu la choisis, rejoue le seed qu'elle vient d'écrire (§4) — sinon la base et les
> fichiers ne parleront pas des mêmes morceaux.

Le dossier des dépôts en attente (`backend/uploads/`) **existe déjà après le `git clone`** : le
dépôt versionne le dossier sans son contenu, via un `.gitignore` qui contient `*` puis
`!.gitignore`. Rien à créer.

Ce qui compte, en revanche, c'est qu'il appartienne à `www-data` — sinon le premier dépôt échoue
faute de droit d'écriture. C'est fait au §7 (`chown -R www-data:www-data … public uploads`).

> Sans les fichiers, le catalogue s'affiche mais rien ne se lit.

> 🚫 **`tests/preparer-medias.mjs` n'a RIEN à faire en production.** Il fabrique un mp3
> **silencieux de 3 secondes** et une **image noire** par morceau du seed — c'est un outil pour la
> CI et les tests e2e, qui doivent tourner sur une machine neuve sans télécharger 566 Mo. Lancé sur
> le VPS, il donne un site qui *a l'air* complet : 100 titres au catalogue, 100 pochettes… vides.
> Erreur réellement commise le 2026-07-21 sur une autre machine. **Pour la production, l'option A
> et elle seule.**

---

## 6. Configuration

**`backend/.env`** :

```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=spotifree
DB_PASSWORD=<le mot de passe choisi au §4>
DB_NAME=spotifree

JWT_SECRET=<une NOUVELLE clé, voir ci-dessous>
IP_HASH_SALT=<un autre sel aléatoire>

FRONTEND_URL=https://spotifree.manuelmattana.fr

MAIL_USER=ton.adresse@gmail.com
MAIL_PASS=<mot de passe d'application Gmail, 16 caractères SANS ESPACES>
MAIL_TO=ton.adresse@gmail.com    # où arrivent les messages de contact et les notifs de dépôt
```

> ⚠️ **`MAIL_PASS` : 16 caractères, SANS les espaces.** Google affiche le mot de passe
> d'application en **4 groupes de 4 séparés par des espaces** (`abcd efgh ijkl mnop`) pour qu'il
> soit lisible — mais le mot de passe réel, ce sont les **16 caractères collés**. Saisi tel
> qu'affiché, il fait 19 caractères et Gmail répond
> `535-5.7.8 Username and Password not accepted` (`EAUTH`). Erreur réellement commise le
> 2026-07-21, et **invisible depuis le site** : la route « mot de passe oublié » répond `200`
> neutre même quand l'envoi échoue (pour ne pas révéler quelles adresses ont un compte). Seul le
> journal le dit : `journalctl -u spotifree | grep -i 535`.
>
> Vérifier sans afficher le secret, et corriger sans le retaper :
> ```bash
> cd /var/www/spotifree/backend
> BRUT=$(grep '^MAIL_PASS=' .env | cut -d= -f2-)
> NET=$(printf '%s' "$BRUT" | tr -cd 'A-Za-z0-9')   # garde UNIQUEMENT lettres et chiffres
> echo "avant ${#BRUT} / apres ${#NET}"
> if [ ${#NET} -eq 16 ]; then
>   sed -i "s|^MAIL_PASS=.*|MAIL_PASS=$NET|" .env
>   chown www-data:www-data .env && chmod 600 .env   # sed -i recree le fichier EN ROOT
> fi
> systemctl restart spotifree
> ```
> Ne pas se contenter de `s/[[:space:]]//g` : les séparateurs copiés depuis une page web sont
> souvent des **espaces insécables** (U+00A0), que `[[:space:]]` ne reconnaît pas — alors que le
> `\s` de JavaScript, lui, les voit. D'où un diagnostic qui semble se contredire. Voir la
> **note 73** de `NOTES-APPRENTISSAGE.md`.

> **`MAIL_TO` n'est pas optionnel** : sans lui, le formulaire de contact tombe en erreur et les
> notifications de nouveau dépôt ne partent pas. Le serveur AVERTIT au démarrage si l'une des trois
> variables `MAIL_*` manque (voir `src/verifierEnv.js`), mais il démarre quand même — le mail est
> une fonctionnalité annexe, pas le cœur.

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
VITE_API_URL=https://spotifree.manuelmattana.fr
```

> Les variables `VITE_*` sont **compilées dans le bundle** envoyé au navigateur : n'y mettre
> jamais un secret, uniquement des valeurs publiques comme une URL.

Puis construire le front :

```bash
npm run build --prefix frontend    # produit frontend/dist/
```

---

## 7. Lancer le backend en service (systemd)

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

## 8. nginx

nginx sert **tous** tes sites depuis la même machine. Le tri se fait sur le **`server_name`** : nginx
lit le domaine demandé par le navigateur et sert le bloc `server { … }` correspondant. C'est ce qu'on
appelle un *virtual host*, et c'est précisément ce pour quoi nginx est fait.

**Un fichier par site** dans `/etc/nginx/sites-available/`, activé par un lien symbolique dans
`sites-enabled/`. Celui ci-dessous est celui de Spoti-Free ; le portfolio et le WordPress auront
chacun le leur, sans jamais se marcher dessus — et sans qu'on ait à toucher à celui-ci.

`/etc/nginx/sites-available/spotifree` :

```nginx
server {
    listen 80;
    # C'est CETTE ligne qui fait que nginx sert Spoti-Free et pas le portfolio : elle doit
    # correspondre exactement à l'enregistrement DNS créé au §1.
    server_name spotifree.manuelmattana.fr;

    # ⚠️ SANS CETTE LIGNE, LES DÉPÔTS DE MUSIQUE ÉCHOUENT.
    # nginx limite les envois à 1 Mo par défaut ; les morceaux montent à 10 Mo. Le dépôt
    # renverrait un 413 avant même d'atteindre Node — et rien dans le code ne serait en cause.
    client_max_body_size 12M;

    # Le build React
    root /var/www/spotifree/frontend/dist;
    index index.html;

    # LE FALLBACK SPA. React Router gère les routes CÔTÉ NAVIGATEUR : le serveur, lui, n'a aucun
    # fichier "/favoris" sur son disque. Sans cette ligne, ouvrir directement
    # https://spotifree.manuelmattana.fr/favoris renvoie un 404 — alors que la navigation interne
    # fonctionne.
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
certbot --nginx -d spotifree.manuelmattana.fr
```

> **Le HTTPS n'est pas optionnel.** Le jeton JWT circule dans les en-têtes de chaque requête : en
> HTTP simple, n'importe qui sur le réseau (un wifi public) peut le lire et se faire passer pour
> l'utilisateur. Certbot renouvelle le certificat automatiquement.

---

## 9. Créer ton compte administrateur

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

## 10. Vérifications, une fois en ligne

- [ ] Le site s'ouvre en **HTTPS** (cadenas dans le navigateur).
- [ ] **Ouvrir directement `https://spotifree.manuelmattana.fr/favoris`** dans un nouvel onglet → l'app
      s'affiche (et non un 404). C'est le test du fallback SPA.
- [ ] Une musique **se lit** (les fichiers audio sont bien servis).
- [ ] Inscription, connexion, like, playlist.
- [ ] **Mot de passe oublié** → le mail arrive vraiment.
- [ ] **Déposer un morceau de ~8 Mo** → accepté (et non un 413 : c'est le test de
      `client_max_body_size`).
- [ ] Le formulaire de contact fonctionne, et se bloque au 4ᵉ envoi (anti-spam).
- [ ] `journalctl -u spotifree -n 50` → aucune erreur.

---

## 11. Sauvegardes ⚠️

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
