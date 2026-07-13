import express from "express";
import cors from "cors";
import musicRoutes from "./src/routes/musicRoute.js";
import userRoutes from "./src/routes/userRoute.js";
import playlistRoute from "./src/routes/playlistRoute.js";
import contactRoute from "./src/routes/contactRoute.js";

const app = express();

app.use(cors());
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
app.use("/api/playlists",playlistRoute);
app.use("/api/contact", contactRoute );

app.listen(process.env.PORT, () => {
    console.log("Serveur démarré !");
});