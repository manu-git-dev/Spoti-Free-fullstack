import express from "express";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import { limitesDesactivees } from "../config.js";
import { emailValide } from "../validation.js";
const router = express.Router();

// Cette route envoie un VRAI mail a chaque appel. Sans limite, un bot (et ils scannent les
// formulaires de contact en permanence) peut boucler dessus et noyer la boite de reception —
// voire faire suspendre le compte Gmail pour envoi abusif.
// 3 messages par IP et par heure : largement suffisant pour un visiteur, inexploitable pour
// un spammeur.
const limiteContact = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  // Ne compter que les envois qui ont REELLEMENT abouti (2xx) : sinon un visiteur qui se
  // trompe trois fois de format d'email serait bloque une heure sans avoir rien envoye.
  skipFailedRequests: true,
  skip: () => limitesDesactivees,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Tu as déjà envoyé plusieurs messages. Réessaye dans une heure — ou écris-moi directement par mail.",
  },
});

router.post("/", limiteContact, async (req, res) => {
  try {
    const nom = req.body.nom;
    const email = req.body.email;
    const sujet = req.body.sujet;
    const message = req.body.message;

    // 1. validation (comme pour l'inscription : si un champ manque -> 400)
    if (!nom || !email || !message || !sujet) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires.",
      });
    }

    // Le format de l'email est verifie ici et pas seulement par le `type="email"` du
    // formulaire : un appel direct a l'API le contournerait, et `replyTo` finirait avec une
    // valeur arbitraire. On importe `emailValide` de validation.js (source de verite unique)
    // plutot que de reecrire la regex : une regle d'email a un seul endroit dans tout le backend.
    if (!emailValide(email)) {
      return res.status(400).json({
        message: "L'adresse email n'est pas valide.",
      });
    }

    // Garde-fou sur la taille : rien n'empechait d'envoyer un message de plusieurs Mo.
    if (message.length > 5000 || sujet.length > 200 || nom.length > 100) {
      return res.status(400).json({
        message: "Message trop long.",
      });
    }
    // 2. créer le transporter nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // 3. envoyer le mail
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_TO,
      replyTo: email,
      subject: `${sujet} // de  ${nom} `,
      text: message,
    });

    // 4. réponse 200 avec un message de succès
    return res.status(200).json({
      message: "Message envoyé avec succès. Merci pour ton message.",
    });
  } catch (error) {
    // réponse 500
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors de l'envoi du message.",
    });
  }
});

export default router;
