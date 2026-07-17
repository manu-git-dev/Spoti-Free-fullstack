// Supprime les fichiers medias qui ne sont plus references par AUCUNE ligne de la base.
//
// POURQUOI CE SCRIPT EXISTE
// Les tests de depot approuvent des morceaux : l'approbation DEPLACE le fichier de `uploads/`
// vers `public/` et insere une ligne dans `musics`. Le nettoyage de fin de suite supprime la
// ligne et devrait supprimer le fichier avec elle. Un bug (une variable non definie, avalee
// par un `catch` vide) l'en a empeche pendant des semaines : des dizaines de fichiers se sont
// accumules dans `public/musiques/`, references par aucun morceau. Le bug est corrige, mais
// les orphelins deja la ne portent ni marqueur de test ni ligne en base — seul un balayage
// "fichier non reference" peut les retrouver. Ce script est ce balayage, et resservira apres
// n'importe quelle campagne de tests, sur n'importe quelle machine.
//
// LA REGLE DE SECURITE DU PROJET : on ne supprime jamais un fichier a l'aveugle (les pochettes
// sont mutualisees entre morceaux). Ici on ne supprime QUE ce qu'AUCUNE ligne ne reference —
// sur par construction : un fichier reference n'est, par definition, pas un orphelin.
//
// Par defaut : DRY-RUN (liste seulement, ne supprime rien). Ajouter `--supprimer` pour effacer.
//
//   cd backend
//   node scripts/nettoyer-medias-orphelins.mjs              # liste les orphelins
//   node scripts/nettoyer-medias-orphelins.mjs --supprimer  # les efface

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ICI, "..", "public");
const UPLOADS = path.join(ICI, "..", "uploads");
const RACINE = path.join(ICI, ".."); // pour afficher des chemins lisibles

const SUPPRIMER = process.argv.includes("--supprimer");

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// L'ensemble des chemins references par le catalogue. `src_audio` vaut "musiques/x.mp3" et
// `src_image` "images/y.jpg" (relatifs a public/) : on les compare tels quels au balayage.
async function referencesPublic() {
  const [rows] = await db.query("SELECT src_audio, src_image FROM musics");
  const set = new Set();
  for (const r of rows) {
    if (r.src_audio) set.add(r.src_audio);
    if (r.src_image) set.add(r.src_image);
  }
  return set;
}

// Les depots en attente : `submissions.fichier_audio` / `fichier_image` stockent le NOM NU du
// fichier (pas de sous-dossier), qui vit directement dans uploads/.
async function referencesUploads() {
  const [rows] = await db.query("SELECT fichier_audio, fichier_image FROM submissions");
  const set = new Set();
  for (const r of rows) {
    if (r.fichier_audio) set.add(r.fichier_audio);
    if (r.fichier_image) set.add(r.fichier_image);
  }
  return set;
}

// Liste les fichiers d'un dossier absents de `references`. `cheminRelatif(sous, nom)` fabrique
// la valeur telle qu'elle est stockee en base : "sous-dossier/nom" pour public/, le nom nu
// pour uploads/.
async function orphelins(dossier, sousDossiers, references, cheminRelatif) {
  const trouves = [];
  for (const sous of sousDossiers) {
    const abs = path.join(dossier, sous);
    let noms;
    try {
      noms = await fs.readdir(abs);
    } catch (erreur) {
      if (erreur.code === "ENOENT") continue; // dossier absent : rien a nettoyer
      throw erreur;
    }
    for (const nom of noms) {
      // On ne touche JAMAIS aux fichiers caches : un "orphelin", pour ce script, est un MEDIA
      // non reference — pas un fichier d'infrastructure. `uploads/` contient un `.gitignore`
      // (`*` + `!.gitignore`) qui garde le dossier versionne tout en ignorant les depots :
      // il n'est reference par aucune ligne, donc une version naive de ce filtre le prenait
      // pour un orphelin et l'effacait. Ecarter les dotfiles couvre aussi `.DS_Store`.
      if (nom.startsWith(".")) continue;

      const chemin = path.join(abs, nom);
      const stat = await fs.stat(chemin);
      if (!stat.isFile()) continue;
      if (!references.has(cheminRelatif(sous, nom))) {
        trouves.push({ chemin, taille: stat.size });
      }
    }
  }
  return trouves;
}

const orphelinsPublic = await orphelins(
  PUBLIC,
  ["musiques", "images"],
  await referencesPublic(),
  (sous, nom) => `${sous}/${nom}`,
);
const orphelinsUploads = await orphelins(
  UPLOADS,
  ["."],
  await referencesUploads(),
  (_sous, nom) => nom,
);

await db.end();

const tous = [...orphelinsPublic, ...orphelinsUploads];

if (tous.length === 0) {
  console.log("Aucun fichier orphelin. Tout est propre.");
  process.exit(0);
}

const tailleMo = (tous.reduce((s, o) => s + o.taille, 0) / 1e6).toFixed(1);
console.log(`${tous.length} fichier(s) orphelin(s) — ${tailleMo} Mo :\n`);
for (const o of tous) {
  console.log(`  ${path.relative(RACINE, o.chemin)}`);
}

if (!SUPPRIMER) {
  console.log("\n(dry-run) Rien n'a ete supprime. Relancer avec --supprimer pour effacer.");
  process.exit(0);
}

for (const o of tous) {
  await fs.unlink(o.chemin);
}
console.log(`\n${tous.length} fichier(s) supprime(s).`);
