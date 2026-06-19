import express from "express";
import cors from "cors";
import musicRoutes from "./src/routes/musicRoute.js";
import userRoutes from "./src/routes/userRoute.js"

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/musics", musicRoutes); // route défini pour musics
app.use("/api/users", userRoutes);

app.listen(process.env.PORT, () => {
    console.log("Serveur démarré !");
});