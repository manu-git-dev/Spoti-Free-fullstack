# Suivi du projet

Etat d'avancement et prochaines etapes, pour reprendre le travail sans perdre le fil -
peu importe la machine utilisee. Mis a jour au fil de l'eau (pas un historique complet,
voir les commits Git et `NOTES-APPRENTISSAGE.md` pour ca).

## EN SUSPENS — a lire en premier (mis a jour le 2026-07-17, fin de session)

> Ce qui attend une decision ou du travail. **Rien de ce qui est fait ne figure ici** : c'est
> dans le reste du fichier et dans les commits. Tenu a jour a chaque fin de session (protocole
> dans `CLAUDE.md`). Manuel dit « reprenons » -> Claude restitue cette liste.

### A PENSER (demandes par Manuel le 2026-07-17)

4. **Revoir le CONTENU d'A propos.** Le texte est a modifier — Manuel dira quoi. *(Rappel : une
   demande de texte n'est pas une demande de code — le texte se decide d'abord.)*

7. **Confirmer le responsive.** Toute la refonte (structure des pages via `Page.jsx`, filtre par
   genre, lecteur, modales) a ete verifiee **en 1440x900 uniquement**. Le mobile n'a jamais ete
   ouvert. Points a risque connus : l'en-tete `EnTetePage` **grandit** sur petit ecran (le bloc
   `actions` passe SOUS le titre) — c'est justement ce que le `flex-1 min-h-0` de `Page.jsx` est
   cense encaisser, mais ca n'a pas ete mesure ; le lecteur a un bloc mobile distinct (barre
   compacte, sans curseurs) ; la rangee de pastilles de genre peut passer sur plusieurs lignes.
   Moyen : rejouer la suite e2e en viewport mobile.
8. **Une passe de tests ultra complete AVANT le deploiement.** Les 169 tests sont verts, mais la
   journee a montre qu'ils couvrent ce qu'on a **pense a exercer** : les deux curseurs du lecteur
   etaient morts, le bouton « Modifier » du catalogue repondait 400, et la barre de progression
   debordait de sa carte — **tout ca avec une suite verte**. Manuel a trouve les trois en cliquant.
   Avant la mise en ligne : parcourir l'app a la main, sur bureau ET mobile, chaque page et chaque
   bouton — et transformer chaque trouvaille en test.
9. **Reflechir a remplacer le `localStorage` par une session.** C'est le plus gros chantier de
   cette liste, et le seul qui touche a la securite.

   **Le probleme** : le JWT vit dans `localStorage` (`apiFetch` le lit, `App.jsx` aussi). Or
   `localStorage` est lisible par **n'importe quel JavaScript de la page**. Une seule faille XSS —
   une dependance npm compromise, un `dangerouslySetInnerHTML`, une valeur mal echappee — et le
   jeton part chez l'attaquant, qui devient l'utilisateur pour 24h. Un **cookie `httpOnly`**, lui,
   est **invisible au JavaScript** : le navigateur seul le manipule. C'est la raison d'etre du
   `sourceUrlValide` qui n'autorise que http/https (voir la note 58) — mais fermer une porte XSS
   n'est pas la meme chose que rendre le vol inoffensif.

   **« Session » recouvre trois choses differentes, a ne pas confondre :**
   - **`sessionStorage`** au lieu de `localStorage` : la session s'efface a la fermeture de
     l'onglet. Changement d'une ligne, mais **aucun gain de securite** — c'est le meme stockage,
     lisible par le meme JavaScript. A ecarter si le but est la securite.
   - **Cookie `httpOnly` portant le JWT** : le vrai correctif, et le plus proche de l'existant. On
     garde tout le mecanisme JWT, on change juste **ou** il voyage.
   - **Sessions cote serveur** (`express-session` + un store) : abandonne le JWT. Reglerait au
     passage sa faiblesse structurelle — **un JWT ne se revoque pas** (voir la note 59 : le jeton
     d'un compte supprime reste valide jusqu'a son expiration). Mais c'est un etat a stocker et une
     dependance de plus.

   **Ce qui rend le cookie `httpOnly` realiste ici** : en production, nginx sert le front et l'API
   sur **le meme domaine** (`spotifree.manuel-mattana.fr`, `/` et `/api` — voir le §0 de
   `DEPLOIEMENT.md`). Donc **pas de CORS a negocier**, et `SameSite=Strict` suffit contre le CSRF.
   En dev, en revanche, le front est sur `:5173` et l'API sur `:3000` : deux origines, donc il
   faudra `credentials: "include"`, `cors({ credentials: true })` et `SameSite=None` — **le dev
   sera plus penible que la prod**, c'est le piege de ce chantier.

   **Ce que ca touche** : `apiFetch` (`lib/api.js`), `authMiddleware`, connexion/inscription,
   `Deconnexion.jsx`, `SupprimerCompte.jsx`, la purge de session sur 401, et **toute la suite de
   tests** (`apiAuth(token)` envoie un header `Bearer`, `creerCompte`/`creerAdmin` renvoient un
   token). Ce n'est pas une refonte, mais ce n'est pas une apres-midi.

   **Verdict a trancher** : sur un projet vitrine sans donnees sensibles, `localStorage` est un
   choix courant et defendable — et **savoir expliquer pourquoi on l'a choisi** vaut mieux en
   entretien que d'avoir copie un cookie `httpOnly` sans comprendre. Mais si Manuel veut la
   solution idiomatique, c'est le cookie `httpOnly`. **A faire APRES le deploiement** : c'est
   exactement le genre de changement qui casse l'authentification, et on ne debugge pas une
   authentification cassee le soir d'une mise en ligne.

