import express from "express";
import db from "../../db.js";
const router = express.Router();

//affiche tous les utilisateur
router.get("/", async (req, res) => {
  const [users] = await db.query(
    "SELECT `pseudo`,`first_name`,`last_name`,`email`,`created_at` FROM users",
  );
  res.json(users);
});
//affiche les musiques likés d'un utilisateur
router.get("/likes/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [likes] = await db.query(
      "SELECT `title`,`artist`,`genre`,`src_image`,`src_audio`,`duration` FROM `musics` INNER JOIN `likes` ON (musics.id_music=likes.id_music) WHERE id_user = ?",
      [id],
    );
    if (likes.length === 0) {
      return res.status(404).json({
        message: "Aucune musique Likées.",
      });
    } else {
      return res.status(200).json(likes);
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la recherche des musiques likées.",
    });
  }
});

// retirer une musique liké
router.delete("/unlikes/:idUser/:idMusic", async (req, res) => {
  try {
    const idUser = req.params.idUser;
    const idMusic = req.params.idMusic;
    const [unlikeMusique] = await db.query(
      "DELETE FROM `likes` WHERE id_user = ? AND id_music = ?",
      [idUser, idMusic],
    );
    if (unlikeMusique.affectedRows === 0) {
      return res.status(404).json({
        message: "La musique n'est actuellement pas likées.",
      });
    } else {
      return res.status(200).json({
        message: "La musique likées à bien été retirée des favoris.",
      });
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la recherche des musiques likées.",
    });
  }
});

export default router;
