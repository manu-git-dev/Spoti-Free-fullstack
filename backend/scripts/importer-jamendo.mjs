#!/usr/bin/env node
//
// Construit le catalogue de Spoti-Free depuis l'API Jamendo.
//
// Usage :
//     JAMENDO_CLIENT_ID=xxxxx node scripts/importer-jamendo.mjs [--nombre 100]
//
// Ce script est un OUTIL JETABLE, pas du code applicatif. Il ne tourne ni en dev ni en prod :
// on le lance une fois pour fabriquer le catalogue, et son resultat (seed-musics.sql + les
// fichiers de public/) est ce qui compte ensuite.
//
// Il n'ecrit RIEN en base. Il genere `seed-musics.sql`, pour trois raisons :
//   - c'est ce fichier que rejoue la CI sur une base neuve ;
//   - un seed se relit, se versionne et se diffe ; un INSERT direct ne laisse aucune trace ;
//   - si l'import se passe mal, on n'a rien casse — il suffit de ne pas rejouer le seed.
//
// ---------------------------------------------------------------------------
// Pourquoi Jamendo
//
// Un demi-million de morceaux de vrais artistes independants, sous licences Creative Commons
// explicites, avec une API qui expose la licence de chaque morceau. C'est la seule facon
// d'avoir un catalogue avec de VRAIS titres et de VRAIS artistes qui soit legalement
// diffusable — par opposition a l'ancien catalogue de demonstration, qui affichait "Bohemian
// Rhapsody / Queen" sur un fichier de piano libre sans aucun rapport.
//
// Le droit de rehberger vient de la licence CC elle-meme, accordee par l'artiste a tout le
// monde : elle autorise la redistribution, a condition de crediter. L'API Jamendo sert a
// DECOUVRIR les morceaux ; la licence CC sert a les REDIFFUSER. Ce sont deux choses distinctes.
// ---------------------------------------------------------------------------

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { licenceDepuisUrlCC, urlDeLicence } from "../src/validation.js";

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOSSIER_AUDIO = path.join(RACINE, "public", "musiques");
const DOSSIER_IMAGES = path.join(RACINE, "public", "images");
const FICHIER_SEED = path.join(RACINE, "scripts", "seed-musics.sql");

const API = "https://api.jamendo.com/v3.0/tracks";
const PAR_PAGE = 200; // maximum autorise par l'API

const CLIENT_ID = process.env.JAMENDO_CLIENT_ID;

// --nombre 100
const indexNombre = process.argv.indexOf("--nombre");
const NOMBRE_VOULU =
  indexNombre !== -1 ? Number(process.argv[indexNombre + 1]) : 100;

if (!CLIENT_ID) {
  console.error(
    "JAMENDO_CLIENT_ID manquant.\n" +
      "Cree une application sur https://devportal.jamendo.com/ puis relance :\n" +
      "    JAMENDO_CLIENT_ID=ta_cle node scripts/importer-jamendo.mjs",
  );
  process.exit(1);
}

