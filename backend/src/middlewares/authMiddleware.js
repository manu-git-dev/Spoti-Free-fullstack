import jwt from "jsonwebtoken"; // import de jsonwebtoken
import db from "../../db.js";

// Verifie le jeton porte par l'en-tete `Authorization: Bearer <token>`, puis attache la charge
// utile decodee a `req.user`.
//
// DEUX controles, et non un seul :
//
// 1. La SIGNATURE (jwt.verify) — le jeton a bien ete emis par nous et n'a pas ete bricole.
//
// 2. La FRAICHEUR (la requete ci-dessous) — le jeton a ete emis APRES le dernier changement de
//    mot de passe. C'est la partie ajoutee le 2026-07-25, et voici pourquoi elle est necessaire :
//    un JWT est autonome, il vaut jusqu'a son expiration et RIEN ne le revoque. Sans ce test,
//    changer son mot de passe ne fermait aucune session : la personne dont le jeton a ete vole
//    faisait exactement ce qu'on lui conseille de faire, et l'attaquant gardait l'acces jusqu'a
//    24h. La seule action de reprise de controle offerte par l'app ne reprenait rien.
//
// LE COMPROMIS, a connaitre : ce deuxieme controle coute une requete SQL sur CHAQUE appel
// authentifie. C'est precisement ce que le JWT cherchait a eviter (son interet est d'etre
// verifiable sans toucher la base). On le paie quand meme, pour la meme raison qui fait que
// `adminMiddleware` relit deja le role en base a chaque requete : un jeton qui reste valable
// alors que les droits ont change n'est pas une optimisation, c'est un trou. Le cout reel est
// une lecture sur cle primaire — la requete la moins chere qui existe.
//
// L'alternative (une liste de jetons revoques en memoire ou dans Redis) serait plus rapide mais
// demanderait un stockage de plus a deployer et a maintenir, pour un projet qui tourne sur une
// seule machine avec MySQL deja la. On reintroduit le minimum d'etat : une date, pas des sessions.
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization; // on récupère le headers contenant le token, Bearer "token"

  if (!authHeader) {
    return res.status(401).json({ // si il est vide on le signale
      message: "Token manquant",
    });
  }

  const token = authHeader.split(" ")[1]; // sinon on récupére le token dans le header ( on le split pour récupérer le token seulement sans le Bearer)

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET); // on vérifie si il est valide
  } catch (error) { // il n'est pas valide alors
    return res.status(401).json({
      message: "Token invalide",
    });
  }

  try {
    // On demande a MySQL de convertir la date en secondes Unix plutot que de comparer des dates
    // en JavaScript : `iat` est un epoch UTC, la colonne un DATETIME dans le fuseau du serveur.
    // Laisser la base faire la conversion evite d'avoir a raisonner sur les fuseaux — et un
    // decalage d'une heure ici deconnecterait tout le monde, ou ne deconnecterait personne.
    const [[utilisateur]] = await db.query(
      "SELECT UNIX_TIMESTAMP(`password_changed_at`) AS changement FROM `users` WHERE id_user = ?",
      [decoded.id_user],
    );

    // `changement` est NULL tant que le mot de passe n'a jamais ete change : il n'y a alors aucun
    // jeton a perimer. Comparaison STRICTE (`<`) : un jeton emis dans la meme seconde que le
    // changement reste valable, sinon se reconnecter juste apres une reinitialisation echouerait
    // une fois sur deux, selon l'arrondi a la seconde.
    if (utilisateur?.changement && decoded.iat < utilisateur.changement) {
      // 401 (et non 403) : c'est bien la SESSION qui n'est plus valable. Le front purge
      // automatiquement le stockage local sur un 401 (voir App.jsx) — c'est exactement le
      // comportement voulu ici, la personne doit se reconnecter.
      return res.status(401).json({
        message: "Session expirée : le mot de passe a été modifié. Reconnecte-toi.",
      });
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la vérification de la session.",
    });
  }

  req.user = decoded; // on rajoute id_user et email à la requete

  next(); // le middleware à bien vérifié le token et il est bon alors on autorise pour la suite
};

export default authMiddleware;
