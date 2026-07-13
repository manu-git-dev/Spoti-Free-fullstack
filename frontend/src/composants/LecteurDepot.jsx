import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// Lecteur pour un fichier en attente de moderation.
//
// On ne peut pas ecrire simplement <audio src="/api/submissions/12/audio" /> : quand le
// navigateur va chercher un `src` lui-meme, il n'envoie PAS l'en-tete `Authorization`. La route
// etant reservee a l'admin, elle repondrait 401 et l'admin n'entendrait rien.
//
// On telecharge donc le fichier via apiFetch (qui, lui, joint le token), on le garde en memoire
// sous forme de Blob, et on donne au <audio> une URL locale qui pointe vers cette memoire
// (`blob:...`). Le fichier n'est jamais expose publiquement, et le token ne se retrouve pas
// dans une URL (ou il finirait dans les logs et l'historique du navigateur).
export default function LecteurDepot({ idSubmission, className = "" }) {
  const [urlLocale, setUrlLocale] = useState(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    let annule = false;
    let urlCreee = null;

    apiFetch(`/api/submissions/${idSubmission}/audio`, { brut: true })
      .then(async ({ reponse }) => {
        if (!reponse.ok) throw new Error(`statut ${reponse.status}`);
        const blob = await reponse.blob();
        if (annule) return;
        urlCreee = URL.createObjectURL(blob);
        setUrlLocale(urlCreee);
      })
      .catch((error) => {
        console.error(error);
        if (!annule) setErreur(true);
      });

    // Nettoyage : sans `revokeObjectURL`, chaque blob resterait en memoire jusqu'au
    // rechargement de la page (fuite memoire, d'autant plus visible sur des fichiers audio).
    return () => {
      annule = true;
      if (urlCreee) URL.revokeObjectURL(urlCreee);
    };
  }, [idSubmission]);

  if (erreur) {
    return (
      <p className={`text-xs text-destructive ${className}`}>
        Lecture impossible.
      </p>
    );
  }

  if (!urlLocale) {
    return (
      <p className={`text-xs text-muted-foreground ${className}`}>Chargement…</p>
    );
  }

  return <audio controls src={urlLocale} className={className} />;
}
