import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { parseFile } from "music-metadata";

import db from "../../db.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import { limitesDesactivees } from "../config.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// Ou vont les fichiers
//
// `uploads/` est HORS de `public/`. C'est la decision la plus importante de tout ce fichier :
// `server.js` fait `express.static("public")`, donc tout ce qui atterrit dans `public/` est
// servi publiquement, immediatement. Un morceau depose mais pas encore valide y serait donc en
// ligne avant moderation — et la moderation ne servirait plus a rien.
//
// Le fichier n'est deplace vers `public/` qu'a l'approbation (voir plus bas).
// ---------------------------------------------------------------------------
const DOSSIER_UPLOADS = path.join(process.cwd(), "uploads");
const DOSSIER_PUBLIC_AUDIO = path.join(process.cwd(), "public", "musiques");
const DOSSIER_PUBLIC_IMAGES = path.join(process.cwd(), "public", "images");

const EXTENSIONS_AUDIO = [".mp3", ".wav", ".ogg", ".m4a"];
const EXTENSIONS_IMAGE = [".jpg", ".jpeg", ".png", ".webp"];

const TAILLE_MAX_AUDIO = 10 * 1024 * 1024; // 10 Mo
const TAILLE_MAX_IMAGE = 2 * 1024 * 1024; //  2 Mo

const stockage = multer.diskStorage({
  destination: (req, fichier, cb) => cb(null, DOSSIER_UPLOADS),

  filename: (req, fichier, cb) => {
    const extension = path.extname(fichier.originalname).toLowerCase();

    // On REGENERE le nom du fichier. Ne jamais reutiliser celui fourni par l'utilisateur :
    // un nom comme `../../server.js` ferait ecrire multer en dehors de `uploads/` et pourrait
    // ecraser du code (c'est une attaque par "path traversal").
    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage: stockage,

  // Sans limite de taille, n'importe qui peut remplir le disque du serveur.
  // multer applique la plus grande des deux ; on affine ensuite par champ (voir §validation).
  limits: { fileSize: TAILLE_MAX_AUDIO },

  fileFilter: (req, fichier, cb) => {
    const extension = path.extname(fichier.originalname).toLowerCase();
    const attendues =
      fichier.fieldname === "audio" ? EXTENSIONS_AUDIO : EXTENSIONS_IMAGE;

    // ATTENTION : ce filtre ne PROUVE rien. L'extension et le `mimetype` viennent tous les
    // deux du client et se falsifient trivialement (il suffit de renommer un fichier).
    // C'est un premier tri, pas une validation. La vraie verification, c'est de lire le
    // CONTENU du fichier — c'est fait plus bas avec music-metadata.
    if (!attendues.includes(extension)) {
      return cb(
        new Error(`Format non accepté (attendu : ${attendues.join(", ")}).`),
      );
    }
    cb(null, true);
  },
});

const champsAttendus = upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

// Sans limite, on peut a la fois remplir le disque ET noyer la boite mail de l'admin
// (chaque depot declenche une notification).
const limiteDepot = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  skipFailedRequests: true, // ne compter que les depots reellement enregistres
  skip: () => limitesDesactivees,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Trop de dépôts envoyés. Réessaye dans une heure.",
  },
});

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

/** Supprime des fichiers sans jamais faire echouer l'appelant (nettoyage "best effort"). */
async function supprimerFichiers(...noms) {
  await Promise.all(
    noms.filter(Boolean).map(async (nom) => {
      try {
        await fs.unlink(path.join(DOSSIER_UPLOADS, nom));
      } catch (error) {
        // Le fichier a deja disparu (ou n'a jamais ete ecrit) : ce n'est pas un probleme.
        if (error.code !== "ENOENT") console.error(error);
      }
    }),
  );
}

/** Notifie l'admin par mail. Un echec d'envoi ne doit PAS faire echouer le depot. */
async function notifierAdmin(depot, pseudo) {
  if (!process.env.MAIL_USER || !process.env.MAIL_TO) return;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_TO,
      subject: `Spoti-Free — nouveau dépôt : ${depot.title}`,
      text:
        `${pseudo} vient de déposer un morceau.\n\n` +
        `Titre  : ${depot.title}\n` +
        `Artiste: ${depot.artist}\n` +
        `Genre  : ${depot.genre || "—"}\n\n` +
        `À valider sur la page Modération.`,
    });
  } catch (error) {
    // Le depot est enregistre : l'utilisateur n'a pas a subir un souci d'envoi de mail.
    // On log, et l'admin verra le depot sur sa page de moderation de toute facon.
    console.error("Notification admin impossible :", error.message);
  }
}