16. **Envisager un agent de relecture** (`.claude/agents/relecteur.md`) — discute le 2026-07-17,
   pas cree. Le plus utile des trois agents proposes (relecteur > verificateur > explorateur) : il
   relit un diff AVANT commit contre les invariants du projet (surfaces, `apiFetch`, licence
   `NOT NULL`, fichiers partages jamais supprimes…) — ce qu'un relecteur generique ignore. Claude a
   propose de le monter en exemple commente. **En attente du feu vert de Manuel** (projet vs perso).

### Chantier ENRICHISSEMENT (decide le 2026-07-17 : on a le temps, on complete avant de deployer)

Manuel a demande un avis franc sur ce qui manque a l'app. Verdict : l'app est deja plus complete
que la plupart des portfolios de stage — le vrai risque est le scope creep avant deploiement. Mais
trois vrais manques reperes dans le code, ordre de priorite valeur/effort. Le VPS arrive lundi
(2026-07-20), pas de presse pour deployer : Manuel prefere une app finie a une app moyenne en ligne.

17. **Shuffle + repeat du lecteur — CODE FAIT, PAS COMMITE, en attente de validation par Manuel.**
   Fait dans `MediaPlayer.jsx` (+ nettoyage de `maxIndex` devenu mort dans `App.jsx`). Approche
   choisie : **sequence melangee pre-calculee** (Fisher-Yates, titre courant en tete), parcourue
   dans l'ordre → chaque titre passe une fois avant repetition, `precedent` exact. Position derivee
   par `ordreLecture.indexOf(currentIndex)` (pas de pointeur stocke). Repeat = 3 etats off/all/one.
   - **A tester par Manuel dans le navigateur** (reprendre ICI) : les 3 etats de repetition ;
     l'aleatoire ne rejoue pas un titre avant d'avoir fait le tour ; `precedent` en aleatoire ramene
     au vrai titre precedent. Vite recompile sans erreur, mais RIEN n'a ete clique.
   - **2 choix a trancher par Manuel** : (a) defaut = repetition OFF — ca CHANGE le comportement
     actuel (avant : boucle infinie imposee en dur). OK ? (b) shuffle/repeat volontairement absents
     de la barre mobile compacte (play/pause seul, comme le mini-lecteur Spotify) — les vouloir sur
     mobile ?
   - **Ensuite** : en faire un test e2e de non-regression (point #8). Piege a resoudre : tester du
     hasard sans rendre le test instable → tester l'INVARIANT ("les N titres passent tous une fois
     avant repetition"), pas une sequence precise.
18. **Enrichir la page d'accueil (`Home.jsx`).** Aujourd'hui Home n'affiche QU'un Top 5 — c'est la
   plus belle page mais la plus pauvre. Ajouter des sections qui donnent de la "vie" : Reprendre
   l'ecoute / Ecoutes recemment / quelques titres par genre. **Decision liee a trancher** :
   "Ecoutes recemment" suppose un historique → soit une table `historique`, soit du `localStorage`
   client (rapide mais on cherche justement a s'eloigner du `localStorage`, cf #9). A arbitrer.
19. **Panneau "file d'attente" visible.** La queue existe en memoire mais l'utilisateur ne la voit
   pas et ne peut pas la reordonner (Spotify a ce panneau). Plus de travail UI. Bonne nouvelle : la
   file garde son ordre d'origine (le shuffle passe par une sequence separee, cf #17) — donc elle
   est deja prete a etre affichee telle quelle.
20. **Passe d'accessibilite (a11y).** Irregulier : quelques composants ont des `aria-label`,
   beaucoup non ; le lecteur n'est probablement pas pilotable au clavier. C'est le manque "invisible"
   qui compte le plus en entretien de stage (un dev senior audite ca avant les features). Deja fait
   au passage sur les boutons du lecteur (`aria-label` + `aria-pressed`) pendant le #17.

### Ce qui est a faire par Manuel

11. **Les trois `A_COMPLETER` de `frontend/src/pages/MentionsLegales.jsx`** : directeur de la
   publication, contact, hebergeur. **Bloquant pour la mise en ligne.** Ils n'ont pas ete devines
   volontairement : des mentions legales approximatives affirment quelque chose de faux, ce qui est
   pire que pas de mentions legales. L'hebergeur sera connu des la validation Hostinger.
12. **La validation du paiement Hostinger.** C'est la seule chose qui bloque encore le deploiement
   cote machine.

### Decisions reportees (avec leur raison)

13. **La pagination du catalogue** : reportee APRES le deploiement. A 100 morceaux elle ne resout
   aucun probleme (`GET /api/musics` renvoie ~35 Ko), et elle casserait trois choses : la
   recherche et le tri (aujourd'hui cote client, dans `App.jsx`) et surtout **la file d'attente du
   lecteur** (`TrackRow` fait `setCurrentQueue(queue)` avec le catalogue entier — paginee, la
   lecture s'arreterait au bas de la page chargee). Elle redeviendra necessaire vers 300-500
   morceaux, et c'est alors qu'elle aura une vraie raison d'etre.
14. **Monter le catalogue au-dela de 100** : necessite la pagination d'abord. ~6 Mo par morceau
   (100 = 590 Mo, 300 = ~2 Go).
15. **Les tags non classes a l'import** : `indie (4)`, `filmscore (1)` finissent sans genre. Assume
   — `indie` est une posture, pas un son. Le script les liste a chaque import : si l'un revient
   souvent, c'est qu'il manque une famille dans `GENRES`.




