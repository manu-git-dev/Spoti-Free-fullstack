import express from "express";
import cors from "cors";
import musicRoutes from "./src/routes/musicRoute.js";
import userRoutes from "./src/routes/userRoute.js";
import playlistRoute from "./src/routes/playlistRoute.js"

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api/musics", musicRoutes); // route défini pour musics
app.use("/api/users", userRoutes);
app.use("/api/playlists",playlistRoute);

app.listen(process.env.PORT, () => {
    console.log("Serveur démarré !");
});