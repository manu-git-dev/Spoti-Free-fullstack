#!/usr/bin/env node
//
// Construit le catalogue de Spoti-Free depuis l'API Jamendo.
//
// Usage (depuis backend/, avec JAMENDO_CLIENT_ID dans le .env) :
//     node scripts/importer-jamendo.mjs [--nombre 100]
//
// La cle se cree sur https://devportal.jamendo.com/. Elle vit dans `backend/.env` comme le reste
// de la configuration — pas sur la ligne de commande, ou elle finirait dans l'historique du shell.
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

import "dotenv/config";
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

// Nombre d'essais sur un MEME offset avant de conclure que le catalogue est epuise.
// Voir le commentaire de `recupererPage()` : l'API rend des pages vides au hasard.
const TENTATIVES_PAGE = 4;

const CLIENT_ID = process.env.JAMENDO_CLIENT_ID;

// --nombre 100
const indexNombre = process.argv.indexOf("--nombre");
const NOMBRE_VOULU =
  indexNombre !== -1 ? Number(process.argv[indexNombre + 1]) : 100;

if (!CLIENT_ID) {
  console.error(
    "JAMENDO_CLIENT_ID manquant.\n" +
      "Cree une application sur https://devportal.jamendo.com/, puis ajoute dans backend/.env :\n" +
      "    JAMENDO_CLIENT_ID=ta_cle",
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
async function appelerApi(offset) {
  const parametres = new URLSearchParams({
    client_id: CLIENT_ID,
    format: "json",
    limit: String(PAR_PAGE),
    offset: String(offset),
    // Les plus ecoutes d'abord : a licence egale, autant prendre les meilleurs morceaux.
    order: "popularity_total",

    // ---------------------------------------------------------------------
    // Le filtre juridique. `0` et non `false` : les deux semblent fonctionner, mais seul `0`
    // a ete verifie contre l'API reelle (voir plus bas).
    //
    // ATTENTION au sens exact de ces deux drapeaux — c'est contre-intuitif :
    //   `ccnd=0` seul   -> ecarte les ND, mais laisse passer TOUT le NC (by-nc, by-nc-sa).
    //   `ccnd=0 ccnc=0` -> ne laisse que `by` et `by-sa`. C'est ce qu'on veut.
    //
    // Verifie en interrogeant reellement l'API sur 250 morceaux : le couple ne renvoie que
    // `by/3.0`, `by-sa/3.0` et `by-sa/2.5`. Zero NC, zero ND.
    // ---------------------------------------------------------------------
    ccnd: "0",
    ccnc: "0",

    // Un morceau sans pochette ni audio n'est pas exploitable ; on limite le bruit en amont.
    imagesize: "600",

    // ---------------------------------------------------------------------
    // `include` : DEUX champs vitaux qui ne sont PAS renvoyes par defaut.
    //
    //   `licenses`  -> `license_ccurl`. Sans lui, la licence est absente et `utilisable()`
    //                  rejetterait 100 % des morceaux. C'est la garantie juridique.
    //   `musicinfo` -> `tags.genres`. Sans lui, les 100 morceaux arrivent avec `genre` a NULL.
    //
    // LE PIEGE : la doc note le separateur `+` (`include=licenses+musicinfo`). Mais dans une
    // URL, `+` signifie ESPACE — et `URLSearchParams` encode un `+` litteral en `%2B`, que
    // l'API ne comprend pas. Elle ne renvoie alors AUCUNE erreur : elle rend simplement les
    // deux champs vides, en repondant "success". On ecrit donc une vraie espace, et
    // `URLSearchParams` la transforme en `+` — ce que l'API attend.
    // ---------------------------------------------------------------------
    include: "licenses musicinfo",

    // UN SEUL morceau par artiste.
    //
    // Sans ca, "les 100 plus ecoutes" donne surtout les quelques artistes les plus populaires de
    // Jamendo, avec sept ou huit titres chacun. Un catalogue ou le meme nom revient sans arret
    // fait pauvre — alors que 100 artistes differents donnent tout de suite l'impression d'un
    // vrai service. C'est une decision de VITRINE, pas une contrainte technique.
    groupby: "artist_id",
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

// ---------------------------------------------------------------------------
// Une page, avec insistance.
//
// L'API renvoie regulierement une page VIDE sans la moindre erreur : `status: "success"`,
// `code: 0`, `error_message: ""`, `results: []`. Mesure sur des appels identiques repetes : une
// a trois pages sur six reviennent vides, au hasard. Rien dans la reponse ne permet de
// distinguer ce hoquet d'une vraie fin de catalogue.
//
// C'est le genre de defaut qui ne se voit pas : la version precedente s'arretait a la premiere
// page vide, donc elle aurait annonce fierement "import termine" avec 12 morceaux sur 100, sans
// erreur ni avertissement.
//
// On reessaie donc le MEME offset plusieurs fois avant de conclure. Si la page est encore vide
// apres tout ca, c'est qu'on est vraiment au bout.
// ---------------------------------------------------------------------------
async function recupererPage(offset) {
  for (let tentative = 1; tentative <= TENTATIVES_PAGE; tentative++) {
    const resultats = await appelerApi(offset);
    if (resultats.length > 0) return resultats;

    if (tentative < TENTATIVES_PAGE) {
      // Une pause qui s'allonge : si le vide vient d'une limitation de debit, insister
      // immediatement ne ferait que l'entretenir.
      await new Promise((resoudre) => setTimeout(resoudre, 400 * tentative));
    }
  }

  return [];
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

// L'API rend ses textes ENCODES POUR LE HTML : « Ground &amp; Leaves », « Axl &amp; Arth ».
//
// React, lui, echappe tout ce qu'il affiche — c'est sa protection contre les injections. Il
// afficherait donc litteralement « Ground &amp; Leaves », esperluette et point-virgule compris.
// Le probleme n'est pas dans React : c'est la valeur qu'on lui donne qui est deja encodee, une
// fois de trop.
//
// On decode donc a l'ENTREE, au moment ou la donnee quitte l'API — pas a l'affichage. Une base
// doit contenir du texte, pas du HTML : sinon chaque endroit qui lit `artist` (le lecteur, la
// recherche, l'export, un futur flux RSS) devrait re-decoder pour son compte, et l'un d'eux
// oubliera.
//
// Le jeu d'entites est volontairement limite a ce que l'API produit reellement. Une regex
// generique sur `&\w+;` transformerait un vrai « &amp; » tape par un artiste en autre chose.
function decoderEntites(texte) {
  if (typeof texte !== "string") return texte;

  return texte
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    // `&amp;` EN DERNIER : sinon « &amp;lt; » (une esperluette litterale suivie de "lt;")
    // deviendrait « &lt; » puis « < ». On decode toujours l'esperluette apres les autres.
    .replace(/&amp;/g, "&");
}

// ---------------------------------------------------------------------------
// Les familles de genres
//
// POURQUOI CETTE TABLE EXISTE
// Jamendo n'a pas des genres, il a des TAGS : 66 valeurs distinctes rencontrees sur 400
// morceaux, dont une longue traine a une seule occurrence (`bossanova`, `rockabilly`, `8bit`,
// `waltz`, `manouche`…). Prendre le tag tel quel donnait un catalogue a 25 genres dont 14 avec
// UN seul morceau, etiquetes avec des slugs bruts : « Rnb », « Edm », « Alternativehiphop »,
// « Singersongwriter ».
//
// Un filtre a 25 entrees dont 14 mènent a un seul titre est pire que pas de filtre : il ouvre
// des placards, pas des portes. On replie donc les tags sur une dizaine de familles reelles.
//
// C'est de la CURATION, pas de la technique : les frontieres sont discutables (le funk avec la
// soul, le blues avec le jazz). C'est assume. Ce qui compte, c'est qu'aucune famille ne soit
// vide et qu'aucun libelle ne ressemble a un identifiant machine.
//
// La table est batie sur les tags REELLEMENT rencontres (mesures via l'API), pas sur ce qu'on
// imagine du vocabulaire de Jamendo.
// ---------------------------------------------------------------------------
const FAMILLES_DE_GENRES = {
  Pop: ["pop", "indiepop", "electropop", "adultcontemporary"],
  Rock: [
    "rock", "indierock", "alternativerock", "postrock", "surfrock",
    "electrorock", "poprock", "punk", "postpunk", "newwave", "rockabilly",
    "garage", "grunge", "metal", "hardcore",
  ],
  Electro: [
    "electronic", "electronica", "house", "deephouse", "dance", "edm",
    "dubstep", "futurebass", "breakbeat", "drumnbass", "techno", "trance",
    "electrofunk", "8bit",
  ],
  "Hip-hop": ["hiphop", "rap", "alternativehiphop", "trap", "triphop"],
  Jazz: ["jazz", "acidjazz", "jazzfusion", "jazzfunk", "swing", "manouche", "gypsy", "blues"],
  Folk: ["folk", "singersongwriter", "country", "chansonfrancaise", "acoustic"],
  Soul: ["soul", "rnb", "funk", "disco"],
  Reggae: ["reggae", "ska", "dub"],
  Chill: ["ambient", "chillout", "chillhop", "downtempo", "newage", "easylistening", "lounge"],
  World: ["world", "latin", "bossanova", "samba", "bachata"],
};

// Index inverse : tag -> famille. Construit une fois, pour ne pas reparcourir la table a chaque
// morceau.
const FAMILLE_PAR_TAG = new Map(
  Object.entries(FAMILLES_DE_GENRES).flatMap(([famille, tags]) =>
    tags.map((tag) => [tag, famille]),
  ),
);

// Les tags qu'on n'a PAS su classer, pour les afficher en fin d'import.
// Un import qui perd de l'information en silence est un import qu'on ne peut pas ameliorer :
// c'est en voyant « filmscore (4) » qu'on decide, en connaissance de cause, d'ajouter une
// famille ou de laisser tomber.
const tagsInconnus = new Map();

// Le genre d'un morceau, replie sur sa famille.
//
// On PARCOURT le tableau au lieu de prendre `genres[0]` : le premier tag n'est pas toujours le
// plus parlant. Un morceau tague ["indie", "pop"] rend « Pop » — alors que `genres[0]` aurait
// rendu « Indie », qui n'est pas un genre mais une posture, et qui ne dit pas si on a affaire a
// du rock ou de la pop. `indie` et `experimental` sont donc volontairement ABSENTS de la table :
// on les ignore pour tomber sur le tag suivant, plus precis.
//
// Aucun tag reconnu -> NULL. La colonne est nullable, et un genre invente serait pire qu'un
// genre absent.
function genreDe(morceau) {
  const genres = morceau.musicinfo?.tags?.genres;
  if (!Array.isArray(genres)) return null;

  for (const brut of genres) {
    const tag = String(brut).trim().toLowerCase();
    if (tag === "") continue;

    const famille = FAMILLE_PAR_TAG.get(tag);
    if (famille) return famille;

    tagsInconnus.set(tag, (tagsInconnus.get(tag) ?? 0) + 1);
  }

  return null;
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
      // `recupererPage` a deja insiste TENTATIVES_PAGE fois sur cet offset : le catalogue est
      // reellement epuise, ce n'est pas un hoquet de l'API.
      console.warn(
        `\nPlus de resultats apres ${examines} morceaux examines ` +
          `(${retenus.length} retenus). Le catalogue Jamendo correspondant aux criteres est epuise.`,
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
        // `decoder` AVANT `slice` : « &amp; » fait 5 caracteres, « & » en fait 1. Tronquer
        // d'abord risquerait de couper une entite en deux et de laisser « &am » dans la base.
        title: decoderEntites(morceau.name).trim().slice(0, 100),
        artist: decoderEntites(morceau.artist_name).trim().slice(0, 100),
        genre: genreDe(morceau),
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

  const parGenre = retenus.reduce((compte, m) => {
    const cle = m.genre ?? "(sans genre)";
    compte[cle] = (compte[cle] ?? 0) + 1;
    return compte;
  }, {});

  console.log(`\n${retenus.length} morceaux retenus sur ${examines} examines.`);

  console.log(`\nLicences :`);
  for (const [licence, nombre] of Object.entries(parLicence)) {
    console.log(`  ${licence.padEnd(14)} ${nombre}`);
  }

  console.log(`\nGenres :`);
  for (const [genre, nombre] of Object.entries(parGenre).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${genre.padEnd(14)} ${nombre}`);
  }

  // Les tags qu'on n'a pas su classer. Ce n'est pas une erreur : la longue traine de Jamendo
  // (`waltz`, `8bit`, `bossanova`…) n'a pas vocation a devenir une famille. Mais si l'un d'eux
  // revient souvent, c'est le signe qu'il en manque une — et on ne peut le voir que si le
  // script le dit.
  if (tagsInconnus.size > 0) {
    const liste = [...tagsInconnus]
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `${tag} (${n})`)
      .join(", ");
    console.log(
      `\nTags non classes, ignores — a ajouter a FAMILLES_DE_GENRES s'ils reviennent souvent :\n  ${liste}`,
    );
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
