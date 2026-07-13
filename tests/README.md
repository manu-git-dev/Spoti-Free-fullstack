# Tests

Tests de bout en bout de Spoti-Free, joués **contre l'application réellement démarrée**
(backend + frontend + MySQL), et non contre des mocks.

- `e2e.test.mjs` — les parcours utilisateur, dans un vrai navigateur (Playwright).
- `securite.test.mjs` — la sécurité de l'API, en tapant directement dessus, sans passer par
  l'interface : c'est le point de vue d'un attaquant.

## Lancer les tests

MAMP démarré, backend sur `:3000`, frontend sur `:5173`, puis :

```bash
cd tests
npm install          # installe aussi le navigateur Chromium
npm test             # les deux suites
npm run test:e2e     # les parcours seulement
npm run test:securite
```

La sortie liste chaque vérification, et le processus se termine avec un **code de sortie 1**
si au moins un test échoue (nécessaire pour brancher une CI un jour).

## Ce qui est couvert

**Parcours** — inscription (dont la confirmation du mot de passe), connexion, like/unlike,
favoris, création de playlist, ajout d'un titre, refus du doublon, affichage des durées,
lecteur audio, Top 5, état visiteur, routes protégées, session expirée, et mise en page
(l'app ne doit jamais dépasser la hauteur de l'écran, même avec 15 playlists).

**Sécurité** — les routes d'administration du catalogue (401 sans token, 403 sans le rôle
admin), la validation côté serveur, les codes HTTP (409 sur un doublon, `200 []` sur une
liste vide, 400 sur une requête malformée), CORS, et la limitation anti brute-force.

Plusieurs de ces tests sont des **tests de non-régression** : ils verrouillent des bugs réels
trouvés lors de l'audit du 2026-07-13 (voir `SUIVI-PROJET.md`), pour qu'ils ne puissent pas
revenir sans être détectés. Par exemple *« après une reconnexion, les cœurs des titres déjà
likés sont pleins »* correspond au bug qui rendait certaines musiques impossibles à liker.

## Les limites anti-abus et les tests

La suite crée plusieurs comptes par exécution — et se ferait donc bloquer par sa propre
protection anti-abus (20 inscriptions/heure). Le backend accepte pour cela une variable
**`RATE_LIMIT_DISABLED=1`** dans `backend/.env`, qui coupe les limites.

```bash
# backend/.env
RATE_LIMIT_DISABLED=1
```

Cette variable est **sans effet si `NODE_ENV=production`** (voir `userRoute.js`) : même
oubliée dans un `.env` de prod, les protections restent actives. Une protection ne doit jamais
pouvoir être désactivée par une variable laissée là par mégarde.

Conséquence : quand les limites sont coupées, le test anti brute-force ne peut évidemment pas
passer — il est alors **ignoré**, avec un avertissement, plutôt que de tomber en échec pour une
raison qui n'est pas un bug. Pour le jouer, retirer la variable et redémarrer le backend :

```bash
# backend/.env -> RATE_LIMIT_DISABLED=0
npm run test:securite     # 18/18, brute-force inclus
```

## Deux points à savoir

**Les comptes de test sont supprimés automatiquement** en fin de suite. Ils portent tous le
préfixe `e2e-test+`, et le nettoyage ne cible que celui-là — un vrai compte ne peut donc
jamais être touché.

**Les tests génèrent quelques écoutes.** Tester le lecteur, c'est lancer des titres — et
lancer un titre incrémente `play_count`, qui alimente le Top 5. C'est le prix à payer pour
tester l'application réelle plutôt qu'une simulation. Pour remettre le classement à son état
d'amorçage :

```bash
mysql -h <host> -P <port> -u <user> -p <base> < ../backend/scripts/reset-play-count.sql
```
