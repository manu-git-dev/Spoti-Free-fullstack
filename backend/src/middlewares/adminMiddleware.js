import db from "../../db.js";

// A placer TOUJOURS apres authMiddleware : il s'appuie sur req.user (donc sur un token valide).
//
// Le role est relu en base a chaque requete plutot que d'etre lu dans le JWT : si on retire
// les droits admin a quelqu'un, la modification prend effet immediatement, sans avoir a
// attendre l'expiration de son token.
const adminMiddleware = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT `role` FROM `users` WHERE id_user = ?",
      [req.user.id_user],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Utilisateur introuvable.",
      });
    }

    if (rows[0].role !== "admin") {
      // 403 (et pas 401) : le token est valide, c'est le droit qui manque.
      return res.status(403).json({
        message: "Accès réservé aux administrateurs.",
      });
    }

    next();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la vérification des droits.",
    });
  }
};

export default adminMiddleware;
