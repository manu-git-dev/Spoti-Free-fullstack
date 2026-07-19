# Check-list « échecs silencieux » — configuration de production

Compagnon de `DEPLOIEMENT.md`. Ce document répond à **une seule question, variable par variable** :

> *Si cette variable d'environnement manque ou est fausse en production, qu'est-ce qui casse — et
> comment est-ce que je m'en aperçois ?*

Le but : **ne rien découvrir APRÈS la mise en ligne**. À dérouler une fois le `.env` de prod rempli
(`DEPLOIEMENT.md` §6), avant de considérer le déploiement terminé.

---

## Le concept : bruyant vs silencieux

Tous les échecs de config ne se voient pas de la même façon.

- **🔊 Bruyant** — crash, 500, 502, le site ne s'ouvre pas. Désagréable mais *honnête* : tu le
  découvres en deux minutes.
- **🔇 Silencieux** — la requête répond `200 OK`, rien n'est loggé, rien de visible ne casse. Et
  pourtant quelque chose ne marche pas (un mail qui ne part jamais, un rate-limit qui bloquera tout
  le monde plus tard, un hash d'IP réversible). **Ce sont les seuls vraiment dangereux** : le
  déploiement a l'air réussi.

**Ce que fait le garde-fou (`backend/src/verifierEnv.js`).** Il tourne au démarrage, avant tout le
reste, et transforme la plupart des échecs silencieux en **refus de démarrer bruyant et immédiat** :
il liste toutes les variables critiques manquantes et le serveur s'arrête (code 1). Ce qu'il ne peut
pas rendre fatal, il l'**avertit** (`⚠️`). Colonne « Garde-fou » ci-dessous : ce qui est déjà couvert,
et ce qui reste à ta charge.

---

## Tableau de référence

Gravité du **silence**, du plus vicieux au plus visible.

| Variable | Si absente / fausse en prod | Bruyant / Silencieux | Garde-fou | Comment TU t'en aperçois |
|---|---|---|---|---|
| `JWT_SECRET` **faible ou réutilisé du dev** | Tout marche à la perfection — mais un jeton **admin** peut être forgé → prise de contrôle | 🔇 Silencieux **total** | ⚠️ Crash si **absent** ou **< 32 car.** ; ne peut PAS détecter « long mais réutilisé du dev » | ☐ Confirmer que le `JWT_SECRET` de prod a été **généré neuf** (`§6`), jamais vu ailleurs |
| `IP_HASH_SALT` | Le comptage de visites marche (204), mais les IP (donnée perso RGPD) deviennent **réversibles par force brute** | 🔇 Silencieux total | ✅ **Crash** si absente en prod | ☐ Garde-fou suffit — présence vérifiée au boot |
| `NODE_ENV` ≠ `production` | `trust proxy` off → Express voit l'IP de nginx pour **tout le monde** → au 11ᵉ échec de connexion *global*, **tous les utilisateurs bloqués d'un coup**. Se déclenche tard, sans cause apparente. `RATE_LIMIT_DISABLED` redevient actif | 🔇 Silencieux | ⚠️ **Warning seulement** — la variable qui déclare la prod ne peut pas se vérifier elle-même | ☐ Lire les logs de démarrage : **le warning `NODE_ENV n'est pas 'production'` ne doit PAS apparaître** en ligne |
| `MAIL_USER` / `MAIL_PASS` | « Mot de passe oublié » répond « un mail est parti » mais **n'envoie rien** (envoi sous `if (MAIL_*)`, réponse 200 neutre). Contact tombe en 500 | 🔇 Silencieux (reset) / 🔊 Bruyant (contact) | ⚠️ **Warning** au boot si l'une des trois `MAIL_*` manque | ☐ Faire un vrai « mot de passe oublié » → **le mail arrive** (= test §10) |
| `MAIL_TO` | Contact en erreur 500 ; notifs de nouveau dépôt jamais envoyées | 🔊/🔇 | ⚠️ Warning au boot | ☐ Envoyer un message via `/contact` → il arrive dans la boîte |
| `FRONTEND_URL` | 1) CORS bloque le vrai front → aucun appel API ne passe. 2) Le lien du mail de reset retombe sur `http://localhost:5173` → cassé | 🔇 Semi-silencieux (rien côté `journalctl`) | ✅ **Crash** si absente en prod | ☐ Garde-fou couvre l'absence. Si présente : vérifier qu'elle vaut **exactement** l'URL du site (`https://…`, sans `/` final) |
| `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` / `DB_PORT` | Le pool échoue. ⚠️ `db.js` **avale l'erreur** (catch sans exit) → le serveur afficherait « démarré » sur une base morte, puis 500 partout | 🔉 Semi (log au boot, mais process debout) | ✅ **Crash** si l'une manque | ☐ `journalctl` → « Connexion MySQL réussie ! » (et non « impossible ») |
| `PORT` | `app.listen(undefined)` → port aléatoire → nginx cherche le `3000` et ne trouve personne | 🔊 Bruyant | ✅ **Crash** si absente | ☐ Le site répond (pas de **502 Bad Gateway**) |

> `JAMENDO_CLIENT_ID` n'intervient qu'au **script d'import** (`importer-jamendo.mjs`), jamais au
> runtime du serveur : hors périmètre de production, sauf si tu ré-importes le catalogue sur le VPS
> (`DEPLOIEMENT.md` §5, option B).

---

## Check-list du jour du déploiement

À cocher dans l'ordre, une fois `backend/.env` rempli et le service lancé.

**Au démarrage** — `journalctl -u spotifree -n 50` :

- [ ] Le message **« Connexion MySQL réussie ! »** apparaît (pas « impossible »).
- [ ] Le message **« Serveur démarré ! »** apparaît (donc le garde-fou a laissé passer : aucune
      variable critique manquante).
- [ ] Le warning **`NODE_ENV n'est pas 'production'`** est **ABSENT** (s'il est là, `trust proxy`
      est off → rate-limit dangereux).
- [ ] Le warning **`Configuration mail incomplète`** est **ABSENT** (sinon reset + contact muets).

**Secrets** (le garde-fou vérifie la présence, pas l'origine) :

- [ ] `JWT_SECRET` a été **généré spécifiquement pour la prod**, différent de celui de dev.
- [ ] `IP_HASH_SALT` est un second secret aléatoire, distinct du `JWT_SECRET`.

**Comportement observable** (les tests du `DEPLOIEMENT.md` §10, relus sous l'angle « quelle variable
si ça rate ») :

- [ ] Le site s'ouvre et **les appels API passent** → `FRONTEND_URL` correcte (sinon : console
      navigateur pleine d'erreurs CORS).
- [ ] Une musique **se lit** → fichiers servis + `FRONTEND_URL` cohérente.
- [ ] **Mot de passe oublié → le mail arrive** → `MAIL_USER`/`MAIL_PASS` bonnes.
- [ ] **Cliquer le lien du mail de reset** ouvre bien le site de prod (et non `localhost`) →
      `FRONTEND_URL` correcte.
- [ ] Le **formulaire de contact** envoie un message qui arrive → `MAIL_TO` renseignée.
- [ ] Le site répond sans **502** → `PORT=3000` (aligné avec nginx).

Tant qu'une case reste vide, le déploiement n'est pas terminé.
