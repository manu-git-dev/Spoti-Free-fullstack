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
