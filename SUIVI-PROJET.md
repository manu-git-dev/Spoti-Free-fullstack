# Suivi du projet

Etat d'avancement et prochaines etapes, pour reprendre le travail sans perdre le fil -
peu importe la machine utilisee. Mis a jour au fil de l'eau (pas un historique complet,
voir les commits Git et `NOTES-APPRENTISSAGE.md` pour ca).

## EN SUSPENS — a lire en premier (mis a jour le 2026-07-18, fin de session)

> Ce qui attend une decision ou du travail. **Rien de ce qui est fait ne figure ici** : c'est
> dans les commits et `NOTES-APPRENTISSAGE.md`. Tenu a jour a chaque fin de session (protocole
> dans `CLAUDE.md`). Manuel dit « reprenons » -> Claude restitue cette liste.

### En attente d'une DECISION de Manuel

- **Agent de relecture** (`.claude/agents/relecteur.md`) : relirait un diff AVANT commit contre les
  invariants du projet (surfaces, `apiFetch`, licence `NOT NULL`, fichiers partages jamais
  supprimes…) — ce qu'un relecteur generique ignore. Discute le 2026-07-17, pas cree. **En attente
  du feu vert** (le monter sur ce projet, ou en perso).

### En attente de TRAVAIL

- **Passe responsive + tests manuels complete AVANT deploiement** (#7/#8) : parcourir **chaque page
  et chaque bouton, bureau ET mobile**, et transformer chaque trouvaille en test. La refonte n'a ete
  verifiee qu'en 1440x900 + quelques passes DevTools ; le vrai mobile n'a presque jamais ete ouvert.
  Inclut le **vrai test tactile du lecteur sur le tel de Manuel** — reporte cette session : la box de
  l'armee **isole les clients du wifi** (impossible de joindre le Mac depuis le tel ; le hotspot du
  tel ne marche pas non plus car l'iPhone route par la 4G). DevTools a valide la MISE EN PAGE du
  lecteur plein ecran mobile, mais **pas la cible tactile au doigt** (les icones font 16px + padding).
- **Panneau « file d'attente » visible** (#19) : la queue existe en memoire mais l'utilisateur ne la
  voit pas et ne peut pas la reordonner (Spotify a ce panneau). Deja pret cote donnees : le shuffle
  passe par une sequence separee, donc la file garde son ordre d'origine — prete a etre affichee.
- **Passe d'accessibilite** (#20) : irregulier (des `aria-label` par endroits, pas partout ; le
  lecteur n'est probablement pas pilotable au clavier). Entamee au fil de l'eau sur le lecteur. C'est
  le manque « invisible » qui compte le plus en entretien de stage.
- **Revoir le CONTENU d'A propos** (#4) : le texte est a modifier — Manuel dira quoi. *(Une demande
  de texte n'est pas une demande de code : le texte se decide d'abord.)*

### A faire par MANUEL (bloquant pour la mise en ligne)

- **Les trois `A_COMPLETER` de `frontend/src/pages/MentionsLegales.jsx`** (#11) : directeur de la
  publication, contact, hebergeur. Pas devines volontairement : des mentions legales approximatives
  affirment quelque chose de faux, pire que pas de mentions. L'hebergeur sera connu a la validation
  Hostinger.
- **La validation du paiement Hostinger** (#12) : la seule chose qui bloque encore le deploiement
  cote machine.

### Decisions reportees (avec leur raison)

- **Auth : `localStorage` -> cookie `httpOnly`** (#9, tranche le 2026-07-18) : on **garde
  `localStorage`** pour l'instant — choix courant et defendable sur une vitrine sans donnees
  sensibles, et surtout **explicable en entretien**. La migration cookie `httpOnly` (la solution
  idiomatique) se fera **APRES le deploiement** : c'est exactement le genre de changement qui casse
  l'authentification, et on ne debugge pas une auth cassee le soir d'une mise en ligne. Raisonnement
  complet : **note 67** de `NOTES-APPRENTISSAGE.md`.
- **Pagination du catalogue** (#13) : APRES le deploiement. A 100 morceaux elle ne resout rien
  (`GET /api/musics` ~35 Ko) et casserait la recherche + le tri (cote client) et **la file du
  lecteur** (`TrackRow` fait `setCurrentQueue(queue)` avec le catalogue entier). Necessaire vers
  300-500 morceaux.
- **Monter le catalogue au-dela de 100** (#14) : necessite la pagination d'abord (~6 Mo/morceau ;
  100 = 590 Mo, 300 = ~2 Go).
- **Tags non classes a l'import** (#15) : `indie`, `filmscore`… finissent sans genre. Assume — le
  script les liste a chaque import ; si l'un revient souvent, c'est qu'il manque une famille dans
  `GENRES`.