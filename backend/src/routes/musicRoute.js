import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
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
// Top 5 des titres les plus ecoutes.
// Doit rester DEVANT `/info/:id` : Express teste les routes dans l'ordre de declaration,
// et `/info/:id` ne capterait pas "/top" — mais si un jour une route `/:id` est ajoutee au
// meme niveau, elle avalerait "/top" en le prenant pour un identifiant.
router.get("/top", async (req, res) => {
  try {
    const [top] = await db.query(
      "SELECT * FROM musics ORDER BY play_count DESC, title ASC LIMIT 5",
    );
    return res.status(200).json(top);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la récupération du top 5.",
    });
  }
});

// Enregistre une ecoute (incremente le compteur qui alimente le Top 5).
// Volontairement publique : un visiteur non connecte peut ecouter, et son ecoute compte.
router.post("/ecoute/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [resultat] = await db.query(
      "UPDATE musics SET play_count = play_count + 1 WHERE id_music = ?",
      [id],
    );

    if (resultat.affectedRows === 0) {
      return res.status(404).json({
        message: "La musique est introuvable.",
      });
    }

    return res.status(200).json({
      message: "Écoute enregistrée.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de l'enregistrement de l'écoute.",
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
// Modifier une musique — ADMIN UNIQUEMENT (gestion du catalogue)
//
// Seules les METADONNEES sont modifiables : titre, artiste, genre.
//
// Les chemins des fichiers (`src_audio`, `src_image`) et la duree ne sont PAS acceptes depuis
// le client, pour deux raisons :
//
// 1. Robustesse — l'ancienne version faisait un UPDATE de toutes les colonnes d'un coup. Un
//    formulaire qui n'envoie que le titre mettait donc `src_audio` et `src_image` a NULL : le
//    morceau devenait injouable et sa pochette cassee, sans que rien ne le signale.
//
// 2. Securite — un chemin de fichier venant du client est une valeur qu'on ne controle pas.
//    Rien n'empecherait d'y ecrire `../../.env` et de le faire servir par express.static.
//    La duree, elle, est extraite du fichier reel : une valeur envoyee par le client pourrait
//    simplement mentir.
router.put("/update/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const title = req.body.title?.trim();
    const artist = req.body.artist?.trim();
    const genre = req.body.genre?.trim() || null;

    if (!title || !artist) {
      return res.status(400).json({
        message: "Le titre et l'artiste sont obligatoires.",
      });
    }

    const [musics] = await db.query(
      "UPDATE `musics` SET `title` = ?, `artist` = ?, `genre` = ? WHERE id_music = ?",
      [title, artist, genre, id],
    );

    if (musics.affectedRows === 0) {
      return res.status(404).json({
        message: "La musique est introuvable.",
      });
    }

    return res.status(200).json({
      message: `« ${title} » a bien été modifiée.`,
    });
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

      const [[musique]] = await db.query(
        "SELECT title, src_audio, src_image FROM musics WHERE id_music = ?",
        [id],
      );

      if (!musique) {
        return res.status(404).json({
          message: "La musique est introuvable.",
        });
      }

      await db.query("DELETE FROM musics WHERE id_music = ?", [id]);

      // ---------------------------------------------------------------------
      // Nettoyage des fichiers — LE piege de cette route.
      //
      // Un meme fichier peut etre partage par PLUSIEURS morceaux : c'est deja le cas des
      // pochettes du catalogue (une seule image sert a quatre titres), et le depot de musique
      // attribue justement une pochette existante, tiree au hasard, quand l'utilisateur n'en
      // fournit pas.
      //
      // Supprimer aveuglement le fichier d'un morceau casserait donc l'affichage des autres.
      // (Ce n'est pas theorique : un script de nettoyage a reellement efface `images/3.jpg`,
      // utilisee par quatre titres.)
      //
      // On ne supprime donc un fichier que s'il n'est plus reference par AUCUN morceau. Sinon,
      // on le laisse : mieux vaut un fichier inutile sur le disque qu'une image cassee.
      // ---------------------------------------------------------------------
      for (const relatif of [musique.src_audio, musique.src_image]) {
        if (!relatif) continue;

        const [[{ nb }]] = await db.query(
          "SELECT COUNT(*) AS nb FROM musics WHERE src_audio = ? OR src_image = ?",
          [relatif, relatif],
        );

        if (nb > 0) continue; // encore utilise par un autre morceau : on n'y touche pas

        try {
          await fs.unlink(path.join(process.cwd(), "public", relatif));
        } catch (error) {
          // Fichier deja absent : ce n'est pas une raison de faire echouer la suppression.
          if (error.code !== "ENOENT") console.error(error);
        }
      }

      return res.status(200).json({
        message: `« ${musique.title} » a bien été supprimée.`,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erreur lors de la suppression de la musique.",
      });
    }
  },
);

export default router;
