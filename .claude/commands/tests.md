---
description: Joue la suite de tests e2e (169 tests) avec les bons prérequis
---

Lance la suite de tests de Spoti-Free :

1. Vérifie que MAMP tourne (MySQL sur le port 8889). Sinon, préviens-moi.
2. Vérifie que `RATE_LIMIT_DISABLED=1` est présent dans `backend/.env` : sans ça, les
   tests créent plusieurs comptes et se font bloquer par leurs propres protections
   (rate-limit). Cette variable est sans effet si `NODE_ENV=production`.
3. Vérifie que backend et frontend tournent : les tests visent l'application
   réellement démarrée (MAMP + backend + frontend), pas des mocks.
4. Depuis `tests/` : `npm test`.
5. Le process sort en code 1 si un test échoue. Résume-moi les échecs (fichier + ce
   qui casse), sans me noyer dans le log. Rappelle-moi que beaucoup sont des tests de
   non-régression : un rouge = une régression réapparue, pas juste un test à ajuster.