if (!Number.isInteger(NOMBRE_VOULU) || NOMBRE_VOULU < 1) {
  console.error("--nombre attend un entier positif.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Recuperation
//
// `ccnd=false` et `ccnc=false` ecartent les variantes ND (pas de modification) et NC (non
// commercial) : il ne reste que CC BY et CC BY-SA, le perimetre defini dans validation.js.
//
// `audiodownload_allowed` est verifie EN PLUS, morceau par morceau. Depuis 2021 l'API expose
// ce booleen : l'artiste peut autoriser la diffusion en streaming sans autoriser le
// telechargement par une application tierce. Comme on rapatrie les fichiers sur notre serveur,
// c'est bien le telechargement qui nous concerne. Le filtre de licence ne suffit donc pas.
// ---------------------------------------------------------------------------
async function recupererPage(offset) {
  const parametres = new URLSearchParams({
    client_id: CLIENT_ID,
    format: "json",
    limit: String(PAR_PAGE),
    offset: String(offset),
    // Les plus ecoutes d'abord : a licence egale, autant prendre les meilleurs morceaux.
    order: "popularity_total",
    ccnd: "false",
    ccnc: "false",
    // Un morceau sans pochette ni audio n'est pas exploitable ; on limite le bruit en amont.
    imagesize: "600",
  });

  const reponse = await fetch(`${API}/?${parametres}`);

  if (!reponse.ok) {
    throw new Error(`Jamendo a repondu ${reponse.status} ${reponse.statusText}`);
  }

  const { headers, results } = await reponse.json();

  // L'API renvoie 200 OK avec un statut d'erreur DANS le corps (cle invalide, quota depasse).
  // Sans cette verification, on croirait juste que le catalogue est vide.
  if (headers?.status !== "success") {
    throw new Error(
      `Jamendo a refuse la requete : ${headers?.error_message ?? "raison inconnue"}`,
    );
  }

  return results ?? [];
}

function utilisable(morceau) {
  return (
    morceau.audiodownload_allowed === true &&
    Boolean(morceau.audiodownload) &&
    Boolean(morceau.image) &&
    Boolean(morceau.name?.trim()) &&
    Boolean(morceau.artist_name?.trim()) &&
    Number(morceau.duration) > 0 &&
    // La garantie juridique : si la licence n'est pas dans notre perimetre, on ne prend pas,
    // quels qu'aient ete les filtres demandes a l'API.
    licenceDepuisUrlCC(morceau.license_ccurl) !== null
  );
}

async function telecharger(url, destination) {
  // Deterministe : si le fichier est deja la, on ne le retelecharge pas. Le script devient
  // rejouable sans refaire 400 Mo de trafic a chaque essai.
  try {
    await fs.access(destination);
    return false; // deja present
  } catch {
    // absent : on telecharge
  }

  const reponse = await fetch(url);
  if (!reponse.ok) {
    throw new Error(`${reponse.status} sur ${url}`);
  }

  await fs.writeFile(destination, Buffer.from(await reponse.arrayBuffer()));
  return true;
}

const echapper = (valeur) =>
  valeur === null || valeur === undefined
    ? "NULL"
    : `'${String(valeur).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;

function genererSeed(morceaux) {
  const lignes = morceaux
    .map((m, index) =>
      [
        index + 1,
        echapper(m.title),
        echapper(m.artist),
        echapper(m.genre),
        echapper(m.srcImage),
        echapper(m.srcAudio),
        m.duration,
        0, // play_count : un catalogue neuf n'a aucune ecoute
        echapper(m.licence),
        echapper(m.licenceUrl),
        echapper(m.sourceUrl),
      ].join(","),
    )
    .map((valeurs) => `  (${valeurs})`)
    .join(",\n");

  return `-- Catalogue de Spoti-Free — ${morceaux.length} morceaux sous licence Creative Commons.
--
-- GENERE par scripts/importer-jamendo.mjs. Ne pas editer a la main : relancer le script.
--
-- A rejouer APRES schema.sql, sur une base neuve :
--     mysql -u root -p spotifree < backend/scripts/seed-musics.sql
--
-- Ne contient QUE les metadonnees des morceaux. Aucun utilisateur, aucun like, aucune visite :
-- ce sont des donnees personnelles, elles ne vont pas dans Git.
--
-- Les fichiers audio et les pochettes vivent dans backend/public/, qui est gitignore (poids).
-- Sans eux, les morceaux s'affichent mais ne se lisent pas. Deux facons de les obtenir :
--   - les rapatrier depuis Jamendo : JAMENDO_CLIENT_ID=xxx node scripts/importer-jamendo.mjs
--   - en fabriquer des factices pour les tests : node tests/preparer-medias.mjs
--
-- Chaque morceau porte sa licence et un lien vers son original : CC BY *exige* l'attribution,
-- et l'app l'affiche sur la fiche du morceau. Ces colonnes ne sont pas decoratives, elles sont
-- la condition du droit de diffusion.

-- Le catalogue precedent etait un jeu de demonstration : de vrais titres d'artistes celebres
-- poses sur cinq fichiers libres recycles. Il ne pouvait pas etre mis en ligne. On le remplace
-- integralement. La suppression fait tomber en cascade les likes et les entrees de playlists
-- qui le referencaient — c'est voulu : ils pointaient vers des morceaux qui n'ont jamais existe.
DELETE FROM \`musics\`;
ALTER TABLE \`musics\` AUTO_INCREMENT = 1;

INSERT INTO \`musics\`
  (\`id_music\`, \`title\`, \`artist\`, \`genre\`, \`src_image\`, \`src_audio\`, \`duration\`,
   \`play_count\`, \`licence\`, \`licence_url\`, \`source_url\`)
VALUES
${lignes};
`;
}

async function principal() {
  await fs.mkdir(DOSSIER_AUDIO, { recursive: true });
  await fs.mkdir(DOSSIER_IMAGES, { recursive: true });

  console.log(`Recherche de ${NOMBRE_VOULU} morceaux CC BY / CC BY-SA...`);

  const retenus = [];
  let offset = 0;
  let examines = 0;

  while (retenus.length < NOMBRE_VOULU) {
    const page = await recupererPage(offset);

    if (page.length === 0) {
      console.warn(
        `\nL'API n'a plus de resultats apres ${examines} morceaux examines.`,
      );
      break;
    }

    examines += page.length;
    offset += page.length;

    for (const morceau of page) {
      if (retenus.length >= NOMBRE_VOULU) break;
      if (!utilisable(morceau)) continue;

      const licence = licenceDepuisUrlCC(morceau.license_ccurl);

      // Nom de fichier deterministe base sur l'identifiant Jamendo, plutot qu'un UUID : le
      // script se rejoue sans retelecharger, et un fichier manquant se diagnostique en lisant
      // son nom. (Les fichiers deposes par les utilisateurs, eux, gardent un UUID : leur nom
      // vient d'une source non fiable — voir submissionRoute.js.)
      const nomAudio = `jamendo-${morceau.id}.mp3`;
      const nomImage = `jamendo-${morceau.id}.jpg`;

      try {
        await telecharger(morceau.audiodownload, path.join(DOSSIER_AUDIO, nomAudio));
        await telecharger(morceau.image, path.join(DOSSIER_IMAGES, nomImage));
      } catch (erreur) {
        // Un morceau qui ne se telecharge pas n'est pas une raison d'interrompre l'import :
        // on le passe, il en reste 499 999.
        console.warn(`  ! ${morceau.name} ignore (${erreur.message})`);
        continue;
      }

      retenus.push({
        title: morceau.name.trim().slice(0, 100),
        artist: morceau.artist_name.trim().slice(0, 100),
        // `musicinfo` n'est renvoye que sur demande ; sans lui on n'a pas de genre fiable.
        // NULL est plus honnete qu'un genre invente.
        genre: null,
        srcImage: `images/${nomImage}`,
        srcAudio: `musiques/${nomAudio}`,
        duration: Number(morceau.duration),
        licence,
        licenceUrl: urlDeLicence(licence),
        sourceUrl: morceau.shareurl ?? null,
      });

      process.stdout.write(`\r  ${retenus.length}/${NOMBRE_VOULU} morceaux`);
    }
  }

  console.log("");

  if (retenus.length === 0) {
    console.error("Aucun morceau retenu : le seed n'a pas ete touche.");
    process.exit(1);
  }

  await fs.writeFile(FICHIER_SEED, genererSeed(retenus));

  const parLicence = retenus.reduce((compte, m) => {
    compte[m.licence] = (compte[m.licence] ?? 0) + 1;
    return compte;
  }, {});

  console.log(`\n${retenus.length} morceaux retenus sur ${examines} examines.`);
  for (const [licence, nombre] of Object.entries(parLicence)) {
    console.log(`  ${licence.padEnd(14)} ${nombre}`);
  }
  console.log(`\nSeed ecrit dans scripts/seed-musics.sql`);
  console.log(`Fichiers telecharges dans public/musiques et public/images`);
  console.log(`\nPour l'appliquer :`);
  console.log(`    mysql -u root -p spotifree < scripts/seed-musics.sql`);
}

principal().catch((erreur) => {
  console.error(`\nEchec de l'import : ${erreur.message}`);
  process.exit(1);
});
