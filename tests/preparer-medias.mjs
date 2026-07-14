// Reconstitue `backend/public/` a partir des fixtures de test.
//
// POURQUOI CE SCRIPT EXISTE
// `backend/public/` est gitignore : les vrais fichiers audio pesent 23 Mo, et ce sont des
// morceaux dont on n'a pas les droits de redistribution. Une machine neuve (la CI, ou un
// recruteur qui clone le depot) n'a donc AUCUN media — le catalogue s'affiche, mais rien ne se
// lit, et les tests qui touchent aux fichiers echouent.
//
// Ce script cree, pour chaque fichier reference par le catalogue, une copie du media de test :
// un mp3 SILENCIEUX de 2 secondes (fabrique, donc libre de tout droit) et une pochette minimale.
// L'app devient alors pleinement testable sans un octet de contenu sous copyright.
//
// Il ne REMPLACE JAMAIS un fichier existant : lance sur la machine de developpement, il ne
// touchera pas aux vraies musiques.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ICI = path.dirname(url.fileURLToPath(import.meta.url));
const PUBLIC = path.join(ICI, "..", "backend", "public");
const FIXTURES = path.join(ICI, "fixtures");

// Les fichiers reellement references par `backend/scripts/seed-musics.sql`.
const AUDIOS = [
  "atlasaudio-sentimental-piano.mp3",
  "bombinsound-stomp-and-claps.mp3",
  "jonasblakewood-energetic.mp3",
  "the_mountain-phonk-phonk-music.mp3",
  "the_mountain-success.mp3",
];
const IMAGES = ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg"];

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
