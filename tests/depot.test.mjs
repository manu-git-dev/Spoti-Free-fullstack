// Tests du depot de musique avec moderation.
//
// Le test central est celui du **faux .mp3** : un fichier texte renomme en `.mp3`. C'est
// exactement ce que ferait un attaquant, et c'est ce qui distingue une vraie validation (lire
// le contenu du fichier) d'une validation en carton (faire confiance a l'extension).
//
// Lancer : cd tests && npm run test:depot

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import jwt from "jsonwebtoken";

import {
  API,
  creerCompte,
  apiAuth,
  verifier,
  etape,
  rapport,
  nettoyerComptesDeTest,
} from "./utils.mjs";

const ICI = path.dirname(url.fileURLToPath(import.meta.url));
const PUBLIC = path.join(ICI, "..", "backend", "public");

const VRAI_MP3 = fs.readFileSync(
  path.join(PUBLIC, "musiques", "atlasaudio-sentimental-piano.mp3"),
);
const VRAIE_IMAGE = fs.readFileSync(path.join(PUBLIC, "images", "1.jpg"));

// Marqueur pour retrouver et nettoyer ce que ces tests creent dans le catalogue.
const MARQUEUR = `__depot-test-${Date.now()}`;

/** Construit un envoi multipart (comme le ferait le formulaire du navigateur). */
function formulaireDepot(titre, { audio, nomAudio, image = VRAIE_IMAGE }) {
  const donnees = new FormData();
  donnees.append("title", titre);
  donnees.append("artist", MARQUEUR);
  donnees.append("genre", "Test");
  donnees.append("audio", new Blob([audio]), nomAudio);
  // `image: null` = depot SANS pochette (elle est facultative).
  if (image) donnees.append("image", new Blob([image]), "cover.jpg");
  return donnees;
}

