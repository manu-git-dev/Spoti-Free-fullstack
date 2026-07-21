# Suivi du projet

Etat d'avancement et prochaines etapes, pour reprendre le travail sans perdre le fil -
peu importe la machine utilisee. Mis a jour au fil de l'eau (pas un historique complet,
voir les commits Git et `NOTES-APPRENTISSAGE.md` pour ca).

## EN SUSPENS — a lire en premier (mis a jour le 2026-07-21, fin de session)

> Ce qui attend une decision ou du travail. **Rien de ce qui est fait ne figure ici** : c'est
> dans les commits et `NOTES-APPRENTISSAGE.md`. Tenu a jour a chaque fin de session (protocole
> dans `CLAUDE.md`). Manuel dit « reprenons » -> Claude restitue cette liste.
>
> # 🚀 SPOTI-FREE EST EN LIGNE — https://spotifree.manuelmattana.fr
>
> Mis en production le **2026-07-21 au soir**. `DEPLOIEMENT.md` §1→§11 deroule en entier,
> checklist §10 **entierement verte**, redemarrage de la machine valide (tout revient seul).
> Les 3 bugs reels trouves en chemin sont documentes : **notes 71 a 73** de
> `NOTES-APPRENTISSAGE.md`, et `DEPLOIEMENT.md` a ete corrige au fur et a mesure.

### A FAIRE — PROCHAINE SESSION (par ordre)

1. **Lancer les 2 rsync de sauvegarde.** Manuel a demande un rappel systematique en debut de
   session. Le VPS produit les dumps, mais **une sauvegarde qui vit sur la machine qu'elle protege
   ne protege de rien** — le rapatriement est ce qui la rend reelle, et il est forcement manuel
   (le Mac n'est pas toujours allume et son IP change, donc c'est lui qui doit TIRER).
   ```bash
   rsync -av root@72.62.236.82:/var/backups/spotifree/ ~/Sauvegardes/spotifree/
   rsync -av --partial --progress root@72.62.236.82:/var/www/spotifree/backend/public/ ~/Spoti-free-FULLSTACK/backend/public/
   ```
   **Jamais de `--delete`** : la rotation de 14 jours cote VPS sert a ne pas remplir son disque,
   pas a decider ce que Manuel a le droit de conserver.
   Et **verifier la toute premiere execution automatique** du minuteur (00:05, non declenchee a la
   main) : `journalctl -u sauvegarde-spotifree -n 20 --no-pager`.

2. **En-tetes de securite sur le HTML** — le seul point de durcissement restant qui ait de la
   valeur. `helmet` couvre `/api/` (CSP, HSTS, X-Frame-Options, nosniff — verifie en ligne le
   21/07) mais **pas la page HTML servie par nginx**, or c'est elle que le navigateur execute.
   A ajouter en `add_header` dans `/etc/nginx/sites-available/spotifree`.
   **Au passage, corriger un vrai defaut du meme fichier** : le bloc
   `location ~ ^/(musiques|images)/` renvoie **DEUX en-tetes `Cache-Control`** (`expires 30d` en
   genere un, `add_header Cache-Control "public"` en ajoute un second). A fusionner en
   `add_header Cache-Control "public, max-age=2592000"` et supprimer le `expires`.

3. **Durcissement de l'unite systemd** (`NoNewPrivileges`, `PrivateTmp`, `ProtectSystem`).
   Volontairement reporte le 21/07 : on ne met en service qu'une unite **minimale et connue**, pour
   qu'en cas de panne il n'y ait qu'un seul suspect. L'app tournant deja en `www-data`, le gain
   marginal est faible — c'est de la defense en profondeur, pas une urgence.

### En attente d'une DECISION de Manuel

- **Statut d'un depot approuve dont le morceau est ensuite retire du catalogue** (nouveau, 21/07).
  Le depot n°1 reste marque `approuve` alors que son morceau a ete supprime du catalogue apres le
  test. L'historique est juste — l'approbation a bien eu lieu — mais « Mes depots » affichera
  « approuve » pour un morceau introuvable. Faut-il un statut distinct (`retire` ?), ou laisse-t-on
  l'historique tel quel ? **Ce n'est pas un bug, c'est une question de conception non tranchee.**
- **Agent de relecture** (`.claude/agents/relecteur.md`) : relirait un diff AVANT commit contre les
  invariants du projet (surfaces, `apiFetch`, licence `NOT NULL`, fichiers partages jamais
  supprimes…) — ce qu'un relecteur generique ignore. Discute le 2026-07-17, pas cree. **En attente
  du feu vert** (le monter sur ce projet, ou en perso).
- **Note d'apprentissage a ecrire ?** (question posee le 2026-07-18, toujours sans reponse) :
  consigner la lecon « echantillonnage discret vs paliers de rupture » — des captures a 5 largeurs
  isolees avaient rate le bug d'en-tete de la bande 1024-1077 px. A decider.

