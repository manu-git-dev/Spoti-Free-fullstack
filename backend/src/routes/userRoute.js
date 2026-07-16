import express from "express";
import db from "../../db.js";
import bcrypt from "bcryptjs";
const router = express.Router();
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import nodemailer from "nodemailer";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import { limitesDesactivees } from "../config.js";
import {
  emailValide,
  motDePasseValide,
  MESSAGE_MOT_DE_PASSE,
} from "../validation.js";

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

    // Le token peut etre valide alors que l'utilisateur n'existe plus : `authMiddleware` ne
    // verifie que la SIGNATURE du jeton, pas l'existence du compte. C'est le cas apres une
    // suppression de compte — le jeton reste cryptographiquement bon jusqu'a son expiration.
    //
    // Sans ce test, `res.json(undefined)` repondait **200 avec un corps vide** : le front croyait
    // avoir recu un profil, et affichait une page vide sans la moindre erreur.
    if (!userInfo) {
      return res.status(404).json({ message: "Compte introuvable." });
    }

    return res.json(userInfo);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors du suivi du profil.",
    });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/users/mon-compte — l'utilisateur supprime SON compte
//
// Le RGPD appelle ca le "droit a l'effacement" : une personne doit pouvoir faire disparaitre ses
// donnees sans avoir a le demander a qui que ce soit. D'ou une route que l'utilisateur declenche
// lui-meme, et non un formulaire de contact.
//
// Cette route ne "complete pas le CRUD utilisateurs" au sens interdit par les conventions du
// projet : l'absence d'EDITION du pseudo/nom/email reste volontaire (l'email est l'identifiant de
// connexion, le modifier ouvrirait une escalade de privileges). Supprimer n'est pas modifier.
//
// LE MOT DE PASSE EST EXIGE, et ce n'est pas de la paranoia deplacee : l'action est irreversible
// et emporte tout (playlists, favoris, depots). Un token suffisant, c'est un ordinateur laisse
// sans surveillance trente secondes, ou un token vole, et le compte n'existe plus. Redemander le
// mot de passe verifie que c'est bien LA PERSONNE, pas seulement SA SESSION.
// ---------------------------------------------------------------------------
router.delete("/mon-compte", authMiddleware, async (req, res) => {
  try {
    const idUser = req.user.id_user;
    const motDePasse = req.body?.motDePasse;

    if (typeof motDePasse !== "string" || motDePasse === "") {
      return res.status(400).json({
        message: "Le mot de passe est nécessaire pour supprimer le compte.",
      });
    }

    const [[utilisateur]] = await db.query(
      "SELECT id_user, password_hash, role FROM users WHERE id_user = ?",
      [idUser],
    );

    if (!utilisateur) {
      return res.status(404).json({ message: "Compte introuvable." });
    }

    const motDePasseCorrect = await bcrypt.compare(
      motDePasse,
      utilisateur.password_hash,
    );

    if (!motDePasseCorrect) {
      // 403 et non 401 : on sait tres bien qui est cette personne (son token est valide), elle
      // n'a simplement pas prouve son identite pour CETTE action. Un 401 ferait purger la
      // session cote front et la deconnecterait pour une simple faute de frappe.
      return res.status(403).json({ message: "Mot de passe incorrect." });
    }

    // Garde-fou : le dernier admin ne peut pas se supprimer.
    //
    // Sans ca, un seul clic rend le catalogue et la moderation des depots definitivement
    // ingerables — plus personne ne peut approuver, refuser, ni promouvoir un nouvel admin. Il
    // faudrait repasser par MySQL a la main sur le serveur pour s'en sortir.
    if (utilisateur.role === "admin") {
      const [[{ nb }]] = await db.query(
        "SELECT COUNT(*) AS nb FROM users WHERE role = 'admin'",
      );

      if (nb <= 1) {
        return res.status(409).json({
          message:
            "Tu es le dernier administrateur : nomme quelqu'un d'autre avant de supprimer ton compte.",
        });
      }
    }

    // -----------------------------------------------------------------------
    // Les fichiers des depots — LE piege de cette route.
    //
    // `submissions` part en cascade avec l'utilisateur (cle etrangere ON DELETE CASCADE), mais
    // la base ne sait rien des fichiers sur le disque. Il faut donc les nettoyer nous-memes,
    // AVANT de perdre les lignes qui donnent leur nom.
    //
    // Et surtout : UNIQUEMENT ceux des depots `en_attente`.
    //
    //   - `en_attente` -> le fichier est dans `uploads/`, il n'appartient qu'a ce depot, et
    //     personne ne le reclamera jamais : on le supprime.
    //   - `approuve`   -> le fichier a ete DEPLACE dans `public/` a l'approbation. La ligne de
    //     `submissions` porte encore son nom, mais ce fichier est desormais celui du CATALOGUE.
    //     Le supprimer rendrait un morceau public injouable — et s'il s'agit d'une pochette,
    //     elle est peut-etre partagee par plusieurs morceaux (cf. la regle du projet : ne jamais
    //     supprimer un fichier partage). On n'y touche pas.
    //   - `refuse`     -> le fichier a deja ete supprime au moment du refus. Rien a faire.
    //
    // Le morceau approuve reste donc au catalogue apres la suppression du compte. C'est
    // volontaire : il y est sous licence libre, l'auteur l'a place la, et le retirer casserait
    // les playlists et les favoris de tous les autres utilisateurs.
    // -----------------------------------------------------------------------
    const [depotsEnAttente] = await db.query(
      "SELECT fichier_audio, fichier_image FROM submissions WHERE id_user = ? AND statut = 'en_attente'",
      [idUser],
    );

    const DOSSIER_UPLOADS = path.join(process.cwd(), "uploads");

    for (const depot of depotsEnAttente) {
      for (const nom of [depot.fichier_audio, depot.fichier_image]) {
        if (!nom) continue;
        try {
          // `path.basename` : la colonne ne contient qu'un nom de fichier, mais on ne construit
          // jamais un chemin a partir d'une valeur de base sans le neutraliser.
          await fs.unlink(path.join(DOSSIER_UPLOADS, path.basename(nom)));
        } catch (error) {
          // Fichier deja absent : ce n'est pas une raison de faire echouer la suppression du
          // compte. L'utilisateur a demande a partir, il part.
          if (error.code !== "ENOENT") console.error(error);
        }
      }
    }

    // Les likes, playlists, playlists_musics, submissions et password_resets partent en cascade
    // (ON DELETE CASCADE, voir schema.sql). Une seule requete suffit donc.
    await db.query("DELETE FROM users WHERE id_user = ?", [idUser]);

    return res.status(200).json({
      message: "Ton compte et toutes tes données ont été supprimés.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors de la suppression du compte.",
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
// ---------------------------------------------------------------------------
// Mot de passe oublie
// ---------------------------------------------------------------------------

// Sans limite, cette route est une arme : elle envoie un mail a chaque appel. On pourrait donc
// s'en servir pour inonder la boite de quelqu'un (harcelement), ou pour faire suspendre notre
// propre compte d'envoi pour abus.
const limiteMotDePasseOublie = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  skip: () => limitesDesactivees,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Trop de demandes. Réessaye dans une heure.",
  },
});

/** SHA-256 : sert a stocker l'empreinte du jeton, jamais le jeton lui-meme. */
function empreinte(jeton) {
  return crypto.createHash("sha256").update(jeton).digest("hex");
}

// POST /api/users/mot-de-passe-oublie
//
// LE piege de cette route : l'enumeration de comptes.
//
// Si on repondait "cet email n'existe pas" quand c'est le cas, n'importe qui pourrait tester des
// adresses en masse pour savoir lesquelles sont inscrites sur le site. C'est une fuite de donnees
// personnelles (savoir que quelqu'un a un compte ici est deja une information), et le point de
// depart d'attaques ciblees.
//
// On renvoie donc TOUJOURS la meme reponse, que l'email existe ou non.
router.post(
  "/mot-de-passe-oublie",
  limiteMotDePasseOublie,
  async (req, res) => {
    // Reponse volontairement identique dans tous les cas.
    const reponseNeutre = {
      message:
        "Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé.",
    };

    try {
      const email = req.body.email?.trim();

      if (!email) {
        return res.status(400).json({ message: "L'adresse email est obligatoire." });
      }

      const [[utilisateur]] = await db.query(
        "SELECT id_user, pseudo, email FROM users WHERE email = ?",
        [email],
      );

      // Compte inexistant : on s'arrete la, mais on renvoie la MEME reponse (et le meme code)
      // que si tout s'etait bien passe.
      if (!utilisateur) {
        return res.status(200).json(reponseNeutre);
      }

      // Jeton cryptographiquement aleatoire. Surtout pas un UUID v4 ni un `Math.random()` :
      // il faut de l'imprevisible, pas seulement de l'unique.
      const jeton = crypto.randomBytes(32).toString("base64url");

      // On invalide les demandes precedentes encore actives : une seule doit valoir a la fois.
      await db.query(
        "UPDATE password_resets SET used_at = NOW() WHERE id_user = ? AND used_at IS NULL",
        [utilisateur.id_user],
      );

      await db.query(
        `INSERT INTO password_resets (id_user, token_hash, expire_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
        [utilisateur.id_user, empreinte(jeton)],
      );

      // Le lien pointe vers le FRONT (c'est lui qui affiche le formulaire), avec le jeton en
      // clair — c'est la seule et unique fois qu'il circule.
      const base = process.env.FRONTEND_URL ?? "http://localhost:5173";
      const lien = `${base}/reinitialiser-mot-de-passe?token=${jeton}`;

      if (process.env.MAIL_USER && process.env.MAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
        });

        await transporter.sendMail({
          from: process.env.MAIL_USER,
          to: utilisateur.email,
          subject: "Spoti-Free — réinitialisation de ton mot de passe",
          text:
            `Bonjour ${utilisateur.pseudo},\n\n` +
            `Tu as demandé à réinitialiser ton mot de passe. Ce lien est valable 1 heure :\n\n` +
            `${lien}\n\n` +
            `Si tu n'es pas à l'origine de cette demande, ignore ce message : ton mot de passe reste inchangé.\n`,
        });
      }

      return res.status(200).json(reponseNeutre);
    } catch (error) {
      console.error(error);
      // Meme en cas d'erreur d'envoi, on ne revele rien : le message reste neutre.
      return res.status(200).json(reponseNeutre);
    }
  },
);

// POST /api/users/reinitialiser-mot-de-passe
router.post("/reinitialiser-mot-de-passe", async (req, res) => {
  try {
    const jeton = req.body.token;
    const motDePasse = req.body.password;

    if (!jeton || !motDePasse) {
      return res.status(400).json({
        message: "Le lien et le nouveau mot de passe sont obligatoires.",
      });
    }

    // Meme regle qu'a l'inscription : la validation vit cote serveur, pas seulement dans le
    // formulaire (qu'un appel direct a l'API contourne). Et surtout, c'est LA MEME regle :
    // une exigence appliquee a l'inscription mais pas ici se contournerait en passant par
    // "mot de passe oublie" pour se choisir un mot de passe faible.
    if (!motDePasseValide(motDePasse)) {
      return res.status(400).json({
        message: MESSAGE_MOT_DE_PASSE,
      });
    }

    // On cherche par EMPREINTE : le jeton en clair n'existe nulle part en base.
    const [[demande]] = await db.query(
      "SELECT id_reset, id_user, expire_at, used_at FROM password_resets WHERE token_hash = ?",
      [empreinte(jeton)],
    );

    // Jeton inconnu, deja utilise, ou expire : un seul et meme message. Distinguer les cas
    // renseignerait un attaquant sur la validite d'un jeton qu'il teste.
    const invalide =
      !demande || demande.used_at || new Date(demande.expire_at) < new Date();

    if (invalide) {
      return res.status(400).json({
        message:
          "Ce lien n'est plus valable. Il a peut-être expiré ou déjà été utilisé — refais une demande.",
      });
    }

    const hash = await bcrypt.hash(motDePasse, 10);

    await db.query("UPDATE users SET password_hash = ? WHERE id_user = ?", [
      hash,
      demande.id_user,
    ]);

    // Usage unique : le lien reste dans la boite mail, il ne doit plus rien pouvoir faire.
    await db.query(
      "UPDATE password_resets SET used_at = NOW() WHERE id_reset = ?",
      [demande.id_reset],
    );

    return res.status(200).json({
      message: "Mot de passe modifié. Tu peux maintenant te connecter.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors de la réinitialisation.",
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
    if (!emailValide(email)) {
      return res.status(400).json({
        message: "L'adresse email n'est pas valide.",
      });
    }

    if (!motDePasseValide(password)) {
      return res.status(400).json({
        message: MESSAGE_MOT_DE_PASSE,
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
            // Le front s'en sert UNIQUEMENT pour afficher ou masquer le lien "Modération".
            // Ce n'est pas une protection : quelqu'un qui modifierait son localStorage verrait
            // le lien, mais chacune de ses requetes se heurterait a `adminMiddleware` (403).
            // Le role n'est volontairement PAS mis dans le JWT : il est relu en base a chaque
            // requete, pour qu'un retrait de droits prenne effet immediatement.
            role: user.role,
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