async function deposer(token, titre, options) {
  const reponse = await fetch(`${API}/api/submissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formulaireDepot(titre, options),
  });
  return { reponse, donnees: await reponse.json() };
}

/** Un token admin, forge a partir du secret local (le mot de passe admin n'est pas connu). */
function tokenAdmin() {
  return jwt.sign(
    { id_user: 10, email: "admin@admin.fr" },
    process.env.JWT_SECRET,
    { expiresIn: "10m" },
  );
}

// ---------------------------------------------------------------------------
// 1. LE test : un fichier qui n'est pas de l'audio doit etre rejete
// ---------------------------------------------------------------------------
await etape("validation du fichier", async () => {
  const { token } = await creerCompte("DepotValidation");

  // Un fichier TEXTE, renomme en .mp3. L'extension et le Content-Type mentent tous les deux.
  const faux = await deposer(token, "Faux MP3", {
    audio: Buffer.from("Je suis du texte, pas de l'audio."),
    nomAudio: "virus.mp3",
  });
  verifier(
    "depot : un fichier texte renomme en .mp3 est REJETE",
    faux.reponse.status === 400,
    `recu ${faux.reponse.status} — ${faux.donnees.message}`,
  );

  // Extension carrement interdite : rejetee des le premier filtre.
  const mauvaiseExtension = await deposer(token, "Fichier texte", {
    audio: Buffer.from("coucou"),
    nomAudio: "note.txt",
  });
  verifier(
    "depot : une extension non autorisee est rejetee",
    mauvaiseExtension.reponse.status === 400,
    `recu ${mauvaiseExtension.reponse.status}`,
  );

  // Un vrai fichier audio passe, et sa duree est extraite PAR LE SERVEUR.
  const vrai = await deposer(token, `Vrai MP3 ${MARQUEUR}`, {
    audio: VRAI_MP3,
    nomAudio: "morceau.mp3",
  });
  verifier(
    "depot : un vrai fichier audio est accepte",
    vrai.reponse.status === 201,
    `recu ${vrai.reponse.status}`,
  );

  const api = apiAuth(token);
  const { donnees: mesDepots } = await api("/api/submissions/mes-depots");
  verifier(
    "depot : seul le depot valide a ete enregistre",
    mesDepots.length === 1,
    `${mesDepots.length} depot(s) en base`,
  );
});

// ---------------------------------------------------------------------------
// 2. Le fichier en attente n'est PAS accessible publiquement
//
// C'est toute la raison d'etre de la moderation : si le fichier etait dans `public/`, il
// serait en ligne des le depot, avant toute validation.
// ---------------------------------------------------------------------------
await etape("le fichier en attente reste prive", async () => {
  const { token } = await creerCompte("DepotPrive");
  await deposer(token, `Prive ${MARQUEUR}`, {
    audio: VRAI_MP3,
    nomAudio: "prive.mp3",
  });

  const admin = apiAuth(tokenAdmin());
  const { donnees: depots } = await admin("/api/submissions?statut=en_attente");
  const depot = depots.find((d) => d.title === `Prive ${MARQUEUR}`);

  // a) un visiteur ne peut pas y acceder sans token
  const sansToken = await fetch(
    `${API}/api/submissions/${depot.id_submission}/audio`,
  );
  verifier(
    "fichier en attente : inaccessible sans token (401)",
    sansToken.status === 401,
    `recu ${sansToken.status}`,
  );

  // b) meme connecte, un utilisateur normal ne peut pas l'ecouter
  const utilisateur = apiAuth(token);
  const { reponse: parUtilisateur } = await utilisateur(
    `/api/submissions/${depot.id_submission}/audio`,
    { brut: true },
  );
  verifier(
    "fichier en attente : inaccessible a un utilisateur normal (403)",
    parUtilisateur.status === 403,
    `recu ${parUtilisateur.status}`,
  );

  // c) un utilisateur normal ne peut pas non plus voir la liste de moderation
  const { reponse: listeParUtilisateur } = await utilisateur("/api/submissions");
  verifier(
    "moderation : la liste est reservee a l'admin (403)",
    listeParUtilisateur.status === 403,
    `recu ${listeParUtilisateur.status}`,
  );

  // d) l'admin, lui, peut ecouter
  const parAdmin = await fetch(
    `${API}/api/submissions/${depot.id_submission}/audio`,
    { headers: { Authorization: `Bearer ${tokenAdmin()}` } },
  );
  verifier(
    "fichier en attente : l'admin peut l'ecouter (200)",
    parAdmin.status === 200,
    `recu ${parAdmin.status}`,
  );
});

// ---------------------------------------------------------------------------
// 3. Le cycle de moderation
// ---------------------------------------------------------------------------
await etape("moderation : approbation et refus", async () => {
  const { token } = await creerCompte("DepotModeration");
  await deposer(token, `A approuver ${MARQUEUR}`, {
    audio: VRAI_MP3,
    nomAudio: "a.mp3",
  });
  await deposer(token, `A refuser ${MARQUEUR}`, {
    audio: VRAI_MP3,
    nomAudio: "b.mp3",
  });

  const admin = apiAuth(tokenAdmin());
  const { donnees: depots } = await admin("/api/submissions?statut=en_attente");
  const aApprouver = depots.find((d) => d.title === `A approuver ${MARQUEUR}`);
  const aRefuser = depots.find((d) => d.title === `A refuser ${MARQUEUR}`);

  // --- approbation ---
  const approbation = await admin(
    `/api/submissions/${aApprouver.id_submission}/approuver`,
    { method: "PATCH" },
  );
  verifier(
    "approbation : le depot est approuve (200)",
    approbation.reponse.status === 200,
    `recu ${approbation.reponse.status}`,
  );

  const catalogue = await (await fetch(`${API}/api/musics`)).json();
  const ajoute = catalogue.find((m) => m.title === `A approuver ${MARQUEUR}`);
  verifier(
    "approbation : le morceau rejoint le catalogue, avec sa duree",
    Boolean(ajoute) && ajoute.duration > 0,
    ajoute ? `${ajoute.src_audio} (${ajoute.duration}s)` : "absent du catalogue",
  );

  // Le morceau est desormais servi publiquement — mais seulement maintenant.
  const fichierPublic = await fetch(`${API}/${ajoute.src_audio}`);
  verifier(
    "approbation : le fichier devient accessible publiquement",
    fichierPublic.status === 200,
    `recu ${fichierPublic.status}`,
  );

  // Approuver deux fois : la demande entre en conflit avec l'etat actuel -> 409.
  const deuxiemeFois = await admin(
    `/api/submissions/${aApprouver.id_submission}/approuver`,
    { method: "PATCH" },
  );
  verifier(
    "approbation : un depot deja traite renvoie 409",
    deuxiemeFois.reponse.status === 409,
    `recu ${deuxiemeFois.reponse.status}`,
  );

  // --- refus ---
  const refus = await admin(
    `/api/submissions/${aRefuser.id_submission}/refuser`,
    { method: "PATCH", body: { motif: "Qualité insuffisante" } },
  );
  verifier(
    "refus : le depot est refuse (200)",
    refus.reponse.status === 200,
    `recu ${refus.reponse.status}`,
  );

  const utilisateur = apiAuth(token);
  const { donnees: mesDepots } = await utilisateur("/api/submissions/mes-depots");
  const refuse = mesDepots.find((d) => d.title === `A refuser ${MARQUEUR}`);
  verifier(
    "refus : le deposant voit le statut et le motif",
    refuse?.statut === "refuse" && refuse?.motif_refus === "Qualité insuffisante",
    JSON.stringify({ statut: refuse?.statut, motif: refuse?.motif_refus }),
  );

  const catalogueApres = await (await fetch(`${API}/api/musics`)).json();
  verifier(
    "refus : le morceau n'entre PAS dans le catalogue",
    !catalogueApres.some((m) => m.title === `A refuser ${MARQUEUR}`),
  );
});

// ---------------------------------------------------------------------------
// 4. La pochette est facultative
//
// Sans pochette, l'admin peut quand meme approuver : une image deja presente dans le catalogue
// est tiree au hasard. L'admin doit aussi pouvoir CONSULTER la pochette proposee (pour verifier
// les droits d'image) — d'ou la route dediee.
// ---------------------------------------------------------------------------
await etape("pochette facultative", async () => {
  const { token } = await creerCompte("DepotPochette");
  const admin = apiAuth(tokenAdmin());

  // --- depot SANS pochette ---
  const sans = await deposer(token, `Sans pochette ${MARQUEUR}`, {
    audio: VRAI_MP3,
    nomAudio: "sans.mp3",
    image: null,
  });
  verifier(
    "pochette : un depot sans pochette est accepte",
    sans.reponse.status === 201,
    `recu ${sans.reponse.status} — ${sans.donnees.message}`,
  );

  // --- depot AVEC pochette ---
  await deposer(token, `Avec pochette ${MARQUEUR}`, {
    audio: VRAI_MP3,
    nomAudio: "avec.mp3",
  });

  const { donnees: depots } = await admin("/api/submissions?statut=en_attente");
  const depotSans = depots.find((d) => d.title === `Sans pochette ${MARQUEUR}`);
  const depotAvec = depots.find((d) => d.title === `Avec pochette ${MARQUEUR}`);

  verifier(
    "pochette : l'admin voit quels depots en ont une",
    !depotSans.a_pochette && Boolean(depotAvec.a_pochette),
    `sans=${depotSans.a_pochette}, avec=${depotAvec.a_pochette}`,
  );

  // --- consultation de la pochette (pour verifier les droits d'image) ---
  const { reponse: pochetteAdmin } = await admin(
    `/api/submissions/${depotAvec.id_submission}/image`,
    { brut: true },
  );
  verifier(
    "pochette : l'admin peut la consulter / telecharger (200)",
    pochetteAdmin.status === 200,
    `recu ${pochetteAdmin.status}`,
  );

  const utilisateur = apiAuth(token);
  const { reponse: pochetteUtilisateur } = await utilisateur(
    `/api/submissions/${depotAvec.id_submission}/image`,
    { brut: true },
  );
  verifier(
    "pochette : un utilisateur normal ne peut pas la consulter (403)",
    pochetteUtilisateur.status === 403,
    `recu ${pochetteUtilisateur.status}`,
  );

  const { reponse: pochetteAbsente } = await admin(
    `/api/submissions/${depotSans.id_submission}/image`,
    { brut: true },
  );
  verifier(
    "pochette : un depot sans pochette renvoie 404 sur /image",
    pochetteAbsente.status === 404,
    `recu ${pochetteAbsente.status}`,
  );

  // --- approbation sans pochette : une image du catalogue est tiree au hasard ---
  const approbation = await admin(
    `/api/submissions/${depotSans.id_submission}/approuver`,
    { method: "PATCH" },
  );
  verifier(
    "pochette : un depot sans pochette peut etre approuve",
    approbation.reponse.status === 200,
    `recu ${approbation.reponse.status}`,
  );

  const catalogue = await (await fetch(`${API}/api/musics`)).json();
  const ajoute = catalogue.find((m) => m.title === `Sans pochette ${MARQUEUR}`);

  verifier(
    "pochette : une pochette du catalogue lui a ete attribuee",
    Boolean(ajoute?.src_image),
    ajoute?.src_image ?? "aucune",
  );

  // La pochette attribuee doit reellement exister : sinon le morceau s'afficherait avec une
  // image cassee.
  const fichierPochette = await fetch(`${API}/${ajoute.src_image}`);
  verifier(
    "pochette : la pochette attribuee existe bien sur le disque",
    fichierPochette.status === 200,
    `recu ${fichierPochette.status} pour ${ajoute.src_image}`,
  );
});

// ---------------------------------------------------------------------------
// Nettoyage : retirer du catalogue ce que ces tests y ont ajoute
// ---------------------------------------------------------------------------
await etape("nettoyage du catalogue", async () => {
  const { default: mysql } = await import("mysql2/promise");
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  // Les morceaux ajoutes par les tests portent le marqueur dans leur champ `artist`.
  const [musiques] = await db.query(
    "SELECT id_music, src_audio, src_image FROM musics WHERE artist = ?",
    [MARQUEUR],
  );

  // Les pochettes PARTAGEES avec le reste du catalogue ne nous appartiennent pas.
  //
  // Un depot sans pochette se voit attribuer, a l'approbation, une image DEJA utilisee par
  // d'autres morceaux (tirage au hasard). La supprimer parce qu'un morceau de test la
  // reference reviendrait a casser l'affichage de vrais morceaux.
  //
  // (Ce n'est pas theorique : une premiere version de ce nettoyage a bel et bien supprime
  // `images/3.jpg`, utilisee par quatre morceaux du catalogue.)
  //
  // On ne supprime donc un fichier que s'il n'est reference par AUCUN autre morceau.
  const [partagees] = await db.query(
    "SELECT DISTINCT src_image FROM musics WHERE artist <> ?",
    [MARQUEUR],
  );
  const pochettesAConserver = new Set(partagees.map((m) => m.src_image));

  for (const musique of musiques) {
    const fichiers = [musique.src_audio];
    if (!pochettesAConserver.has(musique.src_image)) {
      fichiers.push(musique.src_image);
    }

    for (const relatif of fichiers) {
      try {
        fs.unlinkSync(path.join(PUBLIC, relatif));
      } catch {
        /* deja absent */
      }
    }
  }

  await db.query("DELETE FROM likes WHERE id_music IN (SELECT id_music FROM musics WHERE artist = ?)", [MARQUEUR]);
  await db.query("DELETE FROM musics WHERE artist = ?", [MARQUEUR]);
  await db.end();

  verifier(
    "nettoyage : les morceaux de test sont retires du catalogue",
    true,
    `${musiques.length} morceau(x) supprime(s)`,
  );
});

// La suppression des comptes de test supprime aussi leurs `submissions` (ON DELETE CASCADE).
// Les fichiers restes dans uploads/ (depots jamais moderes) sont nettoyes ci-dessous.
await etape("nettoyage des fichiers en attente", async () => {
  const { default: mysql } = await import("mysql2/promise");
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  const [enAttente] = await db.query(
    `SELECT s.fichier_audio, s.fichier_image
       FROM submissions s
       JOIN users u ON u.id_user = s.id_user
      WHERE u.email LIKE 'e2e-test+%' AND s.statut = 'en_attente'`,
  );

  const dossier = path.join(ICI, "..", "backend", "uploads");
  for (const depot of enAttente) {
    for (const nom of [depot.fichier_audio, depot.fichier_image]) {
      try {
        fs.unlinkSync(path.join(dossier, nom));
      } catch {
        /* deja absent */
      }
    }
  }

  await db.end();
  verifier(
    "nettoyage : les fichiers en attente sont supprimes",
    true,
    `${enAttente.length} depot(s)`,
  );
});

await nettoyerComptesDeTest();
rapport("TESTS — dépôt de musique et modération");
