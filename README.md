# Spoti-Free

[![CI](https://github.com/manu-git-dev/Spoti-Free-fullstack/actions/workflows/ci.yml/badge.svg)](https://github.com/manu-git-dev/Spoti-Free-fullstack/actions/workflows/ci.yml)

Un lecteur de musique en full-stack : écoute, playlists, favoris, dépôt de morceaux avec
modération, et un espace d'administration complet.

Projet personnel de **Manuel Mattana**, en reconversion vers le développement web après dix ans
comme mécanicien aéronautique dans l'armée. Né d'un défi lancé par mon formateur en début de
formation DWWM : reproduire un lecteur audio dans l'esprit de Spotify. L'objectif n'était pas
d'inventer un nouveau Spotify, mais de transformer ce que j'apprenais en cours en une application
qui fonctionne **vraiment** — avec de vrais comptes, une vraie base de données, et de vrais
problèmes à régler quand ça casse.

> **Le code, je l'explique.** À chaque difficulté rencontrée, j'ai écrit une note : le problème,
> la cause, le raisonnement. Elles sont versionnées avec le code, dans
> [`NOTES-APPRENTISSAGE.md`](NOTES-APPRENTISSAGE.md) — une cinquantaine à ce jour.

---

## Ce que fait l'application

- **Écoute** — lecteur avec file d'attente contextuelle (la liste depuis laquelle on lance un
  titre devient la file), lecture continue, précédent/suivant, volume, barre de progression.
- **Bibliothèque** — recherche, affichage liste ou grille.
- **Playlists et favoris** — création, ajout, suppression.
- **Top 5** — classement réel, par nombre d'écoutes.
- **Comptes** — inscription, connexion (JWT), mot de passe oublié par mail.
- **Dépôt de musique** — un utilisateur propose un morceau ; il n'entre au catalogue qu'après
  validation par un administrateur.
- **Administration** — tableau de bord (statistiques, fréquentation, graphiques SVG maison),
  modération des dépôts, gestion des utilisateurs et du catalogue.

## Stack

| | |
|---|---|
| **Frontend** | React 19, Vite, React Router 7, Tailwind CSS v4, shadcn/ui, lucide-react |
| **Backend** | Node.js, Express 5 (ESM), MySQL (`mysql2/promise`) |
| **Auth** | JWT (`jsonwebtoken`), mots de passe hachés (`bcryptjs`) |
| **Tests** | Playwright, 124 tests (parcours, sécurité, dépôt, administration) |
| **CI** | GitHub Actions — base reconstruite de zéro, 124 tests, build, `npm audit` |

---

## Installation

### Prérequis

- Node.js 20+
- Un serveur MySQL 8 (en local, via MAMP par exemple — port `8889` par défaut)

### 1. Cloner et installer

```bash
git clone https://github.com/manu-git-dev/Spoti-Free-fullstack.git
cd Spoti-Free-fullstack

npm install --prefix backend
npm install --prefix frontend
```

### 2. Créer la base

```bash
mysql -u root -p -e "CREATE DATABASE spotifree;"
mysql -u root -p spotifree < backend/scripts/schema.sql       # les 8 tables
mysql -u root -p spotifree < backend/scripts/seed-musics.sql  # le catalogue (20 morceaux)
```

> Les scripts `add-*.sql` du même dossier sont des **migrations historiques** : leurs
> modifications sont déjà incluses dans `schema.sql`. Sur une base neuve, celui-ci suffit.

### 3. Les fichiers audio

Les vrais fichiers (23 Mo) ne sont pas versionnés. Pour obtenir une application **jouable
immédiatement**, on génère des médias de test — un mp3 silencieux, libre de tout droit :

```bash
npm install --prefix tests
node tests/preparer-medias.mjs
```

Le script ne remplace jamais un fichier existant. Pour de la vraie musique, déposez vos propres
`.mp3` dans `backend/public/musiques/` et vos pochettes dans `backend/public/images/`.

### 4. Configurer

Créez `backend/.env` :

```env
PORT=3000
DB_HOST=localhost
DB_PORT=8889
DB_USER=root
DB_PASSWORD=root
DB_NAME=spotifree
JWT_SECRET=une-longue-chaine-aleatoire-a-generer
IP_HASH_SALT=un-autre-sel-aleatoire
FRONTEND_URL=http://localhost:5173

# Facultatif : sans ces variables, aucun mail n'est envoyé
# (le mot de passe oublié et les notifications de dépôt restent silencieux).
MAIL_USER=
MAIL_PASS=
```

Et `frontend/.env` :

```env
VITE_API_URL=http://localhost:3000
```

### 5. Lancer

```bash
npm run dev --prefix backend    # http://localhost:3000
npm run dev --prefix frontend   # http://localhost:5173
```

---

## Tests

```bash
cd tests && npm install && npm test
```

**124 tests**, joués contre l'application réellement démarrée (base + backend + navigateur) :

| Suite | | |
|---|---|---|
| `e2e.test.mjs` | 26 | Parcours utilisateur, dans un vrai navigateur |
| `securite.test.mjs` | 30 | L'API attaquée directement — le point de vue d'un attaquant, qui n'utilise pas l'interface |
| `depot.test.mjs` | 25 | Dépôt et modération |
| `admin.test.mjs` | 25 | Espace d'administration |

Beaucoup sont des **tests de non-régression** : ils verrouillent des bugs réels déjà rencontrés
(le bug des likes après reconnexion, une faille qui laissait modifier le catalogue sans être
connecté, une pochette partagée effacée à tort…). S'ils redeviennent rouges, c'est que le bug est
revenu.

> Mettre `RATE_LIMIT_DISABLED=1` dans `backend/.env` pour la suite : elle crée plusieurs comptes et
> se ferait bloquer par ses propres protections anti-abus. Cette variable est **sans effet si
> `NODE_ENV=production`** : une protection ne doit jamais pouvoir être désactivée par une variable
> oubliée dans un fichier.

## Intégration continue

À chaque `push`, [GitHub Actions](.github/workflows/ci.yml) part d'une machine Ubuntu **vierge** :
il reconstruit la base à partir des seuls fichiers versionnés, démarre les serveurs, joue les 124
tests, compile le build de production et vérifie les vulnérabilités npm.

L'intérêt n'est pas seulement d'exécuter les tests : c'est de prouver que le projet est
**réellement installable par quelqu'un d'autre** — la question exacte que se pose qui clone ce
dépôt.

## Sécurité

Quelques décisions qui ne se voient pas à l'écran, mais qui tiennent le projet debout :

- Les mots de passe sont **hachés** (bcrypt), jamais stockés en clair.
- Les routes d'administration relisent le rôle **en base à chaque requête**, jamais dans le JWT :
  un retrait de droits prend effet immédiatement, sans attendre l'expiration du jeton.
- Un fichier déposé **n'entre jamais dans `public/`** avant validation — il y serait servi
  publiquement, donc en ligne avant modération.
- La validation d'un audio se fait en **décodant le fichier**, pas en croyant son extension : un
  `.txt` renommé en `.mp3` est rejeté.
- Anti-brute-force sur la connexion, limite d'envoi sur le formulaire de contact, jeton de
  réinitialisation stocké **en empreinte**, à usage unique, expirant en 1 h.

## Documentation

| Fichier | |
|---|---|
| [`NOTES-APPRENTISSAGE.md`](NOTES-APPRENTISSAGE.md) | Le journal : chaque difficulté, sa cause, son raisonnement |
| [`SUIVI-PROJET.md`](SUIVI-PROJET.md) | L'état d'avancement et les décisions prises |
| [`DEPLOIEMENT.md`](DEPLOIEMENT.md) | La checklist de mise en production |
| [`docs/FEATURE-depot-musique.md`](docs/FEATURE-depot-musique.md) | La spécification du dépôt avec modération |

---

## Me contacter

Je suis **ouvert à toute opportunité dans le développement web** — alternance ou poste.

- **Mail** : manuel.mattana@hotmail.fr
- **LinkedIn** : https://www.linkedin.com/in/manuel-mattana/
