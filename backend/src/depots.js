// Connaissance du dossier `uploads/` et operations fichiers des depots.
//
// Ce module existe pour UNE raison : trois routes ont besoin de savoir ou vivent les fichiers
// deposes et comment les supprimer — le depot lui-meme (submissionRoute), l'auto-suppression de
// compte (userRoute) et la suppression d'un compte par un admin (adminRoute). Avant, chacune en
// gardait sa propre copie : `DOSSIER_UPLOADS` etait defini deux fois, et l'une des trois routes
// avait carrement oublie le nettoyage. Une seule verite, importee partout, ne peut plus diverger.

import path from "node:path";
import fs from "node:fs/promises";
import db from "../db.js";

// `uploads/` est HORS de `public/`. C'est l'invariant le plus important du dossier : `server.js`
// fait `express.static("public")`, donc tout ce qui atterrit dans `public/` est servi en ligne
// immediatement. Un morceau depose mais pas encore valide vit donc ici, invisible, et n'est
// deplace vers `public/` qu'a l'approbation.
export const DOSSIER_UPLOADS = path.join(process.cwd(), "uploads");

/**
 * Les SIGNATURES des formats d'image acceptes — les premiers octets que tout fichier du format
 * porte obligatoirement (on parle de « magic bytes »).
 *
 * Pourquoi ne pas se fier a l'extension : `.jpg` est une chaine de caracteres choisie par
 * l'utilisateur, elle ne decrit pas le contenu. N'importe quel fichier renomme passe. C'est
 * exactement le raisonnement deja applique a l'AUDIO (qu'on decode avec music-metadata) ; il
 * manquait a l'image, alors que l'argument est le meme.
 *
 * `null` dans un tableau = « n'importe quel octet a cette position ». WebP en a besoin : son
 * en-tete est `RIFF` + 4 octets de TAILLE (donc variables) + `WEBP`.
 */
const SIGNATURES_IMAGE = {
  ".jpg": [0xff, 0xd8, 0xff],
  ".png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  // prettier-ignore
  ".webp": [
    0x52, 0x49, 0x46, 0x46,       // "RIFF"
    null, null, null, null,       // taille du fichier
    0x57, 0x45, 0x42, 0x50,       // "WEBP"
  ],
};

/**
 * Lit les premiers octets d'un fichier de `uploads/` et renvoie l'extension du format REELLEMENT
 * trouve (`.jpg`, `.png`, `.webp`), ou `null` si ce n'est aucun des trois.
 *
 * On ne lit que 12 octets, pas le fichier entier : la signature est en tete, et charger 2 Mo en
 * memoire pour en regarder douze serait du gaspillage a chaque depot.
 */
export async function formatReelDeLImage(nomFichier) {
  const chemin = path.join(DOSSIER_UPLOADS, path.basename(nomFichier));

  let descripteur;
  try {
    descripteur = await fs.open(chemin, "r");
    const { buffer, bytesRead } = await descripteur.read(Buffer.alloc(12), 0, 12, 0);

    for (const [extension, signature] of Object.entries(SIGNATURES_IMAGE)) {
      if (bytesRead < signature.length) continue;
      const correspond = signature.every(
        (octet, i) => octet === null || buffer[i] === octet,
      );
      if (correspond) return extension;
    }
    return null;
  } catch (error) {
    console.error(error);
    return null; // illisible = inexploitable, meme verdict
  } finally {
    await descripteur?.close();
  }
}

/**
 * Verifie qu'un fichier depose est bien une image, et renvoie son nom definitif.
 *
 * Renvoie `null` si le contenu n'est aucun format accepte — l'appelant doit alors refuser le
 * depot et nettoyer.
 *
 * Si le contenu est valide mais que l'EXTENSION ne lui correspond pas (un PNG nomme `.jpg` :
 * cas frequent et parfaitement innocent, on renomme sans arret quand on bricole une image), on
 * corrige l'extension plutot que de refuser. Ce n'est pas de la complaisance : `public/` est
 * servi statiquement, et nginx deduit le `Content-Type` de l'EXTENSION. Un PNG servi en
 * `image/jpeg` avec `X-Content-Type-Options: nosniff` — que la prod pose — donne une image
 * cassee chez le visiteur, parce que le navigateur obeit au type declare au lieu de deviner.
 * Corriger l'extension, c'est garantir que le fichier sera servi sous son vrai type.
 */
export async function validerImageDeposee(nomFichier) {
  const format = await formatReelDeLImage(nomFichier);
  if (!format) return null;

  const extensionActuelle = path.extname(nomFichier).toLowerCase();
  // `.jpeg` et `.jpg` sont le meme format : ne pas renommer pour si peu.
  const dejaBonne =
    extensionActuelle === format ||
    (format === ".jpg" && extensionActuelle === ".jpeg");
  if (dejaBonne) return nomFichier;

  const nomCorrige = path.basename(nomFichier, path.extname(nomFichier)) + format;
  await fs.rename(
    path.join(DOSSIER_UPLOADS, path.basename(nomFichier)),
    path.join(DOSSIER_UPLOADS, nomCorrige),
  );
  return nomCorrige;
}

/** Supprime des fichiers de `uploads/` sans jamais faire echouer l'appelant (best effort). */
export async function supprimerFichiersDepot(...noms) {
  await Promise.all(
    noms.filter(Boolean).map(async (nom) => {
      try {
        // `path.basename` : la valeur ne devrait etre qu'un nom de fichier, mais on ne construit
        // jamais un chemin a partir d'une valeur stockee sans neutraliser un eventuel "../".
        await fs.unlink(path.join(DOSSIER_UPLOADS, path.basename(nom)));
      } catch (error) {
        // Le fichier a deja disparu (ou n'a jamais ete ecrit) : ce n'est pas un probleme.
        if (error.code !== "ENOENT") console.error(error);
      }
    }),
  );
}

/**
 * Supprime du disque les fichiers des depots ENCORE EN ATTENTE d'un utilisateur.
 *
 * A appeler AVANT de supprimer l'utilisateur : la cascade SQL (`ON DELETE CASCADE` sur
 * `submissions`) efface les LIGNES, mais la base ne sait rien des fichiers sur le disque.
 *
 * UNIQUEMENT les depots `en_attente` :
 *   - `en_attente` -> le fichier est dans `uploads/`, il n'appartient qu'a ce depot : on le supprime.
 *   - `approuve`   -> le fichier a ete DEPLACE dans `public/`, il est desormais au catalogue et
 *     peut etre partage par plusieurs morceaux : on n'y touche pas.
 *   - `refuse`     -> le fichier a deja ete supprime au moment du refus : rien a faire.
 */
export async function nettoyerDepotsEnAttente(idUser) {
  const [depots] = await db.query(
    "SELECT fichier_audio, fichier_image FROM submissions WHERE id_user = ? AND statut = 'en_attente'",
    [idUser],
  );

  for (const depot of depots) {
    await supprimerFichiersDepot(depot.fichier_audio, depot.fichier_image);
  }
}
