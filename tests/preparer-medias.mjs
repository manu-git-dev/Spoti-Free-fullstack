// Reconstitue `backend/public/` a partir des fixtures de test.
//
// POURQUOI CE SCRIPT EXISTE
// `backend/public/` est gitignore : les fichiers audio du catalogue pesent plusieurs centaines
// de Mo. Une machine neuve (la CI, ou un recruteur qui clone le depot) n'a donc AUCUN media —
// le catalogue s'affiche, mais rien ne se lit, et les tests qui touchent aux fichiers echouent.
//
// Ce script cree, pour chaque fichier reference par le catalogue, une copie du media de test :
// un mp3 SILENCIEUX de 2 secondes (fabrique, donc libre de tout droit) et une pochette minimale.
// L'app devient alors pleinement testable sans telecharger un seul vrai morceau.
//
// Il ne REMPLACE JAMAIS un fichier existant : lance sur la machine de developpement, il ne
// touchera pas aux vraies musiques.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ICI = path.dirname(url.fileURLToPath(import.meta.url));
const PUBLIC = path.join(ICI, "..", "backend", "public");
const FIXTURES = path.join(ICI, "fixtures");
const SEED = path.join(ICI, "..", "backend", "scripts", "seed-musics.sql");

// Les noms de fichiers sont LUS dans le seed, pas recopies ici.
//
// Ils etaient codes en dur : cinq mp3 et cinq images, ce qui tenait tant que le catalogue de
// demonstration comptait cinq fichiers. Un catalogue de cent morceaux rendait cette liste
// ingerable, et surtout fausse en silence — le script aurait cree cinq fichiers obsoletes et
// ignore les cent autres, laissant la CI echouer sur des medias manquants sans dire pourquoi.
//
// La source de verite du catalogue, c'est le seed. Autant le lire.
function fichiersDuSeed() {
  const sql = fs.readFileSync(SEED, "utf8");

  const audios = new Set();
  const images = new Set();

  for (const [, chemin] of sql.matchAll(/'(musiques\/[^']+)'/g)) {
    audios.add(path.basename(chemin));
  }
  for (const [, chemin] of sql.matchAll(/'(images\/[^']+)'/g)) {
    images.add(path.basename(chemin));
  }

  return { audios: [...audios], images: [...images] };
}

const { audios: AUDIOS, images: IMAGES } = fichiersDuSeed();

if (AUDIOS.length === 0) {
  // Mieux vaut s'arreter net que laisser la CI echouer vingt lignes plus loin sur un
  // "fichier introuvable" dont l'origine serait impossible a deviner.
  console.error(
    `Aucun fichier audio trouve dans ${path.relative(ICI, SEED)}.\n` +
      "Le seed est-il vide, ou son format a-t-il change ?",
  );
  process.exit(1);
}

const audioTest = fs.readFileSync(path.join(FIXTURES, "audio-test.mp3"));
const imageTest = fs.readFileSync(path.join(FIXTURES, "pochette-test.jpg"));

let crees = 0;
let existants = 0;

function ecrire(dossier, nom, contenu) {
  const cible = path.join(PUBLIC, dossier, nom);
  if (fs.existsSync(cible)) {
    existants++;
    return;
  }
  fs.mkdirSync(path.dirname(cible), { recursive: true });
  fs.writeFileSync(cible, contenu);
  crees++;
}

for (const nom of AUDIOS) ecrire("musiques", nom, audioTest);
for (const nom of IMAGES) ecrire("images", nom, imageTest);

// `uploads/` doit exister (vide) : c'est la ou atterrissent les depots avant moderation.
fs.mkdirSync(path.join(ICI, "..", "backend", "uploads"), { recursive: true });

console.log(
  `Medias de test : ${crees} cree(s), ${existants} deja present(s) (laisse(s) intact(s)).`,
);
