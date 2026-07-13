import express from "express";
import db from "../../db.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();
//http://localhost:3000/api/musics
//affiche toutes les musiques
router.get("/", async (req, res) => {
  try {
    const [musics] = await db.query("SELECT * FROM musics");
    return res.status(200).json(musics);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur serveur de l'affichage des musiques",
    });
  }
});
// Ajouter une musique — ADMIN UNIQUEMENT (gestion du catalogue)
router.post("/ajouter", authMiddleware, adminMiddleware, async (req, res) => {
  const title = req.body.title;
  const artist = req.body.artist;
  const genre = req.body.genre;
  const srcImage = req.body.srcImage;
  const srcAudio = req.body.srcAudio;
  const duration = req.body.duration;

  // Validation des données
  if (!title || !artist || !srcImage || !srcAudio) {
    return res.status(400).json({
      message: "Tous les champs sont obligatoires.",
    });
  }

  try {
    await db.query(
      "INSERT INTO musics (id_music, title, artist, genre, src_image, src_audio, duration) VALUES (NULL, ?, ?, ?, ?, ?, ?)",
      [title, artist, genre, srcImage, srcAudio, duration],
    );

    return res.status(201).json({
      message: "Musique ajoutée avec succès.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de l'ajout de la musique.",
    });
  }
});
// Affiche une musique
router.get("/info/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [musics] = await db.query("SELECT * FROM musics WHERE id_music = ?", [
      id,
    ]);
    if (musics.length === 0) {
      return res.status(404).json({
        message: "Aucune musique trouvée.",
      });
    } else {
      return res.status(200).json(musics);
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la recherche des infos de la musique.",
    });
  }
});
// Update une musique — ADMIN UNIQUEMENT (gestion du catalogue)
router.put("/update/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const title = req.body.title;
    const artist = req.body.artist;
    const genre = req.body.genre;
    const srcImage = req.body.srcImage;
    const srcAudio = req.body.srcAudio;
    const duration = req.body.duration;
    const [musics] = await db.query(
      "UPDATE `musics` SET `title` = ?, `artist` = ?, `genre` = ?, `src_image` = ?, `src_audio` = ?,`duration` = ? WHERE id_music = ?",
      [title, artist, genre, srcImage, srcAudio, duration, id],
    );
    if (musics.affectedRows === 0) { // si l'id corresponds a aucune musique
      return res.status(404).json({
        message: "La musique est introuvable.",
      });
    } else {
      return res.status(200).json({
        message: "la musique à bien été modifiée",
      });
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la modification de la musique.",
    });
  }
});
// Supprimer une musique — ADMIN UNIQUEMENT (gestion du catalogue)
router.delete(
  "/delete/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const id = req.params.id;
      const [musics] = await db.query("DELETE FROM musics WHERE id_music = ?", [
        id,
      ]);
      if (musics.affectedRows === 0) {
        return res.status(404).json({
          message: "La musique est introuvable.",
        });
      } else {
        return res.status(200).json({
          message: "la musique à bien été supprimée.",
        });
      }
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erreur lors de la suppression de la musique.",
      });
    }
  },
);

export default router;