### En attente de TRAVAIL (hors deploiement)

- **Passe responsive — 2 verifications HUMAINES restantes** (#7/#8 ; la passe auto est faite le
  2026-07-18 : 13 pages x 5 largeurs, 0 debordement, 0 erreur JS) :
  - le **vrai test tactile du lecteur sur le tel de Manuel** (la cible au doigt, pas la mise en
    page) — bloque par le wifi de l'armee (il isole les clients ; hotspot du tel KO, l'iPhone route
    par la 4G). **Desormais testable directement sur https://spotifree.manuelmattana.fr en 4G**,
    sans dependre du wifi : le site est en ligne.
  - la **verif visuelle des grands ecrans (1920/2560) sur le PC de la formation** — pas d'ecran plus
    grand que le portable a la maison. Les captures 2560 sont saines, mais il veut voir en vrai.

### A faire par MANUEL (hors technique, non bloquant)

- **Surveiller le compte bancaire 7-10 jours.** Cote Hostinger, **une seule facture existe**
  (`HCY-27587200`, 110,03 €, `PAID`) — donc en theorie rien a craindre. Si **deux debits ~110 €**
  apparaissent, contacter le support avec la preuve d'annulation de la 1re commande (celle restee
  5 jours en verification anti-fraude). **Rien de preventif cote banque** : une opposition
  bloquerait aussi le VPS actif.
- **Desactiver la reconduction automatique** du domaine et noter son prix de renouvellement.
- **Poser une alerte agenda au ~21 juin 2027.** Le VPS se renouvelle le **21 juillet 2027 a
  ~244,66 € TTC** (203,88 € HT) contre 110,03 € payes la 1re annee grace a 112,19 € de remise —
  soit **plus du double**. C'est la que le choix Hostinger vs Hetzner (~63 €/an) se rejoue pour de
  vrai, site deja en ligne et sans pression. `DEPLOIEMENT.md` etant agnostique (`ssh` + `apt`),
  migrer = rejouer les memes commandes ailleurs.

### ETAT DE LA PRODUCTION (2026-07-21) — la machine telle qu'elle est

- **https://spotifree.manuelmattana.fr** — VPS Hostinger KVM 2, Ubuntu 24.04, IP `72.62.236.82`
  (`srv1845397.hstgr.cloud`). Node 22.23.1 / nginx 1.24 (**HTTP/2**) / MySQL 8.0.46.
  Code dans `/var/www/spotifree`.
- **Service** : `spotifree.service` (systemd, `User=www-data`, `WorkingDirectory` obligatoire,
  `Restart=always`, `enabled` au boot). Node ecoute **`127.0.0.1:3000` uniquement**
  (`HOST` surchargeable pour un futur conteneur, qui devra ecouter `0.0.0.0`).
- **Securite** : `ufw` (22/80/443 seulement) ; SSH **par cle uniquement**
  (`/etc/ssh/sshd_config.d/01-durcissement.conf` — le prefixe **`01-` est indispensable** : dans
  `sshd_config` c'est la **PREMIERE** occurrence d'un mot-cle qui gagne, un fichier `99-` aurait ete
  ignore derriere `50-cloud-init.conf`) ; MySQL `root` en `auth_socket` (aucun mot de passe) ;
  compte applicatif `spotifree` limite a sa seule base ; `.env` en `600 www-data`.
- **Certificat** Let's Encrypt jusqu'au **19/10/2026**, `certbot.timer` a 00:40.
- **Sauvegardes** : `sauvegarde-spotifree.timer` a 00:05 -> `mysqldump --single-transaction`
  gzippe dans `/var/backups/spotifree/`, rotation 14 jours. **Restauration testee pour de vrai**
  le 21/07 (9 tables, 100 morceaux) dans une base jetable.
- **Domaine** : `manuelmattana.fr` — racine reservee au **portfolio** (a venir),
  `blog.` pour un **WordPress** plus tard. DNS chez Hostinger, **TTL 300**.

### Perfs — la mesure du 21/07, pour ne pas la refaire

Latence ressentie de 2-3 s avant que le son ne demarre. **Le serveur n'etait PAS en cause** :
TTFB 60 ms, `Accept-Ranges: bytes` fonctionnel, **256 premiers Ko en 0,15 s**. La cause etait que
les **100 pochettes se chargeaient d'un coup** et saturaient les ~6 connexions simultanees
d'HTTP/1.1 — le mp3 attendait son tour dans la file. Corrige le 21/07 : `loading="lazy"` +
`decoding="async"` (`Card.jsx`, `TrackRow.jsx`), `preload="auto"` sur le `<audio>`
(`MediaPlayer.jsx`), et **HTTP/2 active** sur nginx.

