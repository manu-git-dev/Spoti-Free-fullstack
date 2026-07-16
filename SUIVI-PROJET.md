# Suivi du projet

Etat d'avancement et prochaines etapes, pour reprendre le travail sans perdre le fil -
peu importe la machine utilisee. Mis a jour au fil de l'eau (pas un historique complet,
voir les commits Git et `NOTES-APPRENTISSAGE.md` pour ca).

## ETAT DU PROJET (au 2026-07-16) — a lire en premier

> ✅ **Le chantier des droits d'auteur est TERMINE** (2026-07-16). Le catalogue de demonstration
> (de vrais titres d'artistes celebres poses sur cinq fichiers libres recycles) a ete remplace par
> **100 vraies oeuvres Creative Commons**, de **100 artistes differents**, chacune avec sa licence
> et un lien vers son original. Plus rien ne bloque la mise en ligne cote droits.

- **147 tests** automatises : `cd tests && npm install && npm test`
  (53 parcours + 40 securite + 29 depot + 25 admin). Sortie en code 1 si echec. **147/147.**
- **CI verte** (GitHub Actions) : les 147 tests tournent aussi sur une machine neuve, a chaque push.
- Les 147 tests passent **contre le build de production**, pas seulement le serveur de dev.
- **0 vulnerabilite** npm. Build OK. Envoi de mail verifie en reel.

### Le chantier des licences (2026-07-16)

Le catalogue passe a **100 morceaux Creative Commons reels** (API Jamendo), et le depot exige
desormais une **declaration de droits**. Ce qui est **fait** :

- `musics` porte `licence` / `licence_url` (**NOT NULL**) et `source_url` ; `submissions` porte
  `licence`, `source_url` et `droits_confirmes_at`. Migration : `scripts/add-licence-columns.sql`,
  **deja appliquee sur la base de dev**, et repercutee dans `schema.sql`.
- Les **trois** chemins d'ecriture dans `musics` (ajout admin, approbation d'un depot, fixture SQL
  des tests) portent la licence. L'URL du deed est **derivee** du code, jamais recue du client.
- Perimetre : **CC BY et CC BY-SA uniquement** (`LICENCES_ACCEPTEES` dans `validation.js`).
- Formulaire de depot : case de certification **non pre-cochee** + licence + source. Valide **cote
  serveur** (le `required` HTML ne protege rien).
