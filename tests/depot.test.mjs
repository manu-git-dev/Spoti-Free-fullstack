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

import {
  API,
  creerCompte,
  creerAdmin,
  apiAuth,
  verifier,
  etape,
  rapport,
  nettoyerComptesDeTest,
} from "./utils.mjs";

const ICI = path.dirname(url.fileURLToPath(import.meta.url));
const FIXTURES = path.join(ICI, "fixtures");

// `backend/public/` : la ou l'approbation d'un depot DEPLACE le fichier (uploads/ -> public/).
// Utilise UNIQUEMENT par le nettoyage de fin de suite, pour effacer les fichiers des morceaux
// de test approuves. On ne LIT jamais de media ici (les medias de test viennent des FIXTURES,
// voir ci-dessous) — on ne fait qu'y supprimer ce que ces tests y ont depose.
const PUBLIC = path.join(ICI, "..", "backend", "public");

// Les medias viennent des FIXTURES, pas de `backend/public/` (qui est gitignore).
// Un test qui depend d'un fichier absent du depot ne peut pas tourner ailleurs que sur la
// machine de son auteur — c'est precisement ce que la CI doit interdire.
//
// `audio-test.mp3` est un vrai MP3 (des trames MPEG valides), mais SILENCIEUX : `music-metadata`
// y lit bien une duree, donc le backend l'accepte comme de l'audio — et il est libre de tout
// droit, contrairement aux morceaux du catalogue.
const VRAI_MP3 = fs.readFileSync(path.join(FIXTURES, "audio-test.mp3"));
const VRAIE_IMAGE = fs.readFileSync(path.join(FIXTURES, "pochette-test.jpg"));

// Marqueur pour retrouver et nettoyer ce que ces tests creent dans le catalogue.
const MARQUEUR = `__depot-test-${Date.now()}`;