> nginx 1.24 exige `listen 443 ssl http2;` — la directive `http2 on;` separee n'existe qu'a partir
> de 1.25.1. Certbot n'active pas HTTP/2 tout seul.

**S'il reste de la latence perceptible**, le suspect suivant est le **debit binaire des fichiers**
(~200 kbit/s, 5 a 12 Mo par morceau). Deux pistes, dans cet ordre : (1) **precharger le morceau
suivant** de la file — la vraie solution, et elle rejoint directement le chantier « file d'attente »
ci-dessous ; (2) reencoder le catalogue en 128 kbit/s (~40 % de poids en moins, mais c'est un
chantier de **contenu** : 100 fichiers a regenerer, re-rsync, et le seed a ne pas desynchroniser).

### Decisions reportees (avec leur raison)

- **Nommage en anglais : `composants/` -> `components/`** (tranche par Manuel le 2026-07-20) :
  il bascule tous ses **nouveaux** travaux en anglais (portfolio compris), parce que c'est la
  convention du metier meme en France (doc, API, equipes) et qu'il veut s'habituer aux termes
  anglais. **Sur Spoti-Free, le renommage se fera APRES le deploiement** : ca touche tous les
  imports du front, la regle correspondante de `CLAUDE.md` et potentiellement les tests e2e —
  meme raison que l'auth (note 67) et la file d'attente, on ne refactore pas avant une mise en
  ligne. Jusque-la, la convention `composants/` de `CLAUDE.md` **reste en vigueur ici**.

- **Auth : `localStorage` -> cookie `httpOnly`** (#9, tranche le 2026-07-18) : on **garde
  `localStorage`** pour l'instant — choix courant et defendable sur une vitrine sans donnees
  sensibles, et surtout **explicable en entretien**. La migration cookie `httpOnly` (la solution
  idiomatique) se fera **APRES le deploiement** : c'est exactement le genre de changement qui casse
  l'authentification, et on ne debugge pas une auth cassee le soir d'une mise en ligne. Raisonnement
  complet : **note 67** de `NOTES-APPRENTISSAGE.md`.
- **Panneau « file d'attente » visible** (#19, tranche le 2026-07-18) : APRES le deploiement.
  **Modele retenu = Spotify** (tranche par Manuel), pas « afficher le contexte tel quel » : deux
  listes distinctes — le *contexte* (`currentQueue` actuel : la playlist/le catalogue d'ou on a
  lance) et une *file « a suivre »* que l'utilisateur alimente (`Ajouter a la file`), prioritaire sur
  la suite du contexte puis videe une fois jouee. Reporte pour la meme raison que l'auth (note 67) :
  la version propre **refactore le coeur de la lecture**, la zone la mieux couverte par les tests de
  non-regression (shuffle/repeat), et on ne refactore pas ca juste avant une mise en ligne. C'est une
  amelioration, pas un bloquant.
  - **Cle d'architecture a ne pas reperdre** : la file utilisateur est un **tableau separe sans index
    derive** -> la reorganisation (drag) y est triviale, le piege « index vs id » ne touche que le
    contexte (qu'on ne reordonne jamais). MAIS : `currentIndex` est aujourd'hui *derive* de
    `currentMusic` par `findIndex` (`App.jsx:214`), ce qui suppose que le titre courant est toujours
    dans `currentQueue`. Des qu'un titre vient de la file utilisateur (hors contexte), `findIndex`
    renvoie -1. Il faut donc **remplacer le `currentIndex` derive par un pointeur de contexte
    explicite** qui reste fige pendant qu'on depile la file utilisateur, et ne reprend qu'a
    l'epuisement de celle-ci. C'est LA decision de conception du chantier.
  - Restait a trancher cote UI (repris a la reprise) : placement propose par Claude = **3e colonne
    grille a droite** (bureau) + **dans le Dialog plein ecran existant** (mobile) ; drag = `@dnd-kit`
    (effet vitrine) vs boutons haut/bas (a11y gratuite, cocherait #20) ; persistance = en memoire.
- **Pagination du catalogue** (#13) : APRES le deploiement. A 100 morceaux elle ne resout rien
  (`GET /api/musics` ~35 Ko) et casserait la recherche + le tri (cote client) et **la file du
  lecteur** (`TrackRow` fait `setCurrentQueue(queue)` avec le catalogue entier). Necessaire vers
  300-500 morceaux.
- **Monter le catalogue au-dela de 100** (#14) : necessite la pagination d'abord (~6 Mo/morceau ;
  100 = 590 Mo, 300 = ~2 Go).
- **Tags non classes a l'import** (#15) : `indie`, `filmscore`… finissent sans genre. Assume — le
  script les liste a chaque import ; si l'un revient souvent, c'est qu'il manque une famille dans
  `GENRES`.