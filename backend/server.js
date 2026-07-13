import express from "express";
import cors from "cors";
import musicRoutes from "./src/routes/musicRoute.js";
import userRoutes from "./src/routes/userRoute.js";
import playlistRoute from "./src/routes/playlistRoute.js";
import contactRoute from "./src/routes/contactRoute.js";

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

app.listen(process.env.PORT, () => {
  console.log("Serveur démarré !");
});