/** Construit un envoi multipart (comme le ferait le formulaire du navigateur). */
function formulaireDepot(
  titre,
  {
    audio,
    nomAudio,
    image = VRAIE_IMAGE,
    // La declaration de droits est obligatoire : par defaut on envoie un depot conforme, et
    // les tests qui verifient le REFUS surchargent ces deux valeurs.
    licence = "CC BY 4.0",
    droitsConfirmes = "true",
    // Le genre est une liste fermee (GENRES) : par defaut on envoie une valeur valide, et le test
    // du REFUS surcharge celle-ci. Avant, ce helper envoyait "Test" — un genre invente, que le
    // serveur acceptait faute de garde-fou.
    genre = "Pop",
  },
) {
  const donnees = new FormData();
  donnees.append("title", titre);
  donnees.append("artist", MARQUEUR);
  if (genre !== null) donnees.append("genre", genre);
  donnees.append("audio", new Blob([audio]), nomAudio);
  // `image: null` = depot SANS pochette (elle est facultative).
  if (image) donnees.append("image", new Blob([image]), "cover.jpg");
  if (licence !== null) donnees.append("licence", licence);
  donnees.append("droitsConfirmes", droitsConfirmes);
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

// Un VRAI compte admin, cree pour ces tests puis supprime avec les autres.
//
// Avant, on forgeait un jeton pour `id_user: 10` / `admin@admin.fr` — un compte qui n'existait que
// dans la base de developpement de cette machine. Sur une base neuve (la CI), `adminMiddleware` ne
// trouvait personne et repondait 403 : les tests etaient injouables ailleurs. C'est la CI qui a
// revele cette dependance cachee.
const { token: JETON_ADMIN } = await creerAdmin("DepotAdmin");

function tokenAdmin() {
  return JETON_ADMIN;
}

// ---------------------------------------------------------------------------
// 0. La declaration de droits
//
// Le formulaire React coche `required` sur la case et n'offre que des licences valides dans son
// menu — mais ces tests passent par l'API DIRECTEMENT, comme le ferait n'importe qui avec curl.
// C'est tout l'interet : ils verifient la barriere qui protege reellement, pas celle qui decore.
// ---------------------------------------------------------------------------
await etape("declaration de droits", async () => {
  const { token } = await creerCompte("DepotDroits");

  const sansCertification = await deposer(token, "Sans certification", {
    audio: VRAI_MP3,
    nomAudio: "audio.mp3",
    droitsConfirmes: "false",
  });
  verifier(
    "depot : un depot sans certification de droits est REJETE (400)",
    sansCertification.reponse.status === 400,
    `recu ${sansCertification.reponse.status}`,
  );

  const sansLicence = await deposer(token, "Sans licence", {
    audio: VRAI_MP3,
    nomAudio: "audio.mp3",
    licence: null,
  });
  verifier(
    "depot : un depot sans licence est REJETE (400)",
    sansLicence.reponse.status === 400,
    `recu ${sansLicence.reponse.status}`,
  );

  // Le perimetre est volontairement restreint a CC BY et CC BY-SA : les variantes NC et ND
  // sont refusees meme si elles ressemblent a une licence libre.
  const licenceHorsPerimetre = await deposer(token, "Licence ND", {
    audio: VRAI_MP3,
    nomAudio: "audio.mp3",
    licence: "CC BY-NC-ND 4.0",
  });
  verifier(
    "depot : une licence hors perimetre (NC/ND) est REJETEE (400)",
    licenceHorsPerimetre.reponse.status === 400,
    `recu ${licenceHorsPerimetre.reponse.status}`,
  );

  // Le <select> du formulaire ne propose que GENRES — mais un appel direct a l'API ne passe pas
  // par le formulaire. Sans garde-fou serveur, ce depot approuve creerait une pastille "Trap"
  // menant a UN morceau dans la Bibliotheque.
  const genreInvente = await deposer(token, "Genre invente", {
    audio: VRAI_MP3,
    nomAudio: "audio.mp3",
    genre: "Trap",
  });
  verifier(
    "depot : un genre hors de la liste fermee est REJETE (400)",
    genreInvente.reponse.status === 400,
    `recu ${genreInvente.reponse.status}`,
  );

  // Le pendant du test precedent : le genre reste FACULTATIF (9 morceaux du catalogue n'en ont
  // pas). Fermer la liste ne doit pas rendre le champ obligatoire.
  const sansGenre = await deposer(token, "Sans genre", {
    audio: VRAI_MP3,
    nomAudio: "audio.mp3",
    genre: null,
  });
  verifier(
    "depot : un depot SANS genre reste accepte (201)",
    sansGenre.reponse.status === 201,
    `recu ${sansGenre.reponse.status}`,
  );

  // `source_url` finit dans un href affiche a tous les visiteurs : une URL `javascript:`
  // s'executerait au clic. Le refus doit venir du SERVEUR, pas du type="url" du formulaire.
  const sourceMalveillante = await fetch(`${API}/api/submissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: (() => {
      const donnees = formulaireDepot("Source XSS", {
        audio: VRAI_MP3,
        nomAudio: "audio.mp3",
      });
      donnees.append("sourceUrl", "javascript:alert(document.cookie)");
      return donnees;
    })(),
  });
  verifier(
    "depot : une source `javascript:` est REJETEE (400)",
    sourceMalveillante.status === 400,
    `recu ${sourceMalveillante.status}`,
  );
});

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
// 3 bis. Un morceau retire du catalogue APRES approbation
//
// Non-regression d'un cas vu en production le 2026-07-21 : le depot restait marque « approuve »
// alors que son morceau avait ete supprime, et « Mes depots » annoncait au deposant qu'il le
// retrouverait dans la Bibliotheque. Il n'y etait plus.
//
// Ce que ce test verrouille, c'est le CHOIX de conception : on ne remplace pas le statut par un
// `retire` (ca effacerait le fait que l'approbation a eu lieu), on garde `approuve` et on laisse
// la cle etrangere `submissions.id_music` (ON DELETE SET NULL) porter l'etat courant. Si un jour
// quelqu'un remplace la FK par une simple colonne applicative, ce test devient rouge.
// ---------------------------------------------------------------------------
await etape("moderation : un morceau retire garde son depot approuve", async () => {
  const { token } = await creerCompte("DepotRetire");
  await deposer(token, `A retirer ${MARQUEUR}`, {
    audio: VRAI_MP3,
    nomAudio: "c.mp3",
  });

  const admin = apiAuth(tokenAdmin());
  const { donnees: enAttente } = await admin(
    "/api/submissions?statut=en_attente",
  );
  const depot = enAttente.find((d) => d.title === `A retirer ${MARQUEUR}`);

  await admin(`/api/submissions/${depot.id_submission}/approuver`, {
    method: "PATCH",
  });

  const utilisateur = apiAuth(token);
  const { donnees: avant } = await utilisateur("/api/submissions/mes-depots");
  const lieAuMorceau = avant.find((d) => d.title === `A retirer ${MARQUEUR}`);
  verifier(
    "retrait : l'approbation enregistre le morceau cree (id_music)",
    lieAuMorceau?.statut === "approuve" && Number(lieAuMorceau?.id_music) > 0,
    JSON.stringify({
      statut: lieAuMorceau?.statut,
      id_music: lieAuMorceau?.id_music,
    }),
  );

  // On retire le morceau du catalogue, par la vraie route d'administration.
  const suppression = await admin(
    `/api/musics/delete/${lieAuMorceau.id_music}`,
    { method: "DELETE" },
  );
  verifier(
    "retrait : le morceau est supprime du catalogue (200)",
    suppression.reponse.status === 200,
    `recu ${suppression.reponse.status}`,
  );

  const { donnees: apres } = await utilisateur("/api/submissions/mes-depots");
  const retire = apres.find((d) => d.title === `A retirer ${MARQUEUR}`);
  verifier(
    "retrait : le depot reste `approuve` (l'historique n'est pas reecrit)",
    retire?.statut === "approuve",
    `statut = ${retire?.statut}`,
  );
  verifier(
    "retrait : MySQL a defait le lien tout seul (id_music a NULL)",
    retire?.id_music === null,
    `id_music = ${JSON.stringify(retire?.id_music)}`,
  );
});

// ---------------------------------------------------------------------------
// 4. La pochette est OBLIGATOIRE
//
// Un depot sans pochette est refuse des l'envoi (400). Avant, il etait accepte, et l'approbation
// lui attribuait une image DEJA au catalogue tiree au hasard — la pochette d'un AUTRE artiste,
// affichee sous un nom qui n'est pas le sien (fausse attribution). L'admin doit aussi pouvoir
// CONSULTER la pochette d'un depot avant de l'approuver (pour verifier les droits d'image).
// ---------------------------------------------------------------------------
await etape("pochette obligatoire", async () => {
  const { token } = await creerCompte("DepotPochette");
  const admin = apiAuth(tokenAdmin());

  // --- depot SANS pochette : REFUSE ---
  const sans = await deposer(token, `Sans pochette ${MARQUEUR}`, {
    audio: VRAI_MP3,
    nomAudio: "sans.mp3",
    image: null,
  });
  verifier(
    "pochette : un depot SANS pochette est refuse (400)",
    sans.reponse.status === 400,
    `recu ${sans.reponse.status} — ${sans.donnees.message}`,
  );

  // --- depot AVEC pochette : accepte ---
  const avec = await deposer(token, `Avec pochette ${MARQUEUR}`, {
    audio: VRAI_MP3,
    nomAudio: "avec.mp3",
  });
  verifier(
    "pochette : un depot AVEC pochette est accepte (201)",
    avec.reponse.status === 201,
    `recu ${avec.reponse.status} — ${avec.donnees.message}`,
  );

  const { donnees: depots } = await admin("/api/submissions?statut=en_attente");
  const depotAvec = depots.find((d) => d.title === `Avec pochette ${MARQUEUR}`);

  verifier(
    "pochette : l'admin voit que le depot en a une",
    Boolean(depotAvec?.a_pochette),
    `a_pochette=${depotAvec?.a_pochette}`,
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
});

// ---------------------------------------------------------------------------
// 4bis. Approuver un vieux depot sans pochette est refuse (409)
//
// La pochette est desormais obligatoire A L'ENVOI, mais un depot ANTERIEUR a cette regle peut
// encore etre en attente sans image. On ne peut plus lui en inventer une (le tirage au hasard a
// ete retire, `musics.src_image` est NOT NULL) : l'approbation doit le refuser proprement, AVANT
// de deplacer le moindre fichier. On fabrique ce cas en inserant le depot directement en base
// (l'API ne permet plus de le creer), avec une licence valide pour atteindre le garde-fou pochette.
// ---------------------------------------------------------------------------
await etape("approbation d'un depot sans pochette (ancien) refusee", async () => {
  const { user } = await creerCompte("DepotSansPochetteLegacy");
  const admin = apiAuth(tokenAdmin());

  const { default: mysql } = await import("mysql2/promise");
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  const [resultat] = await db.query(
    `INSERT INTO submissions
       (id_user, title, artist, genre, fichier_audio, fichier_image, duration,
        licence, source_url, droits_confirmes_at, statut)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?, NULL, NOW(), 'en_attente')`,
    [
      user.id_user,
      `Legacy sans pochette ${MARQUEUR}`,
      MARQUEUR,
      "Pop",
      "legacy-sans-pochette.mp3",
      120,
      "CC BY 4.0",
    ],
  );
  await db.end();

  const approbation = await admin(
    `/api/submissions/${resultat.insertId}/approuver`,
    { method: "PATCH" },
  );
  verifier(
    "approbation : un depot sans pochette est refuse (409)",
    approbation.reponse.status === 409,
    `recu ${approbation.reponse.status} — ${approbation.donnees.message}`,
  );

  // Le garde-fou agit AVANT tout deplacement : le depot doit rester en_attente, jamais a moitie
  // publie (audio deplace, mais pas d'entree en base).
  const { donnees: apres } = await admin("/api/submissions?statut=en_attente");
  const encoreLa = apres.find((d) => d.id_submission === resultat.insertId);
  verifier(
    "approbation : le depot refuse reste en attente",
    Boolean(encoreLa),
    encoreLa ? "toujours en_attente" : "disparu",
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
      } catch (erreur) {
        // On n'ignore QUE "le fichier n'existe pas" (ENOENT). Tout le reste (chemin faux,
        // permission, variable non definie...) doit remonter : c'est un catch vide comme
        // celui-ci qui a masque pendant des semaines une ReferenceError sur PUBLIC, laissant
        // les fichiers approuves s'accumuler en orphelins dans public/.
        if (erreur.code !== "ENOENT") throw erreur;
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
