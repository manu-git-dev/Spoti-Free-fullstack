# Suivi du projet

Etat d'avancement et prochaines etapes, pour reprendre le travail sans perdre le fil -
peu importe la machine utilisee. Mis a jour au fil de l'eau (pas un historique complet,
voir les commits Git et `NOTES-APPRENTISSAGE.md` pour ca).

## EN SUSPENS — a lire en premier (mis a jour le 2026-07-17)

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




