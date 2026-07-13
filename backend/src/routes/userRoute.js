import express from "express";
import db from "../../db.js";
import bcrypt from "bcryptjs";
const router = express.Router();
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import { limitesDesactivees } from "../config.js";

// Anti brute-force : sans cette limite, un script peut tester des milliers de mots de passe
// a la seconde sur /connexion. bcrypt ralentit chaque tentative, mais ne les empeche pas.
// 10 tentatives par IP toutes les 15 minutes ; seuls les ECHECS sont comptes, donc un
// utilisateur qui se connecte normalement n'est jamais bloque.
const limiteConnexion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  skip: () => limitesDesactivees,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Trop de tentatives de connexion. Réessaye dans une quinzaine de minutes.",
  },
});

// Limite plus large sur l'inscription : evite la creation massive de comptes en boucle.
const limiteInscription = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  skip: () => limitesDesactivees,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Trop de comptes créés depuis cette adresse. Réessaye plus tard.",
  },
});

//affiche les infos du profil
router.get("/profil", authMiddleware, async (req, res) => {
  try {
    const idUser = req.user.id_user;
    const [infoProfil] = await db.query(
      "SELECT `pseudo`,`first_name`,`last_name`,`email`,`created_at` FROM users WHERE id_user = ?",
      [idUser],
    );
    const userInfo = infoProfil[0];
    return res.json(userInfo);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors du suivi du profil.",
    });
  }
});

//affiche tous les utilisateurs — ADMIN UNIQUEMENT
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT `id_user`,`pseudo`,`first_name`,`last_name`,`email`,`role`,`created_at` FROM users",
    );
    return res.status(200).json(users);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs.",
    });
  }
});
//affiche les musiques likés d'un utilisateur ROUTE SECURISÉE
router.get("/likes", authMiddleware, async (req, res) => {
  try {
    const idUser = req.user.id_user;
    const [likes] = await db.query(
      "SELECT * FROM `musics` INNER JOIN `likes` ON (musics.id_music=likes.id_music) WHERE id_user = ?",
      [idUser],
    );
    // Une liste vide n'est pas une erreur : on renvoie 200 avec un tableau vide,
    // pas un 404 (qui signifierait que la ressource /likes n'existe pas).
    return res.status(200).json(likes);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la recherche des musiques likées.",
    });
  }
});
// Ajouter une musique au like ROUTE SECURISÉE
router.post("/like/:idMusic", authMiddleware, async (req, res) => {
  try {
    const idUser = req.user.id_user;
    const idMusic = req.params.idMusic;
    const [testSaisie2] = await db.query(
      "SELECT `id_music` FROM `musics` WHERE id_music = ?",
      [idMusic],
    );
    if (testSaisie2.length === 0) {
      return res.status(404).json({
        message: "La musique est introuvable",
      });
    }

    // Deja likee ? La table `likes` a une cle primaire (id_user, id_music) : sans ce test,
    // l'INSERT violerait la contrainte et remonterait un 500 (= "erreur serveur"), alors
    // que c'est une demande en conflit avec l'etat actuel -> 409.
    const [dejaLike] = await db.query(
      "SELECT * FROM `likes` WHERE id_user = ? AND id_music = ?",
      [idUser, idMusic],
    );
    if (dejaLike.length > 0) {
      return res.status(409).json({
        message: "Cette musique est déjà dans vos favoris.",
      });
    }

    await db.query(
      "INSERT INTO `likes` (`id_user`, `id_music`) VALUES (?, ?)",
      [idUser, idMusic],
    );
    return res.status(201).json({
      message: "Musique ajoutée aux likes avec succès.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de l'ajout du like.",
    });
  }
});

// retirer une musique liké
router.delete("/unlikes/:idMusic", authMiddleware, async (req, res) => {
  try {
    const idUser = req.user.id_user;
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
router.post("/inscription", limiteInscription, async (req, res) => {
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

    // Ces deux controles doivent vivre ICI, cote serveur : le `type="email"` du formulaire
    // et la verification du mot de passe cote React ne protegent que le navigateur, et se
    // contournent en appelant l'API directement.
    const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValide) {
      return res.status(400).json({
        message: "L'adresse email n'est pas valide.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 8 caractères.",
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
router.post("/connexion", limiteConnexion, async (req, res) => {
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
        message: "Identifiants incorrect",
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
          { expiresIn: "24h" },
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

export default router;
