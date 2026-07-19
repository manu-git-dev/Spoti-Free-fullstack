import express from "express";
import crypto from "node:crypto";

import db from "../../db.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import { nettoyerDepotsEnAttente } from "../depots.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// POST /api/admin/visite — enregistrer une page vue
//
// PUBLIQUE : c'est le but, on compte aussi les visiteurs non connectes.
// C'est le FRONT qui appelle cette route a chaque changement de route (voir App.jsx) : cote
// serveur on ne verrait que des appels API, et une seule page en declenche plusieurs.
// ---------------------------------------------------------------------------
router.post("/visite", async (req, res) => {
  try {
    const chemin = String(req.body.chemin ?? "/").slice(0, 255);

    // L'IP est une donnee personnelle : on ne la stocke jamais en clair.
    //
    // Le SEL est indispensable. Sans lui, un hash d'IP ne protege rien : il n'existe que
    // ~4 milliards d'adresses IPv4, on peut donc toutes les hacher et retrouver l'originale
    // en quelques secondes. Avec un sel secret, cette attaque devient impossible.
    const ip = req.ip ?? "inconnue";
    const ipHash = crypto
      .createHash("sha256")
      .update(ip + (process.env.IP_HASH_SALT ?? ""))
      .digest("hex");

    await db.query(
      "INSERT INTO visites (jour, ip_hash, chemin) VALUES (CURDATE(), ?, ?)",
      [ipHash, chemin],
    );

    // 204 : c'est un signal, il n'y a rien a renvoyer. Le front n'attend d'ailleurs pas la
    // reponse — un echec de comptage ne doit jamais gener la navigation.
    return res.status(204).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors du comptage." });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/stats — les chiffres du tableau de bord
// ---------------------------------------------------------------------------
router.get("/stats", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Les requetes sont independantes : on les lance en parallele plutot qu'en file d'attente.
    const [
      [[utilisateurs]],
      [[musiques]],
      [[playlists]],
      [[likes]],
      [[ecoutes]],
      [[depots]],
      [[frequentation]],
      [inscriptionsParJour],
      [visitesParJour],
      [topEcoutes],
      [topLikes],
      [pagesVues],
      [repartitionDepots],
    ] = await Promise.all([
      db.query("SELECT COUNT(*) AS total FROM users"),
      db.query("SELECT COUNT(*) AS total FROM musics"),
      db.query("SELECT COUNT(*) AS total FROM playlists"),
      db.query("SELECT COUNT(*) AS total FROM likes"),
      db.query("SELECT COALESCE(SUM(play_count), 0) AS total FROM musics"),
      db.query(
        "SELECT COUNT(*) AS total FROM submissions WHERE statut = 'en_attente'",
      ),

      // Frequentation des 30 derniers jours.
      db.query(
        `SELECT COUNT(*) AS pages_vues,
                COUNT(DISTINCT ip_hash) AS visiteurs
           FROM visites
          WHERE jour >= CURDATE() - INTERVAL 30 DAY`,
      ),

      // Series temporelles (30 jours) : inscriptions et frequentation.
      db.query(
        `SELECT DATE(created_at) AS jour, COUNT(*) AS nombre
           FROM users
          WHERE created_at >= CURDATE() - INTERVAL 30 DAY
          GROUP BY DATE(created_at)
          ORDER BY jour`,
      ),
      db.query(
        `SELECT jour,
                COUNT(*) AS pages_vues,
                COUNT(DISTINCT ip_hash) AS visiteurs
           FROM visites
          WHERE jour >= CURDATE() - INTERVAL 30 DAY
          GROUP BY jour
          ORDER BY jour`,
      ),

      // Classements.
      db.query(
        `SELECT title, artist, play_count
           FROM musics
          ORDER BY play_count DESC, title ASC
          LIMIT 5`,
      ),
      db.query(
        `SELECT m.title, m.artist, COUNT(l.id_music) AS nombre
           FROM musics m
           JOIN likes l ON l.id_music = m.id_music
          GROUP BY m.id_music, m.title, m.artist
          ORDER BY nombre DESC, m.title ASC
          LIMIT 5`,
      ),
      db.query(
        `SELECT chemin, COUNT(*) AS nombre
           FROM visites
          WHERE jour >= CURDATE() - INTERVAL 30 DAY
          GROUP BY chemin
          ORDER BY nombre DESC
          LIMIT 6`,
      ),
      db.query(
        `SELECT statut, COUNT(*) AS nombre
           FROM submissions
          GROUP BY statut`,
      ),
    ]);

    return res.status(200).json({
      totaux: {
        utilisateurs: utilisateurs.total,
        musiques: musiques.total,
        playlists: playlists.total,
        likes: likes.total,
        ecoutes: Number(ecoutes.total),
        depotsEnAttente: depots.total,
        visiteurs30j: frequentation.visiteurs,
        pagesVues30j: frequentation.pages_vues,
      },
      inscriptionsParJour,
      visitesParJour,
      topEcoutes,
      topLikes,
      pagesVues,
      repartitionDepots,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors du calcul des statistiques.",
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/utilisateurs — la liste, avec ce que chacun a produit
// ---------------------------------------------------------------------------
router.get("/utilisateurs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Le mot de passe (meme hache) n'a AUCUNE raison de sortir d'ici : on ne selectionne que
    // ce dont l'interface a besoin.
    const [utilisateurs] = await db.query(
      `SELECT u.id_user, u.pseudo, u.first_name, u.last_name, u.email, u.role, u.created_at,
              (SELECT COUNT(*) FROM playlists p WHERE p.id_user = u.id_user)   AS nb_playlists,
              (SELECT COUNT(*) FROM likes l WHERE l.id_user = u.id_user)       AS nb_likes,
              (SELECT COUNT(*) FROM submissions s WHERE s.id_user = u.id_user) AS nb_depots
         FROM users u
        ORDER BY u.created_at DESC`,
    );

    return res.status(200).json(utilisateurs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs.",
    });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/utilisateurs/:id/role — promouvoir / retrograder
//
// Volontairement, il n'existe PAS de route pour modifier le pseudo, le nom ou l'email de
// quelqu'un. L'email est l'identifiant de connexion : un admin capable de le changer pourrait
// se l'attribuer et se connecter a la place de la personne. C'est une escalade de privileges,
// sans aucun besoin legitime derriere. Un admin a les droits que son role EXIGE, pas tous ceux
// qui sont techniquement possibles.
// ---------------------------------------------------------------------------
router.patch(
  "/utilisateurs/:id/role",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const idCible = Number(req.params.id);
      const role = req.body.role;

      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({
          message: "Rôle invalide (attendu : 'user' ou 'admin').",
        });
      }

      const [[cible]] = await db.query(
        "SELECT id_user, pseudo, role FROM users WHERE id_user = ?",
        [idCible],
      );

      if (!cible) {
        return res.status(404).json({ message: "Utilisateur introuvable." });
      }

      // Garde-fou : ne pas se retirer ses propres droits par megarde (on se retrouverait
      // enferme dehors).
      if (idCible === req.user.id_user && role !== "admin") {
        return res.status(409).json({
          message: "Tu ne peux pas retirer ton propre rôle d'administrateur.",
        });
      }

      // Garde-fou : toujours au moins un admin, sinon plus personne ne peut administrer le
      // site — et il n'y a aucun moyen de se re-promouvoir depuis l'interface.
      if (cible.role === "admin" && role === "user") {
        const [[{ nb }]] = await db.query(
          "SELECT COUNT(*) AS nb FROM users WHERE role = 'admin'",
        );
        if (nb <= 1) {
          return res.status(409).json({
            message: "Impossible : ce serait le dernier administrateur.",
          });
        }
      }

      await db.query("UPDATE users SET role = ? WHERE id_user = ?", [
        role,
        idCible,
      ]);

      return res.status(200).json({
        message:
          role === "admin"
            ? `${cible.pseudo} est maintenant administrateur.`
            : `${cible.pseudo} n'est plus administrateur.`,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Erreur lors du changement de rôle.",
      });
    }
  },
);

// ---------------------------------------------------------------------------
// DELETE /api/admin/utilisateurs/:id — supprimer un compte
//
// Irreversible : les cles etrangeres sont en ON DELETE CASCADE, donc les playlists, les likes
// et les depots de la personne disparaissent avec elle.
// ---------------------------------------------------------------------------
router.delete(
  "/utilisateurs/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const idCible = Number(req.params.id);

      // Garde-fou : on ne se supprime pas soi-meme (on perdrait sa session en cours de route,
      // et potentiellement le dernier acces admin).
      if (idCible === req.user.id_user) {
        return res.status(409).json({
          message: "Tu ne peux pas supprimer ton propre compte.",
        });
      }

      const [[cible]] = await db.query(
        "SELECT id_user, pseudo, role FROM users WHERE id_user = ?",
        [idCible],
      );

      if (!cible) {
        return res.status(404).json({ message: "Utilisateur introuvable." });
      }

      // Garde-fou : jamais le dernier admin.
      if (cible.role === "admin") {
        const [[{ nb }]] = await db.query(
          "SELECT COUNT(*) AS nb FROM users WHERE role = 'admin'",
        );
        if (nb <= 1) {
          return res.status(409).json({
            message: "Impossible : c'est le dernier administrateur.",
          });
        }
      }

      // Nettoyage des fichiers des depots en attente AVANT le DELETE (cf. src/depots.js) : la
      // cascade SQL efface les lignes de `submissions`, jamais les fichiers sur le disque. Sans
      // cet appel, supprimer un utilisateur ayant des depots en attente laissait ses fichiers
      // orphelins dans uploads/ — l'auto-suppression (userRoute) nettoyait deja, pas celle-ci.
      await nettoyerDepotsEnAttente(idCible);

      await db.query("DELETE FROM users WHERE id_user = ?", [idCible]);

      return res.status(200).json({
        message: `Le compte de ${cible.pseudo} a été supprimé.`,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Erreur lors de la suppression du compte.",
      });
    }
  },
);

export default router;
