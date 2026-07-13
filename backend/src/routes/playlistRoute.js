import express from "express";
import db from "../../db.js";
import authMiddleware from "../middlewares/authMiddleware.js";
const router = express.Router();

// affiche les playlist d'un utilisateur ROUTE SECURISÉE
router.get("/", authMiddleware, async (req, res) => {
  try {
    const idUser = req.user.id_user;
    const [playlists] = await db.query(
      "SELECT `id_playlist`,`name` FROM `playlists` WHERE id_user = ?",
      [idUser],
    );
    // Liste vide = resultat valide, pas une erreur -> 200 [] et non 404.
    return res.status(200).json(playlists);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la recherche des playlists.",
    });
  }
});

// affiche les musiques d'une playlist d'un utilisateur ROUTE SECURISÉE
router.get("/musics/:idPlaylist", authMiddleware, async (req, res) => {
  try {
    const idUser = req.user.id_user;
    const idPlaylist = req.params.idPlaylist;
    // `duration` etait absente de ce SELECT (contrairement a GET /api/musics), d'ou des
    // durees affichees "--:--" dans le contenu d'une playlist.
    const [musicFromPlaylist] = await db.query(
      "SELECT `title`,`artist`,`genre`,`src_image`,`src_audio`,`duration`,musics.id_music,`name` FROM `musics` INNER JOIN `playlists_musics` ON musics.id_music=playlists_musics.id_music INNER JOIN `playlists` ON playlists.id_playlist=playlists_musics.id_playlist WHERE playlists_musics.id_playlist = ? AND playlists.id_user = ?",
      [idPlaylist, idUser],
    );
    // Playlist vide = resultat valide, pas une erreur -> 200 [] et non 404.
    return res.status(200).json(musicFromPlaylist);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la recherche des musiques likées.",
    });
  }
});

// modifier le nom d'une playlist utilisateur ROUTE SECURISÉE
router.put("/renommer/:idPlaylist", authMiddleware, async (req, res) => {
  try {
    const idUser = req.user.id_user;
    const idPlaylist = req.params.idPlaylist;
    const name = req.body.name;
    if (!name) {
      // 400 Bad Request : la requete du client est malformee (pas un "introuvable").
      return res.status(400).json({
        message: "Le nom de la playlist ne peut pas être vide.",
      });
    }
    const [playlists] = await db.query(
      "UPDATE `playlists` SET `name` = ? WHERE id_user = ? AND id_playlist = ?",
      [name, idUser, idPlaylist],
    );
    if (playlists.affectedRows === 0) {
      return res.status(404).json({
        message: "Aucune playlist.",
      });
    } else {
      return res.status(200).json({
        message: "Votre playlist à bien été renommée.",
      });
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la modification du nom de la playlist.",
    });
  }
});

// ajouter une musique à une playlist ROUTE SECURISÉE
router.post(
  "/ajouter/:idPlaylist/:idMusic",
  authMiddleware,
  async (req, res) => {
    try {
      const idUser = req.user.id_user;
      const idPlaylist = req.params.idPlaylist;
      const idMusic = req.params.idMusic;
      const [testSaisie1] = await db.query(
        "SELECT `id_playlist` FROM `playlists` WHERE id_playlist = ? AND id_user = ?",
        [idPlaylist, idUser],
      );
      const [testSaisie2] = await db.query(
        "SELECT `id_music` FROM `musics` WHERE id_music = ?",
        [idMusic],
      );

      const [testSaisie3] = await db.query(
        "SELECT * FROM `playlists_musics` WHERE id_playlist = ? AND id_music = ?",
        [idPlaylist, idMusic],
      );
      if (testSaisie1.length === 0) {
        return res.status(404).json({
          message: "La playlist est introuvable",
        });
      } else if (testSaisie2.length === 0) {
        return res.status(404).json({
          message: "La musique est introuvable",
        });
      } else if (testSaisie3.length > 0) {
        // 409 Conflict : la ressource existe deja (ce n'est pas un "introuvable").
        return res.status(409).json({
          message: "La musique est déjà dans la playlist",
        });
      } else {
        const [insertMusic] = await db.query(
          "INSERT INTO `playlists_musics` (`id_playlist`, `id_music`) VALUES (?, ?)",
          [idPlaylist, idMusic],
        );
        return res.status(201).json({
          message: "Musique ajoutée à la playlist avec succès.",
        });
      }
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erreur lors de l'ajout de la musique dans la playlist.",
      });
    }
  },
);
// retirer une musique d'une playlist ROUTE SECURISÉE
router.delete(
  "/retirer/:idPlaylist/:idMusic",
  authMiddleware,
  async (req, res) => {
    try {
      const idUser = req.user.id_user;
      const idPlaylist = req.params.idPlaylist;
      const idMusic = req.params.idMusic;
      const [checkUser] = await db.query(
        "SELECT * FROM `playlists` WHERE id_playlist = ? AND id_user = ?",
        [idPlaylist, idUser],
      );
      if (checkUser.length === 0) {
        return res.status(404).json({
          message: "La playlist est introuvable.",
        });
      } else {
        const [playlist] = await db.query(
          "DELETE FROM playlists_musics WHERE id_playlist = ? AND id_music = ?",
          [idPlaylist, idMusic],
        );
        if (playlist.affectedRows === 0) {
          return res.status(404).json({
            message: "Cette musique n'est pas dans la playlist.",
          });
        } else {
          return res.status(200).json({
            message: "La musique à bien été retirée de la playlist.",
          });
        }
      }
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erreur lors du retrair de la musique.",
      });
    }
  },
);
// supprimer une playlist ROUTE SECURISÉE
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const idUser = req.user.id_user;
    const id = req.params.id;
    const [playlist] = await db.query(
      "DELETE FROM playlists WHERE id_playlist = ? AND id_user = ?",
      [id, idUser],
    );
    if (playlist.affectedRows === 0) {
      return res.status(404).json({
        message: "La playlist est introuvable.",
      });
    } else {
      return res.status(200).json({
        message: "La playlist à bien été supprimée.",
      });
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la suppression de la musique.",
    });
  }
});

// ajouter une playlist ROUTE SECURISÉE
router.post("/ajouter", authMiddleware, async (req, res) => {
  try {
    const idUser = req.user.id_user;
    const nomPlaylist = req.body.nom?.trim();

    // Sans ce test, un nom vide creait une playlist sans nom.
    if (!nomPlaylist) {
      return res.status(400).json({
        message: "Le nom de la playlist ne peut pas être vide.",
      });
    }

    const [insertMusic] = await db.query(
      "INSERT INTO `playlists` (`id_playlist`, `name`, `id_user`) VALUES (NULL, ?, ?)",
      [nomPlaylist, idUser],
    );
    return res.status(201).json({
      id_playlist: insertMusic.insertId,
      name: nomPlaylist,
      message: "Playlist ajoutée avec succès.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la création la playlist.",
    });
  }
});

export default router;
