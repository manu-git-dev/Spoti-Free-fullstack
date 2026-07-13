import { parseFile } from "music-metadata";
import path from "path";
import db from "../db.js";

const [musics] = await db.query(
  "SELECT id_music, src_audio FROM musics WHERE duration IS NULL",
);

const cache = new Map();

for (const music of musics) {
  let seconds = cache.get(music.src_audio);

  if (seconds === undefined) {
    const filePath = path.join("public", music.src_audio);
    const metadata = await parseFile(filePath);
    seconds = Math.round(metadata.format.duration);
    cache.set(music.src_audio, seconds);
  }

  await db.query("UPDATE musics SET duration = ? WHERE id_music = ?", [
    seconds,
    music.id_music,
  ]);
  console.log(`id_music ${music.id_music} (${music.src_audio}) -> ${seconds}s`);
}

console.log("Backfill terminé.");
process.exit(0);
