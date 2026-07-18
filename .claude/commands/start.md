---
description: Démarre l'app en local (MAMP + backend + frontend) dans le bon ordre
---

Lance Spoti-Free en local, dans cet ordre :

1. Ouvre MAMP : `open -a MAMP`. MAMP ne démarre PAS Apache/MySQL tout seul — si le
   backend crashe avec `ECONNREFUSED` sur le port 8889, demande-moi de cliquer
   "Start Servers" dans la fenêtre MAMP (impossible à faire depuis le terminal).
2. Lance le backend en arrière-plan depuis `backend/` : `npm run dev`.
3. Lance le frontend en arrière-plan depuis `frontend/` : `npm run dev`.
4. Confirme les URLs : backend sur http://localhost:3000, frontend sur http://localhost:5173.
5. Ouvre le front dans Chrome : `open -a "Google Chrome" http://localhost:5173`.
6. Rappelle-moi où on s'était arrêté à la dernière session : lis la section
   `## EN SUSPENS` (la première) de `SUIVI-PROJET.md` à la racine et restitue-la,
   en distinguant ce qui attend une décision de ma part de ce qui attend du travail.

Si le backend a déjà crashé faute de MySQL et que MAMP vient d'être démarré, un
`touch backend/server.js` suffit à déclencher le redémarrage de nodemon (pas besoin
de retuer/relancer le process).