// Garde-fou de configuration : au DÉMARRAGE, on vérifie que les variables d'environnement
// nécessaires sont présentes et cohérentes. Si une variable critique manque, le serveur
// REFUSE de démarrer (fail-fast) au lieu de démarrer à moitié cassé.
//
// POURQUOI ce fichier existe. Beaucoup de pannes de config sont SILENCIEUSES : le serveur
// répond 200, ne log rien, et pourtant quelque chose ne marche pas (un mail qui ne part
// jamais, un rate-limit qui bloquera tout le monde plus tard, un hash d'IP réversible). On
// les découvre alors des semaines après la mise en ligne. Ce garde-fou les transforme en
// échec BRUYANT et IMMÉDIAT : mieux vaut un serveur qui refuse de démarrer avec un message
// clair qu'un serveur qui tourne en mentant sur son état.
//
// POURQUOI il s'exécute à l'import (effet de bord), et pas via une fonction appelée dans
// server.js. En ESM, les imports sont évalués AVANT le corps du module. Comme `db.js` lit
// `DB_*` et tente sa connexion dès son import (tiré par les routes), il faut que cette
// vérification tourne AVANT lui. On l'importe donc en toute première ligne de server.js
// (`import "./src/verifierEnv.js";`) : l'ordre ESM garantit qu'elle passe avant tout le
// reste. Le prix à payer : ce module n'est pas testable unitairement (il fait `process.exit`
// au chargement) — acceptable pour un garde-fou dont le seul rôle est de stopper le boot.
//
// POURQUOI on ne peut pas crasher sur NODE_ENV. La variable qui déclare « on est en prod »
// est justement celle qui manquerait : son absence est indistinguable d'un dev légitime. On
// ne peut donc que PRÉVENIR (warning), pas refuser de démarrer.

import dotenv from "dotenv";

// db.js appelle aussi dotenv.config() ; c'est idempotent (par défaut il n'écrase pas une
// variable déjà définie). On le refait ici parce qu'on tourne AVANT db.js et qu'on a besoin
// du .env chargé pour vérifier quoi que ce soit.
dotenv.config();

const enProduction = process.env.NODE_ENV === "production";

// Variables du CŒUR : sans elles, l'app ne tourne nulle part (dev comme prod).
const VARIABLES_COEUR = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "DB_PORT",
  "JWT_SECRET",
  "PORT",
];

// Variables requises UNIQUEMENT en production (encombrantes/inutiles en local).
const VARIABLES_PROD = ["FRONTEND_URL", "IP_HASH_SALT"];

// Longueur minimale d'un JWT_SECRET digne de la prod. Un secret court trahit le plus souvent
// une clé de dev réutilisée — exactement le scénario silencieux le plus grave (tout marche,
// mais un jeton admin peut être forgé). On génère 48 octets en base64url (~64 caractères)
// dans DEPLOIEMENT.md ; 32 est un plancher prudent.
const LONGUEUR_MIN_JWT = 32;

const erreurs = [];
const avertissements = [];

// 1. Le cœur : vérifié en dev comme en prod.
for (const nom of VARIABLES_COEUR) {
  if (!process.env[nom]) {
    erreurs.push(`${nom} est absente (indispensable au démarrage).`);
  }
}

// 2. La production : uniquement quand on tourne réellement en ligne.
if (enProduction) {
  for (const nom of VARIABLES_PROD) {
    if (!process.env[nom]) {
      erreurs.push(
        `${nom} est absente (indispensable en production — voir DEPLOIEMENT.md §6).`,
      );
    }
  }

  if (
    process.env.JWT_SECRET &&
    process.env.JWT_SECRET.length < LONGUEUR_MIN_JWT
  ) {
    erreurs.push(
      `JWT_SECRET fait moins de ${LONGUEUR_MIN_JWT} caractères : trop faible pour la production (souvent le signe d'une clé de dev réutilisée). Générer une nouvelle clé — voir DEPLOIEMENT.md §6.`,
    );
  }
} else {
  // Hors production : on ne PEUT PAS savoir si c'est un dev légitime ou une prod dont le
  // NODE_ENV a été oublié. On ne crashe donc pas, mais on prévient — si cette machine est
  // en ligne, ces protections sont désactivées.
  avertissements.push(
    "NODE_ENV n'est pas 'production' : 'trust proxy' est désactivé (le rate-limit " +
      "compterait tout le trafic derrière nginx comme un seul visiteur et bloquerait tout " +
      "le monde d'un coup) et RATE_LIMIT_DISABLED redevient possible. Normal en local ; " +
      "ANORMAL si cette machine est en ligne.",
  );
}

// 3. Le mail : jamais bloquant (l'app fonctionne sans), mais on crie fort — car son échec
// est silencieux : « mot de passe oublié » répond OK sans envoyer aucun mail, et le
// formulaire de contact tombe en erreur, sans que rien ne saute aux yeux au démarrage.
const VARIABLES_MAIL = ["MAIL_USER", "MAIL_PASS", "MAIL_TO"];
const mailManquant = VARIABLES_MAIL.filter((nom) => !process.env[nom]);
if (mailManquant.length > 0) {
  avertissements.push(
    `Configuration mail incomplète (${mailManquant.join(", ")}) : « mot de passe oublié » ` +
      "et le formulaire de contact ne pourront PAS envoyer d'email — sans erreur visible " +
      "côté utilisateur. Fonctionnalité annexe, donc le serveur démarre quand même.",
  );
}

// On affiche les avertissements (le serveur démarre malgré eux).
for (const avertissement of avertissements) {
  console.warn(`⚠️  Configuration : ${avertissement}`);
}

// Les erreurs sont FATALES. On les liste TOUTES d'un coup (ne pas obliger à corriger, puis
// redémarrer, puis découvrir la suivante), puis on refuse de démarrer.
if (erreurs.length > 0) {
  console.error("\n❌ Le serveur refuse de démarrer — configuration invalide :\n");
  for (const erreur of erreurs) {
    console.error(`   • ${erreur}`);
  }
  console.error("\nCorrige backend/.env puis relance.\n");
  process.exit(1);
}
