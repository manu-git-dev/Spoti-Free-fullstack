// Garde-fou de configuration : DOIT rester le tout premier import. Il vérifie les variables
// d'environnement et refuse de démarrer si une variable critique manque — avant que db.js
// (tiré par les routes) ne tente sa connexion. Voir src/verifierEnv.js.
import "./src/verifierEnv.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import musicRoutes from "./src/routes/musicRoute.js";
import userRoutes from "./src/routes/userRoute.js";
import playlistRoute from "./src/routes/playlistRoute.js";
import contactRoute from "./src/routes/contactRoute.js";
import submissionRoute from "./src/routes/submissionRoute.js";
import adminRoute from "./src/routes/adminRoute.js";

const app = express();

// En production, l'app tourne derriere un reverse proxy (Nginx, hebergeur...). Sans ceci,
// Express voit l'IP du PROXY sur toutes les requetes : express-rate-limit croirait que tout
// le trafic vient d'un seul visiteur et bloquerait tout le monde d'un coup. Avec `trust proxy`,
// Express lit la vraie IP du client dans l'en-tete `X-Forwarded-For`.
// Le `1` = "un seul proxy devant nous" (ne jamais mettre `true` : n'importe qui pourrait alors
// usurper une IP en envoyant lui-meme cet en-tete, et contourner les limites).
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// helmet pose une serie d'en-tetes HTTP de securite (X-Content-Type-Options: nosniff,
// X-Frame-Options, Strict-Transport-Security, etc.). A placer TOT, avant les routes, pour que
// tout ce qui sort du serveur les porte.
//
// LE piege : par defaut helmet pose `Cross-Origin-Resource-Policy: same-origin`. Or le front
// (`FRONTEND_URL`, autre origine) charge l'audio et les pochettes servis ici par
// `express.static("public")`. Avec le defaut, le navigateur BLOQUERAIT ces medias cross-origin.
// On passe donc explicitement la politique a `cross-origin` : les fichiers du catalogue sont
// publics par nature, ils sont faits pour etre charges depuis le front.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS : `cors()` sans option autorise TOUTES les origines — n'importe quel site pourrait
// appeler cette API depuis le navigateur de ses visiteurs. On restreint a l'origine du
// frontend (`FRONTEND_URL`), en gardant localhost pour le developpement.
const originesAutorisees = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: originesAutorisees,
    credentials: true,
  }),
);

app.use(express.json());

// express.json() ne renseigne `req.body` que si la requete porte bien un
// Content-Type: application/json. Sans ce garde-fou, une requete POST/PUT envoyee sans ce
// header laisse `req.body` a undefined : le premier `req.body.champ` leve alors une
// TypeError, et la route repond 500 au lieu du 400 attendu. On garantit donc un objet.
app.use((req, res, next) => {
  if (!req.body) {
    req.body = {};
  }
  next();
});

app.use(express.static("public"));

app.use("/api/musics", musicRoutes); // route défini pour musics
app.use("/api/users", userRoutes);
app.use("/api/playlists", playlistRoute);
app.use("/api/contact", contactRoute);
app.use("/api/submissions", submissionRoute);
app.use("/api/admin", adminRoute);

// 404 : aucune route ne correspond. Sans ceci, Express renvoie une page HTML par defaut,
// alors que tous les clients de cette API attendent du JSON.
app.use((req, res) => {
  return res.status(404).json({
    message: "Route introuvable.",
  });
});

// Filet de securite : toute exception non rattrapee par un `try/catch` de route arrive ici.
// Sans ce middleware, Express renvoie la stack trace au client — ce qui divulgue les chemins
// de fichiers et la structure interne du serveur. On log en detail cote serveur, et on ne
// renvoie qu'un message generique.
// Les 4 parametres (dont `next`) sont obligatoires : c'est a cette signature qu'Express
// reconnait un middleware d'erreur.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Erreur non gérée :", err);

  return res.status(500).json({
    message: "Une erreur inattendue est survenue.",
  });
});

// On écoute la BOUCLE LOCALE uniquement, pas toutes les interfaces (le défaut de Node).
//
// POURQUOI ce n'est pas cosmétique. En production, `NODE_ENV=production` active `trust proxy` :
// Express cesse de lire l'IP de la connexion et prend celle annoncée dans l'en-tête
// `X-Forwarded-For`. C'est INDISPENSABLE derrière nginx — sans ça, tout le trafic paraîtrait
// venir du proxy et `express-rate-limit` bloquerait tous les visiteurs d'un coup.
//
// Mais `trust proxy` repose sur une hypothèse : que nginx soit le SEUL chemin d'accès. Si le
// port reste ouvert sur l'extérieur, n'importe qui l'atteint directement et écrit lui-même
// `X-Forwarded-For` — une IP différente à chaque requête, donc un compteur qui ne monte jamais.
// La limite de tentatives sur /api/users/connexion, l'anti-spam du contact et la limite sur
// /ecoute deviennent alors décoratifs. Vérifié en vrai le 2026-07-21 : `curl` depuis une autre
// machine sur http://<ip>:3000/api/musics répondait 200, en-tête forgé compris.
//
// Écouter 127.0.0.1 rend la chose impossible par construction : le socket n'existe pas hors de
// la machine. nginx, lui, parle en local (`proxy_pass http://127.0.0.1:3000`) et n'est pas gêné.
// Le pare-feu (ufw) reste une seconde barrière : celle-ci ferme CETTE porte, lui ferme aussi
// celles qu'on ouvrirait par erreur.
//
// HOST reste surchargeable : un déploiement en conteneur devra écouter 0.0.0.0, puisque
// l'isolation y est assurée par le réseau Docker et non par l'interface d'écoute.
const HOST = process.env.HOST ?? "127.0.0.1";

app.listen(process.env.PORT, HOST, () => {
  console.log(`Serveur démarré sur ${HOST}:${process.env.PORT}`);
});
