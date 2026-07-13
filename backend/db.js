import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Pool de connexions (et non `createConnection`) : une connexion unique est un point de
// rupture unique — si MySQL la ferme (timeout, redemarrage), toutes les requetes suivantes
// echouent jusqu'au redemarrage du serveur. Le pool ouvre/reutilise les connexions au
// besoin et en recree une automatiquement si l'une tombe. C'est aussi ce qui permet de
// traiter plusieurs requetes en parallele.
//
// L'API est identique (`db.query(...)`), il n'y a donc rien a changer dans les routes.
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Le pool est paresseux : il n'ouvre pas de connexion tant qu'on ne lui en demande pas une.
// On en demande donc une au demarrage pour verifier tout de suite que la base repond,
// plutot que de decouvrir le probleme a la premiere requete d'un utilisateur.
try {
  const connexion = await db.getConnection();
  connexion.release();
  console.log("Connexion MySQL réussie !");
} catch (error) {
  console.error("Connexion MySQL impossible :", error.message);
}

export default db;
