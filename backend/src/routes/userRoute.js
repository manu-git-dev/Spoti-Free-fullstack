import express from "express";
import db from "../../db.js";
import bcrypt from "bcryptjs";
import nodemon from "nodemon";
const router = express.Router();
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/authMiddleware.js";

//affiche tous les utilisateur
router.get("/", async (req, res) => {
  const [users] = await db.query(
    "SELECT `pseudo`,`first_name`,`last_name`,`email`,`created_at` FROM users",
  );
  res.json(users);
});
//affiche les musiques likés d'un utilisateur ROUTE SECURISÉE
router.get("/likes",authMiddleware, async (req, res) => {
  try {
    const id = req.user.id_user;
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
// Ajouter une musique au like
router.post("/like/:idUser/:idMusic", async (req, res) => {
  try {
    const idUser = req.params.idUser;
    const idMusic = req.params.idMusic;
    const [testSaisie1] = await db.query(
      "SELECT `id_user` FROM `users` WHERE id_user = ?",
      [idUser],
    );
    const [testSaisie2] = await db.query(
      "SELECT `id_music` FROM `musics` WHERE id_music = ?",
      [idMusic],
    );
    if (testSaisie1.length === 0) {
      return res.status(404).json({
        message: "L'utilisateur'est introuvable",
      });
    } else if (testSaisie2.length === 0) {
      return res.status(404).json({
        message: "La musique est introuvable",
      });
    } else {
      const [insertMusicLike] = await db.query(
        "INSERT INTO `likes` (`id_user`, `id_music`) VALUES (?, ?)",
        [idUser, idMusic],
      );
      return res.status(201).json({
        message: "Musique ajoutée aux likes avec succès.",
      });
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de l'ajout de la musique dans la playlist.",
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
// inscription
router.post("/inscription", async (req, res) => {
  try {
    const pseudo = req.body.pseudo;
    const prenom = req.body.prenom;
    const nom = req.body.nom;
    const email = req.body.email;
    const password = req.body.password;

    // Validation des données
    if (!pseudo || !prenom || !nom || !email || !password) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires.",
      });
    }
    const [uniqueEmail] = await db.query(
      "SELECT * FROM `users` WHERE email = ?",
      [email],
    );
    if (uniqueEmail.length > 0) {
      return res.status(400).json({
        message: "L'email est déjà utilisée.",
      });
    } else {
      const hashPassword = await bcrypt.hash(password, 10);
      await db.query(
        "INSERT INTO `users` (`id_user`, `pseudo`, `first_name`, `last_name`, `email`, `password_hash`, `created_at`) VALUES (NULL, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
        [pseudo, prenom, nom, email, hashPassword],
      );
      return res.status(201).json({
        message: "Compte crée avec succées.",
      });
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de l'inscription.",
    });
  }
});

//Connexion
router.post("/connexion", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    // Validation des données
    if (!email || !password) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires.",
      });
    }
    const [uniqueEmail] = await db.query(
      "SELECT * FROM `users` WHERE email = ?",
      [email],
    );
    if (uniqueEmail.length === 0) {
      return res.status(400).json({
        message: "Identifiant incorrect",
      });
    } else {
      const user = uniqueEmail[0];
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (isPasswordValid === true) {
        const token = jwt.sign(
          { id_user: user.id_user, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: "2h" },
        );
        return res.status(200).json({
          message: "Connexion réussie.",
          token: token,
          user: {
            id_user: user.id_user,
            email: user.email,
            pseudo: user.pseudo,
          },
        });
      } else {
        return res.status(400).json({
          message: "Identifiant incorrect.",
        });
      }
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la connexion.",
    });
  }
});

    // "message": "Connexion réussie.",
    // "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c2VyIjo0LCJlbWFpbCI6InRlc3RAYWpvdXQuZnIiLCJpYXQiOjE3ODIwMzE0MzQsImV4cCI6MTc4MjAzODYzNH0.YIJ-PePlXbmxdcZk5_KTwRRKFzLsrXL3uwBKoi-yCdM",
    // "user": {
    //     "id_user": 4,
    //     "email": "test@ajout.fr",
    //     "pseudo": "test-ajout"

export default router;