- `Attribution.jsx` affiche licence + lien vers l'original dans le lecteur. **CC BY l'exige.**
- Page `/mentions-legales` (+ liens dans l'Aside et le menu mobile).
- `scripts/importer-jamendo.mjs` : recupere les morceaux et **genere** `seed-musics.sql`.

**L'import est FAIT** (2026-07-16). Le catalogue actuel : **100 morceaux, 100 artistes
distincts, 590 Mo**. Licences obtenues : 38 CC BY 3.0, 60 CC BY-SA 3.0, 2 CC BY-SA 2.5. Zero NC,
zero ND. `JAMENDO_CLIENT_ID` est dans `backend/.env`.

Pour rejouer l'import (nouvelle machine, ou plus de morceaux) :

```
cd backend && node scripts/importer-jamendo.mjs --nombre 100
mysql -u root -p spotifree < backend/scripts/seed-musics.sql   # commence par DELETE FROM musics
```

**Ce que l'API Jamendo nous a appris** (tout est commente dans le script — ne pas "simplifier") :

- `ccnd=0` **seul ne suffit pas** : il ecarte les ND mais laisse passer tout le NC. Il faut le
  **couple** `ccnd=0 ccnc=0` pour n'avoir que `by` et `by-sa`.
- `license_ccurl` et les genres ne sont **pas renvoyes par defaut** : il faut
  `include=licenses musicinfo`. Avec une **espace**, pas un `+` — `URLSearchParams` encode un `+`
  litteral en `%2B`, que l'API ignore **en silence** (elle repond "success" avec les champs vides).
- L'API renvoie **des pages vides au hasard** (1 a 3 sur 6), avec `status: "success"` et aucune
  erreur : impossible de les distinguer d'une vraie fin de catalogue. D'ou les 4 tentatives par
  offset dans `recupererPage()`. **Sans ca, l'import s'arrete tot en annoncant une reussite.**
- Les textes arrivent **encodes pour le HTML** (« Ground &amp; Leaves ») : decodes a l'entree, une
  base contient du texte, pas du HTML.

**A FAIRE AUSSI avant la mise en ligne :**

- `frontend/src/pages/MentionsLegales.jsx` contient **trois `A_COMPLETER`** (directeur de la
  publication, contact, hebergeur). Ils n'ont pas ete devines : des mentions legales approximatives
  sont pires que pas de mentions legales. L'hebergeur sera connu des la validation Hostinger.

### Filtre par genre — FAIT le 2026-07-16

Une rangee de pastilles dans la Bibliotheque, cumulables avec la recherche texte.

- **La liste des genres est DEDUITE du catalogue** (`genresDisponibles` dans `App.jsx`), jamais
  ecrite en dur : le catalogue est genere, et un depot approuve peut apporter un genre nouveau.
  Une liste figee afficherait un jour une pastille vide, ou en oublierait une.
- **Le vrai travail etait dans les DONNEES, pas dans l'interface.** Jamendo n'a pas des genres
  mais des **tags** : 66 valeurs distinctes sur 400 morceaux, avec une longue traine a une seule
  occurrence (`bossanova`, `8bit`, `waltz`, `manouche`…). Le filtre naif donnait 25 entrees dont
  14 menant a UN morceau, etiquetees avec des slugs bruts (« Rnb », « Edm »,
  « Alternativehiphop »). `FAMILLES_DE_GENRES` (dans le script d'import) replie tout ca sur 10
  familles. Resultat : Pop 29, Rock 19, Electro 10, Folk 10, Soul 7, Chill 5, Jazz 5, Hip-hop 4,
  Reggae 2, et 9 sans genre.
- Le repliement se fait **a l'import**, pas a l'affichage — meme raison que pour les entites HTML :
  une base contient de la donnee propre, sinon chaque lecteur devra re-mapper pour son compte.
- `indie` et `experimental` sont **volontairement absents** de la table : ce ne sont pas des
  genres mais des postures. On les ignore pour tomber sur le tag suivant, plus precis
  (["indie", "pop"] -> Pop).
- Le script **liste les tags non classes** en fin d'import (`indie (4)`, `filmscore (1)`) : un
  import qui perd de l'information en silence est un import qu'on ne peut pas ameliorer.

**Limite connue** : le formulaire de depot laisse le genre en **texte libre**. Un depot approuve
avec « Trap » creera une pastille a un morceau, et la derive recommencera lentement. Le passer en
`<select>` sur les memes familles (comme la licence) reglerait le probleme a la source. Pas fait :
la moderation absorbe le cas pour l'instant, et l'admin peut corriger le genre.

### Suppression de compte (RGPD) — FAIT le 2026-07-16

`DELETE /api/users/mon-compte` + bouton et modale dans le profil. Deux garde-fous distincts :
la **modale** confirme l'intention, le **mot de passe** confirme l'identite (une session ouverte
ne prouve pas qui est devant l'ecran). Un mot de passe faux repond **403** et non 401 — un 401
purgerait la session pour une simple faute de frappe.

- **Le dernier admin ne peut pas se supprimer** (409) : sinon le catalogue et la moderation
  deviennent definitivement ingerables, et il faut repasser par MySQL a la main sur le serveur.
- **Les fichiers des depots** : seuls ceux des depots `en_attente` sont effaces (ils sont dans
  `uploads/`). Ceux des depots **approuves** ont ete DEPLACES dans `public/` — ils appartiennent
  au catalogue, et une pochette peut etre partagee. On n'y touche pas. Un morceau publie reste
  donc au catalogue apres le depart de son auteur : il y est sous licence libre, et le retirer
  casserait les playlists des autres.
- Bug corrige au passage : `GET /api/users/profil` repondait **200 avec un corps vide** pour un
  utilisateur inexistant (`res.json(undefined)`). Repond desormais 404.

### Ce que fait l'application

Ecoute (bibliotheque, favoris, playlists, lecteur avec file d'attente contextuelle), Top 5 reel
par nombre d'ecoutes, comptes (inscription, connexion, **mot de passe oublie**), **depot de
musique par les utilisateurs avec moderation**, et un **espace d'administration** complet
(tableau de bord avec statistiques et graphiques, moderation des depots, gestion des
utilisateurs, gestion du catalogue).

### LA PROCHAINE ETAPE : le deploiement

**Le deploiement n'attend plus que la machine** (validation du paiement Hostinger). Le catalogue
est en place, les 147 tests sont verts. Reste a completer les trois `A_COMPLETER` des mentions
legales (dont l'hebergeur, connu des la validation).

**Etat au 2026-07-16 — le deploiement est EN COURS.** VPS **commande** chez Hostinger : **KVM 2**
(2 vCPU, 8 Go RAM, 100 Go NVMe), 12 mois, **Ubuntu 24.04 LTS**, datacenter France. Le paiement
etait encore bloque en "en cours de traitement" en fin de journee (controle anti-fraude sur compte
neuf, jusqu'a 2h annoncees par le support). Domaine retenu : **`manuel-mattana.fr`** (offert avec
l'offre, a reserver des validation). Deja fait, cote prerequis : cle SSH **ed25519**, `JWT_SECRET`
et `IP_HASH_SALT` generes, mot de passe d'application Gmail pour `MAIL_PASS`, **2FA** active sur le
compte hebergeur. **Il ne manque que la machine.**

**L'architecture : un domaine, des sous-domaines.** Le portfolio a la racine
(`manuel-mattana.fr`) listera les projets ; cliquer un projet mene au projet **reellement en
ligne**, sur son sous-domaine. Spoti-Free vit donc sur **`spotifree.manuel-mattana.fr`**. Un
sous-domaine est gratuit et illimite : chaque futur projet aura son adresse sans racheter de
domaine. Un WordPress (`blog.manuel-mattana.fr`) viendra plus tard.

**L'ordre : Spoti-Free d'abord, seul**, puis le portfolio, puis WordPress. Quand quelque chose
casse - et quelque chose cassera -, il faut n'avoir change qu'une seule chose depuis le dernier
etat qui marchait.

Tout est deroule pas a pas dans **`DEPLOIEMENT.md`** (DNS, nginx, systemd, HTTPS, sauvegardes).

**Pourquoi Ubuntu 24.04 et pas 26.04**, pourtant plus recente et LTS elle aussi : `apt install
mysql-server` livre **MySQL 8.0 sur 24.04**, mais **MySQL 8.4 sur 26.04**. Or la CI teste contre
`mysql:8.0` - deployer sur 26.04 ferait tourner la prod sur une version qu'**aucun des 147 tests
n'a jamais exercee**. Regle : pour un deploiement, prendre l'avant-derniere LTS.

**Echeance a ne pas rater : ~juin 2027**, un mois avant le renouvellement - la facture Hostinger
passe de ~107 EUR a ~200 EUR/an. `DEPLOIEMENT.md` etant agnostique de l'hebergeur (`ssh` + `apt`),
migrer revient a rejouer les memes commandes ailleurs (Hetzner ~63 EUR/an, prix stable). Aucun
verrouillage - mais il faut y penser avant la reconduction.

**Pourquoi un VPS et pas un mutualise** : le mutualise execute du PHP, pas un serveur Node en
continu — et son disque ne persiste pas. Or les musiques deposees sont ecrites sur le disque : sur
un hebergeur ephemere (Render, Railway), elles disparaitraient a chaque redeploiement. Le meme VPS
hebergera aussi son portfolio, ses autres projets et un WordPress.

**Les trois choses a ne pas rater** (elles casseraient le site sans que le code soit en cause) :
1. **`client_max_body_size 12M`** dans nginx — la limite par defaut est de **1 Mo**, or les depots
   montent a 10 Mo. Sans cette ligne, TOUT depot echoue en 413.
2. **Le fallback SPA** (`try_files $uri $uri/ /index.html`) — sans lui, ouvrir directement
   `/favoris` renvoie un 404. La navigation interne marche, mais pas un lien partage.
3. **Envoyer les fichiers audio par `rsync`** — `backend/public/` n'est dans aucun depot Git.
   C'est l'etape qu'on oublie : sans elle, le catalogue s'affiche mais rien ne se lit. Avec ~400 Mo,
   `rsync` et pas `scp` : il reprend ou il s'est arrete si la connexion lache.

Note : **la purge des comptes de demo n'a plus lieu d'etre.** La base de prod est construite avec
`schema.sql` + `seed-musics.sql`, elle ne contient donc **aucun utilisateur** (ni `admin@admin.fr`,
ni `patrick@test.fr`). Il faudra creer son compte admin (`DEPLOIEMENT.md` §9).

### Creer la base sur une machine neuve

```
mysql -u <user> -p <base> < backend/scripts/schema.sql       # les 8 tables
mysql -u <user> -p <base> < backend/scripts/seed-musics.sql  # le catalogue
node tests/preparer-medias.mjs                               # medias de test (mp3 silencieux)
```

Les scripts `add-*.sql` sont des **migrations historiques** : leurs modifications sont **deja
incluses** dans `schema.sql`. Ne pas les rejouer.

### Points connus, assumes

- Le token est dans `localStorage` : volable en cas de faille XSS. L'alternative (cookie
  `httpOnly`) demande de revoir l'authentification.
- Le bundle frontend depasse 500 kB : un code-splitting accelererait le premier chargement.
- Pas de CI : les tests existent et sortent en code 1, il ne reste qu'a les brancher.
- Pas de sauvegarde de `backend/public/` — qui est **gitignore**. Les fichiers audio et les
  pochettes ne sont donc versionnes nulle part : si le disque lache, ils sont perdus.

### Conventions a respecter (etablies au fil du projet)

- **Surfaces** : `bg-background` = fond de l'app ; `bg-card`/`bg-sidebar` + `border-border` = les
  panneaux ; `bg-background/50` + `border-border` = ce qui vit **dans** un panneau. Ne jamais
  mettre `bg-card` sur un enfant du `main` (qui est deja en `bg-card`) : il devient invisible.
- **Couleurs** : primary (violet) = identite et etat actif ; accent (bleu) = survol ;
  destructive (rouge) = suppressions **reelles**, jamais la deconnexion.
- **Tous les appels API passent par `apiFetch`** (`frontend/src/lib/api.js`) : il porte le token,
  l'URL de base (`VITE_API_URL`) et l'interception des 401. Ne plus jamais ecrire `fetch()` nu ni
  d'URL en dur.
- **Les fichiers deposes ne vont JAMAIS dans `public/`** avant validation (voir
  `docs/FEATURE-depot-musique.md`).
- **Ne jamais supprimer un fichier partage** : les pochettes sont mutualisees (une image sert a
  plusieurs morceaux). Toujours verifier qu'aucun autre morceau ne le reference.

## Pre-deploiement : les verifications - 2026-07-14 - fait

Passe avant mise en ligne. Verdict : **plus aucun bloquant**.

- **Les 147 tests passent contre le BUILD DE PRODUCTION** (`vite preview`), pas seulement contre le
  serveur de dev. Le build est sain. Au passage, le premier essai a echoue sur **CORS** (le build
  tournait sur le port 4173, non declare dans `FRONTEND_URL`) — ce qui prouve que la protection
  fonctionne. A noter : le serveur avait quand meme cree le compte (201). **CORS protege le
  NAVIGATEUR, pas le serveur** : un appel en curl passe sans probleme.
- **Le mail part vraiment** : connexion SMTP Gmail verifiee (`transporter.verify()`) puis parcours
  "mot de passe oublie" complet, mail recu. Rappel : la route n'envoie rien si le compte n'existe
  pas (anti-enumeration) — un test sur une adresse inconnue ne prouve donc rien.
- **La purge des comptes de demo n'a plus lieu d'etre** : la base de production est construite avec
  `schema.sql` + `seed-musics.sql`, elle ne contient donc **aucun utilisateur**. Ni `admin@admin.fr`,
  ni `patrick@test.fr`. Il faudra creer son compte admin (voir `DEPLOIEMENT.md` §8).

### Hebergement retenu : un VPS

Decision structurante. **Un hebergement mutualise (l'offre a quelques euros) ne convient pas** : il
execute du PHP, pas un serveur Node en continu. Et un VPS a un **disque qui persiste** —
indispensable, puisque les musiques deposees sont ecrites sur le disque. Sur un hebergeur a systeme
de fichiers ephemere (Render, Railway), elles disparaitraient a chaque redeploiement.

Consequence heureuse : **le code fonctionne tel quel**, aucun refactor du stockage.

`DEPLOIEMENT.md` entierement reecrit pour un VPS : nginx, systemd, HTTPS, sauvegardes. Les deux
pieges qui casseraient le site sans que le code soit en cause :
- **`client_max_body_size 12M`** dans nginx : la limite par defaut est de **1 Mo**, or les depots
  montent a 10 Mo. Sans cette ligne, tout depot echoue en 413.
- **le fallback SPA** (`try_files $uri $uri/ /index.html`) : sans lui, ouvrir directement
  `/favoris` renvoie un 404 — la navigation interne marche, mais pas un lien partage.

## Integration continue (GitHub Actions) - 2026-07-14 - fait

`.github/workflows/ci.yml` : a chaque push sur `main`, une machine Ubuntu **neuve** reconstruit la
base, demarre les serveurs, joue les **147 tests**, compile le build de production et verifie
`npm audit`. Badge vert sur le README. Vert en 2 min 24.

**La CI a surtout servi de REVELATEUR** : le projet n'etait pas installable ailleurs que sur cette
machine. Trois defauts corriges (voir la note 55 de `NOTES-APPRENTISSAGE.md`) :

1. **Le schema de la base n'etait versionne NULLE PART.** Les tables `users`, `musics`,
   `playlists`, `likes` n'existaient que dans le MySQL de MAMP. Un recruteur qui clonait le depot
   ne pouvait pas lancer l'app, et `DEPLOIEMENT.md` etait faux (les scripts `add-*.sql` supposaient
   des tables inexistantes). -> `backend/scripts/schema.sql` + `seed-musics.sql`.
2. **Les tests dependaient d'un compte fantome** : ils forgeaient un jeton pour `id_user: 10` /
   `admin@admin.fr`, qui n'existe que dans la base de dev — et qui est justement le compte que
   `DEPLOIEMENT.md` demande de PURGER. Ils auraient casse le jour de la purge. -> helper
   `creerAdmin()` : les tests creent leur propre admin.
3. **`depot.test` lisait un vrai mp3 dans `backend/public/`** (gitignore). -> `tests/fixtures/` :
   un mp3 SILENCIEUX fabrique (vraies trames MPEG, donc accepte par `music-metadata`), 33 Ko,
   libre de droit. `tests/preparer-medias.mjs` recree `public/` sur une machine neuve.

### Installation sur une machine neuve (desormais possible)

```
mysql -u root -p spotifree < backend/scripts/schema.sql       # les 8 tables
mysql -u root -p spotifree < backend/scripts/seed-musics.sql  # le catalogue
node tests/preparer-medias.mjs                                # les medias de test
```

Les scripts `add-*.sql` sont des **migrations historiques** : deja incluses dans `schema.sql`.

### README refait

L'ancien `README.md` etait un README de **profil GitHub** ("Bonjour, je suis Manuel Mattana"), pas
celui du projet : il n'expliquait ni l'installation, ni le lancement, et affichait encore "recherche
actuellement un stage". Remplace par un vrai README de projet (badge CI, installation, tests,
decisions de securite).

## Retouches UI/UX - 2026-07-14 - fait

Passe de finition demandee par Manuel : validation en direct a l'inscription, formulaire sur deux
colonnes, en-tete de page unifie sur 13 pages (`composants/EnTetePage.jsx`), logo anime (egaliseur
qui danse pendant la lecture), et page A propos reecrite. Detail ci-dessous.

## Detail des retouches UI/UX - 2026-07-14

Passe de finition demandee par Manuel avant la CI et le deploiement.

### Inscription : validation en direct (fait)

Les regles du mot de passe existaient cote serveur mais n'etaient **ecrites nulle part dans
l'interface** : on les decouvrait en se prenant l'erreur au submit. Desormais, retour visuel
pendant la saisie (croix rouge / check vert) sur l'email, le mot de passe et la confirmation.

- **Regle durcie** : 8 caracteres + **une majuscule** + **un chiffre** (avant : 8 caracteres).
  Durcie **cote serveur** — le front ne fait que l'afficher.
- `backend/src/validation.js` : source de verite unique, importee par l'inscription **et** la
  reinitialisation de mot de passe. Sans ca, la nouvelle regle se contournait en passant par
  "mot de passe oublie" pour se choisir un mot de passe faible.
- `frontend/src/lib/validation.js` + `composants/ChecklistMotDePasse.jsx` : le miroir d'affichage,
  partage par les pages Inscription et Reinitialisation.
- **Timing indulgent** : le rouge n'apparait qu'apres avoir quitte le champ (`onBlur`), puis se met
  a jour en direct. Le vert, lui, s'affiche des que la regle est remplie.
- **Le bouton d'envoi n'est PAS desactive** quand le formulaire est invalide (un bouton grise
  n'explique rien, et le test e2e clique dessus pour verifier que le compte n'est pas cree).
- 3 tests de non-regression ajoutes (sans majuscule / sans chiffre / meme regle sur la
  reinitialisation). Suite : **147 tests**.

Voir la note 54 de `NOTES-APPRENTISSAGE.md`.

### Reste a faire

- Les autres retouches UI/UX que Manuel signalera.
- Ensuite : brancher une **CI** (GitHub Actions), puis le **deploiement**.

## Espace d'administration, mot de passe oublie, Aside - 2026-07-14 - fait

### Tableau de bord admin (`/admin`)

Nouvelle table `visites` + route publique `POST /api/admin/visite`. Deux choix a connaitre :
- **C'est le FRONT qui signale la visite** (effet sur `useLocation` dans `App.jsx`), pas un
  middleware serveur : dans une SPA, le serveur ne voit que des appels API, et une seule page en
  declenche plusieurs — on compterait 5 "visites" pour une seule page consultee.
- **L'IP est hachee AVEC UN SEL** (`IP_HASH_SALT`). Un SHA-256 d'IP tout seul ne protege rien :
  il n'existe que ~4 milliards d'IPv4, on peut toutes les hacher en quelques secondes.

Statistiques : totaux, courbe de frequentation (visiteurs uniques / pages vues), inscriptions par
jour, classements ecoutes/likes, repartition des depots, pages les plus consultees.

**Les graphiques sont en SVG maison** (`composants/graphiques/Graphiques.jsx`) — pas de librairie
pour quatre formes. La palette a ete **validee par script**, pas choisie a l'oeil : les couleurs
brutes du theme echouaient (violet a 2.6:1 de contraste seulement, accent bleu hors de la bande
de luminosite du mode sombre). L'accent est donc legerement assombri (`#5c8fe6`). Si tu ajoutes un
graphique, garde ces deux couleurs et l'ordre fixe (1re serie = violet, 2e = bleu).

### Gestion des utilisateurs (`/admin/utilisateurs`)

Lister, promouvoir/retrograder (avec **confirmation**), supprimer (avec confirmation qui annonce
ce qui sera detruit).

**Volontairement PAS d'edition du pseudo, du nom ni de l'email** : l'email est l'identifiant de
connexion, un admin capable de le changer pourrait se l'attribuer et se connecter a la place de la
personne. Escalade de privileges, sans besoin legitime. **Ne pas "completer" ce CRUD.**

Garde-fous : pas d'auto-suppression, pas d'auto-retrogradation, jamais le dernier admin.

### Gestion du catalogue (`/admin/musiques`)

Renommer (titre, artiste, genre) et supprimer. Deux corrections importantes :
- `PUT /api/musics/update/:id` faisait un `UPDATE` de **toutes** les colonnes : un appel n'envoyant
  que le titre mettait `src_audio` et `src_image` a `NULL` — morceau injouable, pochette cassee,
  **en silence**. La route n'accepte plus que les metadonnees.
- `DELETE` supprime maintenant les fichiers — mais **seulement s'ils ne sont references par aucun
  autre morceau**. Les pochettes sont mutualisees : une suppression aveugle en casse d'autres.

### Mot de passe oublie

Le lien de la page Connexion pointait sur `to="#"`. Parcours complet : `/mot-de-passe-oublie` puis
`/reinitialiser-mot-de-passe?token=…`. Quatre protections (voir note 47 des notes d'apprentissage) :
reponse **identique** que le compte existe ou non (anti-enumeration), jeton stocke en **empreinte**,
**usage unique**, **expiration 1h**. Table `password_resets`.

### Navigation

- **Aside reorganisee en sections** : Écouter / Mes playlists / Mon compte / Administration, puis
  A propos-Contact fixes en bas. L'administration vient en dernier : c'est un espace de travail,
  pas la raison d'etre du site.
- **Trou de navigation mobile corrige** : "Déposer", "Mes demandes" et TOUT l'espace admin etaient
  inaccessibles sur telephone (les liens vivent dans l'Aside, masquee sous `md`). Le burger du
  `HeaderMobile` porte desormais ces liens, avec un contenu qui s'adapte au role.

### Depot de musique — ajustements

- La **pochette est facultative** : sans elle, une image du catalogue est tiree au hasard a
  l'approbation.
- L'admin peut **consulter et telecharger** l'audio et la pochette avant de valider (verification
  des droits).
- Le suivi des demandes a sa propre page (`/mes-depots`), la page `/deposer` reste centree sur son
  formulaire.

## Audit complet de l'application - 2026-07-13 - fait

Passe de verification de bout en bout (backend route par route + 21 tests de parcours
Playwright sur l'app reelle). Tout ce qui suit a ete **reproduit** avant d'etre corrige.

### Faille de securite (critique) - corrigee

`POST /api/musics/ajouter`, `PUT /api/musics/update/:id` et `DELETE /api/musics/delete/:id`
n'avaient **aucun middleware**. Verifie en conditions reelles : sans le moindre token, on
pouvait creer, modifier **et supprimer** les musiques du catalogue.

- Nouvelle colonne `users.role` (`user` | `admin`), voir `backend/scripts/add-role-column.sql`
  (a rejouer sur toute autre machine / base).
- Nouveau `adminMiddleware` : relit le role **en base** a chaque requete plutot que de le lire
  dans le JWT, pour qu'un retrait de droits prenne effet immediatement sans attendre
  l'expiration du token.
- Les 3 routes du catalogue + `GET /api/users` passent par `authMiddleware` + `adminMiddleware`
  (`401` sans token, `403` pour un utilisateur normal). Le test `idUser !== 10` code en dur a
  disparu.

### Bug des likes - corrige

Cause : dans `App.jsx`, les effets qui chargent likes et playlists avaient `[]` en dependances
et lisaient `localStorage` a l'interieur. **localStorage n'est pas reactif** : les effets ne se
relancaient donc jamais apres une connexion. `musiquesLikee` restait vide -> les coeurs des
musiques deja likees s'affichaient vides -> recliquer dessus declenchait un `INSERT` en doublon
-> violation de la cle primaire `(id_user, id_music)` -> `500`.

Les deux effets dependent maintenant de `token` (le state). Voir la note 31 de
`NOTES-APPRENTISSAGE.md`.

### Autres bugs corriges

- `GET /api/playlists/musics/:idPlaylist` oubliait `duration` dans son `SELECT` : les durees
  s'affichaient `--:--` dans le contenu d'une playlist.
- `MusicsInPlaylist` : `useEffect` avec `[]` alors qu'il depend de `idPlaylist`. En passant
  d'une playlist a une autre, React Router reutilise le composant sans le remonter -> la page
  affichait le contenu de la **playlist precedente**. Corrige avec `[idPlaylist]`.
- **JWT expire** (l'ancien point ouvert) : le front croyait l'utilisateur connecte ("Bonjour X",
  bouton Deconnexion) alors que chaque action echouait avec "Token invalide". La session est
  desormais purgee des qu'une route protegee repond `401`.
- Les toasts, places en haut a droite, recouvraient les boutons "Connexion"/"Se deconnecter" -
  regression introduite par la passe precedente. Ils sont remontes au-dessus du lecteur.
- `express.json()` ne renseigne `req.body` que si le `Content-Type` est json. Sans ce header,
  toute route POST/PUT levait une `TypeError` et repondait `500` au lieu de `400`. Garde-fou
  global ajoute dans `server.js`.
- Inscription : l'API acceptait `password: "a"` et `email: "pas-un-email"` (201 !). Le
  `type="email"` du formulaire et la verification React ne protegent que le navigateur.
  Validation ajoutee **cote serveur**.

### Robustesse

- `db.js` : `createConnection` -> **`createPool`** (une connexion unique est un point de rupture
  unique : si MySQL la ferme, tout echoue jusqu'au redemarrage). L'API des routes est inchangee.
- `express-generator` retire (outil de scaffolding CLI jamais utilise a l'execution) : il portait
  les 5 vulnerabilites de `npm audit`. **0 vulnerabilite** sur le backend comme sur le frontend.
- Imports morts supprimes (`useState`/`useEffect` dans Favoris et Playlists, `Link` dans App).

### Points restants (non bloquants)

- Le token est stocke dans `localStorage` : lisible par du JavaScript, donc volable en cas de
  faille XSS. L'alternative (cookie `httpOnly` + `SameSite`) est plus sure mais demande de
  revoir l'authentification. Assume a ce stade.
- Le bundle frontend depasse 500 kB : un code-splitting (`import()` dynamique) accelererait le
  premier chargement. Sans consequence fonctionnelle.
- Pas de CI : les tests existent (`cd tests && npm test`) et sortent en code 1 en cas d'echec,
  il ne reste qu'a les brancher sur un workflow GitHub Actions.

## Depot de musique avec moderation - 2026-07-13 - fait

Un utilisateur connecte depose un morceau (page `/deposer`, glisser-deposer). Le depot part en
attente, l'admin recoit un mail, ecoute le morceau sur `/admin/depots`, et approuve ou refuse.
Le morceau ne rejoint le catalogue qu'a l'approbation.

Spec complete : `docs/FEATURE-depot-musique.md`.

### Les deux decisions structurantes

**1. Le fichier depose ne va JAMAIS dans `public/`.** `server.js` fait
`express.static("public")` : tout ce qui s'y trouve est servi publiquement, immediatement. Un
morceau depose y serait donc en ligne AVANT moderation. Les fichiers vont dans
`backend/uploads/` (gitignore) et ne sont deplaces qu'a l'approbation — le seul endroit du code
ou un fichier entre dans `public/`.

**2. Une table `submissions` separee**, pas un statut sur `musics`. Sinon toutes les requetes
existantes (catalogue, Top 5, recherche) devraient penser a filtrer les morceaux non valides, et
un seul oubli les ferait apparaitre. Ici ils ne peuvent pas fuiter : ils ne sont pas dans la
table que l'app lit.

### La validation du fichier

L'extension et le `Content-Type` viennent du client et se falsifient en renommant un fichier :
ils ne servent que de premier tri. La vraie validation est le decodage avec `music-metadata` —
s'il n'y a pas de duree a mesurer, ce n'est pas de l'audio, quel que soit son nom. En prime, le
decodage fournit la duree, qu'on n'a donc jamais a demander au client.

Verifie par test : un `.txt` renomme en `.mp3` est rejete.

Autres protections : nom de fichier **regenere** cote serveur (`crypto.randomUUID()` — un nom
comme `../../server.js` ferait ecrire hors de `uploads/`), limites de taille (10 Mo / 2 Mo),
rate limit (5 depots/heure), suppression des fichiers orphelins en cas d'echec.

### A savoir cote front

Un `<audio src="/api/submissions/12/audio">` ne fonctionne pas : quand le navigateur va chercher
un `src` lui-meme, il n'envoie pas l'en-tete `Authorization`, et la route (reservee a l'admin)
repond 401. `composants/LecteurDepot.jsx` telecharge donc le fichier via `apiFetch` et le lit
depuis un Blob local — sans mettre le token dans une URL (ou il finirait dans les logs et
l'historique du navigateur).

### Tests

`tests/depot.test.mjs` — 17 verifications. Suite complete : **60 tests** (26 e2e + 17 securite +
17 depot).

### A faire au deploiement

Rejouer `backend/scripts/add-submissions-table.sql`, et creer le dossier `backend/uploads/`
(vide, mais il doit exister et etre accessible en ecriture).

## Durcissement avant deploiement + suite de tests - 2026-07-13 - fait

Reponse a la question "l'app est-elle prete a etre deployee ?" : elle ne l'etait pas. La partie
*application* etait saine, c'est la partie *mise en ligne* qui manquait.

### Le formulaire de contact pouvait servir a inonder la boite mail (le plus grave)

`POST /api/contact` envoie un VRAI mail a chaque appel, sans aucune limite. Une fois le site en
ligne, n'importe quel bot (ils scannent les formulaires en permanence) pouvait boucler dessus :
boite noyee, voire compte Gmail suspendu pour envoi abusif.

- 3 messages par IP et par heure, avec `skipFailedRequests` : seuls les envois REELLEMENT partis
  comptent, donc un visiteur qui se trompe de format d'email n'est pas puni.
- Format d'email valide cote serveur (sinon `replyTo` prenait une valeur arbitraire) et limite
  de taille (rien n'empechait un message de plusieurs Mo).

### Les autres correctifs

- **CORS** : `cors()` sans option autorisait TOUTES les origines. Restreint a `FRONTEND_URL`.
- **`JWT_SECRET`** : 27 caracteres -> 64 aleatoires. C'est la cle qui signe tous les tokens ;
  devinee, elle permet de forger un token admin.
- **`trust proxy`** (si `NODE_ENV=production`) : sans lui, derriere un reverse proxy, Express voit
  l'IP du PROXY — le rate limiter aurait bloque **tous** les visiteurs d'un coup au 11e echec.
- **Middleware d'erreur global** : une exception non rattrapee renvoyait la stack trace au client
  (fuite des chemins de fichiers). Elle est loggee cote serveur, le client recoit un message
  generique. Et une route inconnue renvoie du JSON, plus la page HTML par defaut d'Express.

### Les protections sont desactivables... sauf en production

La suite de tests cree plusieurs comptes par execution et se faisait bloquer par ses propres
protections. `RATE_LIMIT_DISABLED=1` les coupe — mais la variable est **sans effet si
`NODE_ENV=production`** (voir `backend/src/config.js`). Meme oubliee dans un `.env` de prod, les
protections restent actives : une protection ne doit jamais pouvoir etre desactivee par une
variable laissee la par megarde.

### Suite de tests versionnee (`tests/`)

Jusqu'ici les tests etaient temporaires, hors du depot — un vrai manque pour un projet vitrine.

```bash
cd tests && npm install && npm test     # 44 verifications
```

- `e2e.test.mjs` (26) : parcours utilisateur dans un vrai navigateur.
- `securite.test.mjs` (18) : securite de l'API, en tapant directement dessus — le point de vue
  d'un attaquant, qui n'utilise pas l'interface.

Plusieurs sont des tests de **non-regression** : ils verrouillent les bugs reels de l'audit (le
bug des likes apres reconnexion, la faille du catalogue, l'app qui depassait l'ecran) pour qu'ils
ne reviennent pas sans etre detectes. Le processus sort en **code 1** si un test echoue : il n'y
a plus qu'a brancher une CI.

Les comptes de test portent le prefixe `e2e-test+` et sont supprimes automatiquement ; le filtre
de nettoyage ne cible que ce prefixe, un vrai compte ne peut donc jamais etre touche.

### `DEPLOIEMENT.md`

Checklist de mise en production. Le point a ne pas rater : **purger les comptes de demonstration**.
La base de dev contient `patrick@test.fr`, `admin@admin.fr`, `testshadcn…` — dont un **admin**
dont le mot de passe n'est plus maitrise. L'emmener en production laisserait une porte ouverte
sur tout le catalogue.

## Top 5 reel, apiFetch, anti brute-force, a11y, fix de l'Aside - 2026-07-13 - fait

### L'app depassait la hauteur de l'ecran (Aside)

Symptome signale par Manuel : avec beaucoup de playlists, l'Aside grandit et fait deborder
toute l'app. Le scroll interne ajoute a la passe design (`overflow-y-auto`) ne s'activait
jamais.

**Cause** : le shell utilisait `grid-rows-[1fr_88px]`. En CSS Grid, **`1fr` vaut
`minmax(auto, 1fr)`** : ce `auto` en minimum interdit a la ligne de descendre sous la taille
de son contenu. Rien ne contraignait donc jamais la hauteur de l'Aside, et l'`overflow-y-auto`
n'avait aucune raison de s'activer. Corrige avec **`minmax(0, 1fr)`**.

Mesure avec 15 playlists : page = 900px pour un ecran de 900px (et 720/720 en 1280x720), la
liste scrolle a l'interieur, "A propos"/"Contact" restent visibles.

**Conclusion sur la question posee** (limiter a 5-6 playlists dans l'Aside, ou abandonner
l'affichage ?) : **ni l'un ni l'autre**. Le probleme etait le CSS, pas le nombre d'entrees —
avec 6 playlists sur un petit portable, ca aurait deborde quand meme. L'affichage complet est
conserve.

### Top 5 : un vrai classement par ecoutes

- Colonne `musics.play_count` (`scripts/add-play-count.sql`), amorcee sur 5 titres (5, 4, 3,
  2, 1) pour que le classement soit credible des la premiere visite.
- `POST /api/musics/ecoute/:id` (volontairement publique : l'ecoute d'un visiteur compte) et
  `GET /api/musics/top`.
- `MediaPlayer` compte une ecoute a chaque **nouvelle** piste lancee (dependance sur
  `music?.id_music` : reprendre apres une pause ne recompte pas), puis rafraichit le Top 5.

**Pas de tache planifiee** : le classement est un `ORDER BY play_count DESC`, il est donc
toujours a jour. Un cron hebdomadaire n'aurait rien apporte. (Un vrai "top de la semaine"
glissant aurait demande une table `plays` avec un `played_at` — option ecartee au profit du
compteur simple.)

### `src/lib/api.js` : point de passage unique de tous les appels API

Resout trois problemes d'un coup :

- **401 sur une action isolee** (le point restant de l'audit) : un like avec un token expire
  affichait "Token invalide" et laissait l'utilisateur dans une session morte. Desormais
  *tout* 401 purge la session, quel que soit l'appel qui l'a provoque. Le helper
  `messageErreur()` evite d'afficher deux toasts (le jargon technique + le message utile).
- **URL en dur** : `http://localhost:3000` etait ecrit dans 14 fichiers. Elle vient maintenant
  de `VITE_API_URL` (voir `frontend/.env.example` ; le `.env` est gitignore).
- **Token** : chaque composant relisait localStorage et reconstruisait son header
  `Authorization`. C'est fait une fois, dans `apiFetch`.

Un **`AuthContext` n'est du coup plus necessaire** : plus aucun composant n'a besoin du token.

### Anti brute-force

`express-rate-limit` sur `/connexion` (10 tentatives par IP / 15 min ; `skipSuccessfulRequests`
: seuls les **echecs** comptent, un utilisateur normal n'est donc jamais bloque) et sur
`/inscription` (20/h). Verifie : la 11e tentative ratee renvoie un `429`.

### Accessibilite

Les boutons "Connexion" / "Me contacter" etaient des `<a role="button">` (shadcn `Button` +
`render={<Link/>}`) : un lecteur d'ecran annoncait "bouton" alors que l'element **navigue**.
Ils utilisent maintenant le pattern shadcn correct : un vrai `<Link>` stylé via
`buttonVariants()`.

## Passe shadcn/ui + theme Midnight Bloom - 2026-07-13 - faite

Contexte : la migration vers shadcn/ui (composants dans `src/components/ui/`, en anglais,
a cote des composants metier de `src/composants/` en francais - les deux cohabitent
volontairement) etait faite mais non commitee, et l'app restait visuellement monochrome.

Diagnostic : les tokens du theme **etaient deja corrects** dans `index.css` (les valeurs
oklch correspondent exactement au preset officiel `midnight-bloom` de tweakcn : primary
`#6c5ce7` violet, card `#2f3436` gris, accent `#6495ed` bleu, secondary `#4b0082` indigo).
Le probleme n'etait pas les couleurs mais leur **usage** :

- `App.jsx` gardait `bg-zinc-900` sur le `main` - un gris Tailwind **hors theme**, et plus
  sombre que la sidebar : les deux zones se fondaient l'une dans l'autre. C'etait le dernier
  reliquat des "classes couleur en dur" listees dans les points ouverts.
- Le token `--card` (le gris du theme) n'etait utilise **nulle part** dans le contenu : les
  `TrackRow` et les pages flottaient directement sur `--background`, d'ou l'aplat noir.
- `secondary` et `accent` etaient quasi absents. Le seul element colore de la Home etait le
  bouton **rouge** "Se deconnecter" - l'oeil etait attire par la pire action de la page.

Hierarchie de surfaces retenue (a respecter pour tout nouveau composant) :
- `bg-background` : le fond de l'app, sert de gouttiere entre les panneaux.
- `bg-card` / `bg-sidebar` + `border-border` : les panneaux (main, Aside, MediaPlayer,
  BottomNav, HeaderMobile).
- `bg-background/50` + `border-border` : les elements **a l'interieur** d'un panneau
  (TrackRow, Card, cartes de playlist, blocs de Profil, formulaire de Contact). Ils se
  "creusent" dans le panneau clair. **Ne plus utiliser `bg-card` la-dedans** : depuis que le
  `main` est en `bg-card`, un enfant en `bg-card` devient invisible.

Roles couleur (a suivre) :
- **primary** (violet) : identite + etat actif (logo, nav active, piste en cours, player).
- **accent** (bleu) : survol et interactions secondaires.
- **secondary** (indigo) : decor (le halo "bloom" en haut du contenu).
- **destructive** (rouge) : suppressions reelles uniquement - **pas** la deconnexion.

Corrige au passage : `ButtonAddPlaylist` forcait `size="icon-sm"` sur son trigger, donc le
bouton "Ajouter une playlist" (texte long) debordait de l'ecran - le trigger est desormais
parametrable (`variant`/`size`/`className`). Icones `Github`/`Linkedin` remplacees par
`Code2`/`Briefcase` (les logos de marques ont ete retires de lucide-react). Cle React
manquante sur la liste de `Playlists.jsx`.

Verifie avec Playwright en session authentifiee reelle (compte de test peuple avec
playlists + likes, puis supprime de la base), desktop 1440 et mobile 390, sur toutes les
routes + l'etat "en lecture" + les modales.

## Phase actuelle (au 2026-07-06)

Refonte visuelle mobile-first : **passe complete site-wide faite le 2026-07-06**
(responsive sur toutes les pages + alignement maquette Login/Register/Aside/mini-player).
Fonctionnalites (playlists, likes, Apropos/Contact) et routes protegees deja faites -
voir commits `df8f4ee` et anterieurs.

## Passe responsive + maquette du 2026-07-06 - faite

- Fait : `Favoris.jsx`/`Playlists.jsx`/`MusicsInPlaylist.jsx` - wrapper `p-4 md:p-8`,
  grille `grid-cols-2 md:grid-cols-5`, titres `text-2xl font-serif`, etats vides avec
  `col-span-2 md:col-span-5` (alignes sur le pattern deja en place dans `Home.jsx`/
  `Bibliotheque.jsx`). Plus aucun overflow horizontal verifie a 390px sur ces 3 pages.
- Fait : `Contact.jsx` - padding mobile (`p-4 md:p-12`) et ligne Nom/Mail qui s'empile
  sur mobile (`flex-col md:flex-row`, `w-full md:w-1/2`).
- Fait : `Home.jsx` - boutons temporaires Connexion/Inscription alignes sur la maquette
  ("S'inscrire" en lien texte, "Connexion" en pilule violette `rounded-full`).
- Fait : bug `Aside.jsx` "Mes playlists" corrige - `useMatch("/playlists")` porte
  maintenant l'etat actif sur le `<div>` parent (texte + icone `+` inclus dans le
  meme fond `bg-accent/15`), au lieu du `NavLink` seul. Verifie visuellement (capture
  desktop), autres items de nav non-regresses.
- Fait : `Login.jsx`/`Register.jsx` - refonte visuelle complete alignee sur la maquette
  (cercle degrade + titre serif + sous-titre, champs a icone via le pattern daisyUI v5
  `label.input` + `lucide-react`, largeur responsive `w-full max-w-sm` a la place des
  `w-xl` fixes qui debordaient sur mobile, bouton pilule `btn-primary rounded-full`,
  lien croise Connexion <-> Inscription). Lien "Mot de passe oublie ?" affiche mais mort
  (pas de backend de reset) - assume. Register a maintenant un champ confirmation de mot
  de passe (verif cote front avant submit, testee : message d'erreur si les deux ne
  correspondent pas). `Aside`/`BottomNav`/`MediaPlayer` restent affiches partout comme
  decide precedemment (pas de panneau gauche gradient, pas de plein-ecran).
- Fait : mini-player mobile dans `MediaPlayer.jsx` - barre compacte (vignette + titre/
  artiste + bouton play/pause) affichee au-dessus de la `BottomNav` en mobile, en
  reutilisant le meme `<audio>`/state/handlers que la barre complete desktop (un seul
  bloc composant, deux blocs JSX freres bascules par `md:hidden`/`hidden md:flex`).
  Verifie avec Playwright : un seul noeud `<audio>` a tout moment (mobile et desktop),
  toggle play/pause fonctionnel, barre complete desktop non regressee.
- Verification faite via un script Playwright (dev servers locaux + compte de test
  cree puis supprime de la base) : 7 routes sans overflow a 390px, flow inscription/
  connexion reel teste de bout en bout, Favoris/Playlists verifies en session authentifiee.

Reste ouvert (mineur, non bloquant) :
- Colonne gauche de `Contact.jsx` en texte/liens bruts plutot que les icones-en-rond-
  colore de la maquette - choix visuel assume, pas re-tranche.
- Mini-player mobile : pas de precedent/suivant/volume/seek, juste play/pause (scope
  volontairement reduit par rapport a la barre desktop).

## Passe 2 du 2026-07-06 - lecteur desktop, header, cards/listes conformes a la maquette - faite

Suite a un retour apres la 1ere passe : le lecteur desktop, l'alignement du header, et les
"cards" ne ressemblaient pas a la maquette. En comparant aux captures
`docs/maquette/desktop-*.png`, l'ecart etait plus large qu'un habillage CSS : **Home (Top 5)
et Favoris/le contenu d'une playlist sont en realite des LISTES** (rang, vignette,
titre/artiste, icones cœur/plus), pas une grille de cards - seule **Bibliotheque reste une
grille**, avec un style de card different (fond uni `bg-base-200`, plus de bordure bleue,
image carree encadree, juste icones en bas).

- Fait : `Card.jsx` restyle (grille, utilise uniquement par `Bibliotheque.jsx` desormais) -
  fond `bg-base-200`, plus de bordure bleue, image carree, titre/artiste discrets, icones
  cœur/plus alignees a droite en bas (plus de gros boutons texte colores).
- Fait : `ButtonLike.jsx`/`AddMusicPlaylist.jsx`/`RemoveMusicPlaylist.jsx` - boutons texte
  remplaces par des icones (`Heart`/`Plus`/`Trash2`, lucide-react), meme logique/fetch/state
  qu'avant, seule la presentation change.
- Fait : nouveau composant `composants/TrackRow.jsx` - ligne de liste (rang, vignette,
  titre/artiste, cœur/plus) pour les contextes "liste" (Home Top 5, Favoris, contenu d'une
  playlist). Pas de colonne "ecoutes"/"duree" comme sur la maquette : aucune des deux
  donnees n'existe reellement cote backend (`duration` referencee dans `musicRoute.js`
  mais colonne absente de la table `musics` en base - route deja cassee, hors scope) - pas
  de donnee fantaisiste affichee a la place.
- Fait : `Home.jsx`/`Favoris.jsx`/`MusicsInPlaylist.jsx` reconnectes sur `TrackRow` (liste
  `flex flex-col`) au lieu de la grille `Card`/`ListesCard`. `Bibliotheque.jsx` inchange
  (reste une grille, herite du nouveau style de `Card.jsx`). `Playlists.jsx` (grille de
  tuiles de playlists, pas de pistes) laisse tel quel - aucune maquette n'existe pour cet
  ecran.
- Fait : `Home.jsx` - boutons Connexion/Inscription (temporaires) colles a droite
  (`justify-end w-full`).
- Fait : `MediaPlayer.jsx` - barre desktop entierement reconstruite sur 2 rangees fidele a
  la maquette (vignette+titre/artiste a gauche, precedent/lecture(bouton rond)/suivant au
  centre, icone volume+slider a droite, rangee temps/seek en dessous). Reutilise
  integralement `handlePlay`/`handleNext`/`handlePrevious`/`audioRef` deja partages avec le
  mini-player mobile - aucun changement de logique.
- Verifie avec Playwright (compte de test cree puis supprime) : navigation SPA reelle
  (clics sur les liens de la sidebar, pas de rechargement de page) confirmee sans
  interruption de lecture (meme `<audio>`, `isPlaying` conserve) ; precedent/suivant
  testes (`Around the World` -> `Bad Guy` -> `Believer` -> retour `Bad Guy`) ; capture des
  nouveaux styles Bibliotheque/Home/Favoris/lecteur comparee a la maquette.

## Page Profil + toggle liste/grille Bibliotheque du 2026-07-13 - faite

- Fait : route backend `GET /api/users/profil` (`userRoute.js`) protegee par
  `authMiddleware`, filtree sur `req.user.id_user` (pas de parametre d'URL, evite l'IDOR).
- Fait : nouvelle page `frontend/src/pages/Profil.jsx` - avatar en cercle dégradé
  `primary -> accent` avec l'initiale du pseudo, prenom/nom/pseudo/email, stats
  (playlists/favoris/membre depuis), bouton Deconnexion restyle (`Deconnexion.jsx`, pilule
  contour `error` + icone `LogOut`, partage avec `Home.jsx`). Route `/profil` volontairement
  **publique** (pas de `ProtectedRoute`) - `Profil.jsx` gere lui-meme l'etat invite (message
  + liens Connexion/Inscription) si `user === null`, pour que l'onglet Profil de la
  `BottomNav` ait un sens meme deconnecte sur mobile.
- Fait : simplification de `BottomNav.jsx` - l'onglet Profil pointe desormais
  inconditionnellement vers `/profil` (avant : `/connexion` en dur) ; suppression du hack
  `redirectedFromProtected`/`fromProtected` qui n'existait que pour compenser cette
  redirection forcee.
- Fait : petit avatar rond (lien vers `/profil`) ajoute a cote du bouton
  Deconnexion dans `Home.jsx`, visible seulement si connecte (pas de doublon avec les
  boutons Connexion/Inscription pour un visiteur).
- Fait : suppression de `composants/Header.jsx` (code mort, plus utilise depuis le passage
  de la nav desktop sur `Aside.jsx`).
- Fait : `Bibliotheque.jsx` - toggle d'affichage liste/grille (`useState viewMode`, defaut
  `"liste"`). Mode liste reutilise `TrackRow` (meme pattern que le Top 5 de `Home.jsx`,
  `.map` avec `index` pour le rang) ; mode grille inchange (`ListesCard`/`Card.jsx`). Toggle
  stylise en pilule `bg-base-200` avec icones `List`/`LayoutGrid` (lucide-react), calque sur
  le style des tabs de `BottomNav`/`Aside`.

Les deux points "reste ouvert" de cette passe (bug Rules of Hooks dans `Profil.jsx`, lien
Profil manquant dans `Aside.jsx`) ont ete corriges le jour meme, voir section suivante.

## File de lecture contextuelle, invite sur Favoris/Playlists, duree des pistes - 2026-07-13

- Fait : bug Rules of Hooks corrige dans `Profil.jsx` (le test sur `token` est deplace a
  l'interieur du `useEffect`, dependance `[token]`).
- Fait : lien "Profil" ajoute dans `Aside.jsx` (4e item du groupe de nav principal, sous
  Favoris), conforme a la maquette.
- Fait : **file de lecture contextuelle**. Avant, `MediaPlayer` naviguait toujours (next/
  precedent) dans `musiquesFiltre` (bibliotheque complete triee alphabetiquement), peu
  importe la liste depuis laquelle la lecture avait ete lancee - Top 5, Favoris, playlist
  et Bibliotheque avaient donc toutes ce bug, pas seulement le Top 5. Nouvel etat
  `currentQueue` dans `App.jsx` ; `TrackRow`/`Card` recoivent une prop `queue` (la liste a
  laquelle ils appartiennent) et appellent `setCurrentQueue(queue)` en plus de
  `setCurrentMusic` au clic. `MediaPlayer` navigue desormais dans cette queue plutot que
  dans la bibliotheque complete.
- Fait : `/favoris` et `/playlists` ne sont plus derriere `ProtectedRoute` - meme pattern
  que `/profil` (voir passe precedente) : `Favoris.jsx`/`Playlists.jsx` gerent elles-memes
  l'etat invite (message + liens Connexion/Inscription) si `user === null`. Corrige au
  passage un bug de nav mobile : en etant deconnecte, cliquer sur Favoris/Playlists dans
  la `BottomNav` redirigeait de force vers `/connexion`, donc aucun onglet ne s'affichait
  actif (on n'etait plus reellement sur la page). `/playlists/:idPlaylist` reste protegee
  (pas de playlists a voir pour un invite de toute facon).
- Fait : colonne `duration` (INT, secondes) ajoutee a la table `musics`, backfillee avec
  les vraies durees des fichiers mp3 (`backend/scripts/backfill-duration.js`, lib
  `music-metadata`, pas de valeurs inventees). `GET /api/musics` la remonte automatiquement
  (`SELECT *`). Affichee dans `TrackRow.jsx`, format `mm:ss` toujours sur 2 chiffres
  (`01:43`).

## Autres points ouverts (pas urgents, a reprendre quand on y arrive)

Liste nettoyee apres l'audit du 2026-07-13 : les couleurs en dur, le bug JWT, le check admin
`idUser !== 10`, `createConnection`, les codes HTTP et les vulnerabilites `npm audit` sont
desormais **regles** (voir la section "Audit complet"). Le point `event.stopPropagation()` etait
**obsolete** : verifie par test, les boutons (coeur, ajout, renommer/supprimer) sont des freres
du conteneur cliquable dans le DOM, pas ses enfants - un clic dessus ne lance donc pas la lecture
et ne navigue pas.

Restent :

- **Feedback des 401 sur une action isolee** : la session expiree est bien detectee au chargement
  (effets d'`App.jsx`), mais un like effectue avec un token expire affiche "Token invalide" sans
  deconnecter. Le design cible est un **`AuthContext` + wrapper `apiFetch`** interceptant tous les
  `401` - refactor d'architecture, a faire consciemment.
- `AddMusicPlaylist` : pas de filtre cote frontend pour retirer de la liste deroulante les
  playlists qui contiennent deja la musique. Le backend bloque le doublon (409, message clair),
  mais l'UX pourrait l'empecher avant meme la tentative.
- Accessibilite : le bouton "Connexion" est un `<a role="button">` (shadcn `Button` +
  `render={<Link/>}`) - un lecteur d'ecran annonce "bouton" alors que l'element navigue.
> Nettoyage du 2026-07-16 : trois points de cette liste etaient **perimes** et ont ete retires
> apres verification dans le code. (1) *Top 5 : simple `.slice(0, 5)`* → faux, la colonne
> `play_count` existe (`schema.sql`), la route `/api/musics/top` fait un vrai classement, et
> `Home.jsx:19` documente lui-meme l'ancien slice comme revolu. (2) *Pas de limitation des
> tentatives de connexion* → faux, `express-rate-limit` est en place dans `server.js` et 3 routes.
> (3) *Deploiement : rejouer `add-role-column.sql` + sortir les URLs `localhost` en dur* → faux
> dans les deux cas : la colonne `role` est dans `schema.sql`, et `apiFetch` centralise tout via
> `VITE_API_URL` (`frontend/src/lib/api.js:16`).
>
> **Une note de suivi perimee coute plus cher que pas de note** : en pleine mise en prod, elle fait
> chercher un probleme inexistant — ou pire, rejouer une migration inutile sur la base de
> production.

## Maquette Pencil

Fichier source : `~/Documents/Maquette-Spoti-Free.pen` (hors Git, local a cette machine,
necessite l'app Pencil pour etre edite). Export statique (PNG/JPEG) disponible dans
`docs/maquette/`, consultable sans Pencil et sur n'importe quelle machine - a regenerer
depuis le fichier source si la maquette evolue.

Ecrans maquettes (mobile + desktop pour chacun) : Home, Bibliotheque, Favoris, A propos,
Contact, Connexion, Inscription, Profil (ajoute le 2026-07-13, voir docs/maquette/README.md
pour la note sur l'onglet Profil ajoute a l'Aside desktop). Pas encore maquette : Playlists.