// ---------------------------------------------------------------------------
// POST /api/submissions — deposer un morceau
// ---------------------------------------------------------------------------
router.post(
  "/",
  authMiddleware,
  limiteDepot,
  // multer est appele via un wrapper pour transformer ses erreurs (fichier trop gros, mauvaise
  // extension) en reponses JSON propres. Sans ca, elles finiraient dans le middleware d'erreur
  // global en 500, alors que ce sont des erreurs du CLIENT (400/413).
  (req, res, next) => {
    champsAttendus(req, res, (erreur) => {
      if (!erreur) return next();

      if (erreur.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          message: "Fichier trop lourd (10 Mo maximum pour l'audio).",
        });
      }
      return res.status(400).json({ message: erreur.message });
    });
  },
  async (req, res) => {
    const audio = req.files?.audio?.[0];
    const image = req.files?.image?.[0];

    try {
      const title = req.body.title?.trim();
      const artist = req.body.artist?.trim();
      const genre = req.body.genre?.trim() || null;

      if (!title || !artist || !audio || !image) {
        await supprimerFichiers(audio?.filename, image?.filename);
        return res.status(400).json({
          message: "Titre, artiste, fichier audio et pochette sont obligatoires.",
        });
      }

      // La limite globale de multer est celle de l'audio (10 Mo) : on affine ici pour l'image.
      if (image.size > TAILLE_MAX_IMAGE) {
        await supprimerFichiers(audio.filename, image.filename);
        return res.status(413).json({
          message: "Pochette trop lourde (2 Mo maximum).",
        });
      }

      // ---------------------------------------------------------------------
      // LA validation : on lit le CONTENU du fichier.
      //
      // Jusqu'ici, on n'a verifie que l'extension — c'est-a-dire une chaine de caracteres
      // choisie par l'utilisateur. Renommer `virus.txt` en `musique.mp3` suffit a la passer.
      //
      // music-metadata essaie de decoder le fichier comme de l'audio. S'il n'y arrive pas,
      // c'est que ce n'est pas de l'audio, quel que soit son nom : on le rejette.
      //
      // Bonus : quand ca marche, on recupere la duree. Une seule operation nous donne donc la
      // validation ET la donnee — qu'on n'aura jamais a demander au client (qui pourrait mentir).
      // ---------------------------------------------------------------------
      let duration = null;
      try {
        const metadonnees = await parseFile(
          path.join(DOSSIER_UPLOADS, audio.filename),
        );
        duration = Math.round(metadonnees.format.duration ?? 0);
      } catch {
        duration = null; // le fichier n'a meme pas pu etre decode
      }

      // Deux cas d'echec, un seul verdict : ce n'est pas de l'audio exploitable.
      // - le decodage a leve une erreur (fichier binaire quelconque) ;
      // - le decodage a "reussi" mais sans trouver de duree (cas d'un fichier texte renomme
      //   en .mp3 : il n'y a aucun flux audio a mesurer).
      // Dans les deux cas, un vrai morceau aurait une duree. On rejette, et on ne laisse pas
      // les fichiers trainer.
      if (!duration) {
        await supprimerFichiers(audio.filename, image.filename);
        return res.status(400).json({
          message:
            "Ce fichier n'est pas un fichier audio valide (ou il est corrompu).",
        });
      }

      await db.query(
        `INSERT INTO submissions
           (id_user, title, artist, genre, fichier_audio, fichier_image, duration)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id_user,
          title,
          artist,
          genre,
          audio.filename,
          image.filename,
          duration,
        ],
      );

      const [[utilisateur]] = await db.query(
        "SELECT pseudo FROM users WHERE id_user = ?",
        [req.user.id_user],
      );
      await notifierAdmin({ title, artist, genre }, utilisateur?.pseudo ?? "?");

      return res.status(201).json({
        message: "Dépôt envoyé. Il sera publié après validation.",
      });
    } catch (error) {
      console.error(error);
      // En cas de pepin, on ne laisse pas de fichiers orphelins derriere nous.
      await supprimerFichiers(audio?.filename, image?.filename);

      return res.status(500).json({
        message: "Erreur lors de l'enregistrement du dépôt.",
      });
    }
  },
);

// ---------------------------------------------------------------------------
// GET /api/submissions/mes-depots — le suivi, cote utilisateur
// ---------------------------------------------------------------------------
router.get("/mes-depots", authMiddleware, async (req, res) => {
  try {
    const [depots] = await db.query(
      `SELECT id_submission, title, artist, genre, statut, motif_refus, created_at
         FROM submissions
        WHERE id_user = ?
        ORDER BY created_at DESC`,
      [req.user.id_user],
    );

    // Liste vide = resultat valide, pas une erreur -> 200 [] (et non 404).
    return res.status(200).json(depots);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors de la récupération de vos dépôts.",
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/submissions — la liste, cote admin
// ---------------------------------------------------------------------------
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const statut = req.query.statut;
    const statutsValides = ["en_attente", "approuve", "refuse"];

    // On ne concatene JAMAIS `req.query.statut` dans le SQL : on le compare a une liste connue.
    // (Ici mysql2 utilise deja des requetes preparees, mais cette validation evite en plus de
    // filtrer sur une valeur qui n'existe pas.)
    const filtre = statutsValides.includes(statut) ? statut : null;

    const [depots] = await db.query(
      `SELECT s.id_submission, s.title, s.artist, s.genre, s.duration,
              s.statut, s.motif_refus, s.created_at, u.pseudo
         FROM submissions s
         JOIN users u ON u.id_user = s.id_user
        ${filtre ? "WHERE s.statut = ?" : ""}
        ORDER BY s.created_at DESC`,
      filtre ? [filtre] : [],
    );

    return res.status(200).json(depots);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors de la récupération des dépôts.",
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/submissions/:id/audio — ecouter un morceau EN ATTENTE (admin seulement)
//
// C'est la seule porte vers `uploads/`, et elle est fermee a double tour : le fichier n'etant
// pas dans `public/`, il n'existe aucun autre moyen d'y acceder.
// ---------------------------------------------------------------------------
router.get("/:id/audio", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [[depot]] = await db.query(
      "SELECT fichier_audio FROM submissions WHERE id_submission = ?",
      [req.params.id],
    );

    if (!depot) {
      return res.status(404).json({ message: "Dépôt introuvable." });
    }

    // On utilise le nom stocke EN BASE, jamais un nom venu de l'URL. Sinon une requete du type
    // `/api/submissions/../../.env/audio` permettrait de lire n'importe quel fichier du serveur.
    // `path.basename` est une ceinture de securite supplementaire : il retire tout chemin.
    const chemin = path.join(
      DOSSIER_UPLOADS,
      path.basename(depot.fichier_audio),
    );

    return res.sendFile(chemin);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la lecture." });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/submissions/:id/approuver
//
// Le seul endroit du code ou un fichier entre dans `public/`.
// ---------------------------------------------------------------------------
router.patch(
  "/:id/approuver",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const [[depot]] = await db.query(
        "SELECT * FROM submissions WHERE id_submission = ?",
        [req.params.id],
      );

      if (!depot) {
        return res.status(404).json({ message: "Dépôt introuvable." });
      }

      // Deja traite : la demande entre en conflit avec l'etat actuel -> 409 (et non 400).
      if (depot.statut !== "en_attente") {
        return res.status(409).json({
          message: "Ce dépôt a déjà été traité.",
        });
      }

      const nomAudio = path.basename(depot.fichier_audio);
      const nomImage = path.basename(depot.fichier_image);

      // On deplace les fichiers : c'est maintenant, et seulement maintenant, qu'ils deviennent
      // publiquement accessibles.
      await fs.rename(
        path.join(DOSSIER_UPLOADS, nomAudio),
        path.join(DOSSIER_PUBLIC_AUDIO, nomAudio),
      );
      await fs.rename(
        path.join(DOSSIER_UPLOADS, nomImage),
        path.join(DOSSIER_PUBLIC_IMAGES, nomImage),
      );

      // Les chemins stockes sont RELATIFS a `public/`, comme le reste du catalogue
      // (`musiques/xxx.mp3`, `images/xxx.jpg`).
      await db.query(
        `INSERT INTO musics (title, artist, genre, src_image, src_audio, duration)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          depot.title,
          depot.artist,
          depot.genre,
          `images/${nomImage}`,
          `musiques/${nomAudio}`,
          depot.duration,
        ],
      );

      await db.query(
        "UPDATE submissions SET statut = 'approuve' WHERE id_submission = ?",
        [depot.id_submission],
      );

      return res.status(200).json({
        message: `« ${depot.title} » a été ajouté au catalogue.`,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Erreur lors de l'approbation du dépôt.",
      });
    }
  },
);

// ---------------------------------------------------------------------------
// PATCH /api/submissions/:id/refuser
// ---------------------------------------------------------------------------
router.patch(
  "/:id/refuser",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const motif = req.body.motif?.trim() || null;

      const [[depot]] = await db.query(
        "SELECT * FROM submissions WHERE id_submission = ?",
        [req.params.id],
      );

      if (!depot) {
        return res.status(404).json({ message: "Dépôt introuvable." });
      }

      if (depot.statut !== "en_attente") {
        return res.status(409).json({
          message: "Ce dépôt a déjà été traité.",
        });
      }

      // Les fichiers refuses ne servent plus a rien : on les supprime pour ne pas laisser
      // `uploads/` gonfler indefiniment.
      await supprimerFichiers(depot.fichier_audio, depot.fichier_image);

      await db.query(
        "UPDATE submissions SET statut = 'refuse', motif_refus = ? WHERE id_submission = ?",
        [motif, depot.id_submission],
      );

      return res.status(200).json({
        message: `« ${depot.title} » a été refusé.`,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Erreur lors du refus du dépôt.",
      });
    }
  },
);

export default router;
