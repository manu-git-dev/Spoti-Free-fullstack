import jwt from "jsonwebtoken"; // import de jsonwebtoken

const authMiddleware = (req, res, next) => { 
  const authHeader = req.headers.authorization; // on récupère le headers contenant le token, Bearer "token"

  if (!authHeader) {
    return res.status(401).json({ // si il est vide on le signale 
      message: "Token manquant",
    });
  }

  const token = authHeader.split(" ")[1]; // sinon on récupére le token dans le header ( on le split pour récupérer le token seulement sans le Bearer)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // on vérifie si il est valide

    req.user = decoded; // on rajoute id_user et email à la requete

    next(); // le middleware à bien vérifié le token et il est bon alors on autorise pour la suite
  } catch (error) { // il n'est pas valide alors
    return res.status(401).json({ 
      message: "Token invalide",
    });
  }
};

export default authMiddleware;