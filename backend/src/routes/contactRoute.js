import express from "express";
import nodemailer from "nodemailer";
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const nom = req.body.nom;
    const email = req.body.email;
    const message = req.body.message;

    // 1. validation (comme pour l'inscription : si un champ manque -> 400)
    if (!nom || !email || !message) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires.",
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
      subject: `Nouveau message de ${nom} via Spoti-Free`,
      text: message,
    });

    // 4. réponse 200 avec un message de succès
    return res.status(200).json({
      message: "Message envoyé avec succès.",
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
