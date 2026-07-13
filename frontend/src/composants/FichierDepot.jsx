import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

/**
 * Recupere un fichier protege (audio ou pochette d'un depot en attente) et renvoie une URL
 * locale utilisable dans un <audio>, une <img> ou un lien de telechargement.
 *
 * Pourquoi ne pas ecrire simplement <img src="/api/submissions/12/image" /> ?
 * Parce que quand le navigateur va chercher un `src` lui-meme, il n'envoie PAS l'en-tete
 * `Authorization`. La route etant reservee a l'admin, elle repondrait 401.
 *
 * On telecharge donc le fichier via apiFetch (qui, lui, joint le token), on le garde en memoire
 * sous forme de Blob, et on expose une URL `blob:` qui pointe vers cette memoire. Le fichier
 * n'est jamais publie, et le token ne se retrouve pas dans une URL (ou il finirait dans les
 * logs serveur et l'historique du navigateur).
 */
export function useFichierProtege(chemin, actif = true) {
  const [url, setUrl] = useState(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!actif) return;

    let annule = false;
    let urlCreee = null;

    apiFetch(chemin, { brut: true })
      .then(async ({ reponse }) => {
        if (!reponse.ok) throw new Error(`statut ${reponse.status}`);
        const blob = await reponse.blob();
        if (annule) return;
        urlCreee = URL.createObjectURL(blob);
        setUrl(urlCreee);
      })
      .catch((error) => {
        console.error(error);
        if (!annule) setErreur(true);
      });

    // Sans `revokeObjectURL`, chaque blob resterait en memoire jusqu'au rechargement de la
    // page — une fuite d'autant plus visible avec des fichiers audio.
    return () => {
      annule = true;
      if (urlCreee) URL.revokeObjectURL(urlCreee);
    };
  }, [chemin, actif]);

  return { url, erreur };
}

/** Lecteur audio d'un depot en attente. */
export function LecteurDepot({ idSubmission, className = "" }) {
  const { url, erreur } = useFichierProtege(
    `/api/submissions/${idSubmission}/audio`,
  );

  if (erreur) {
    return (
      <p className={`text-xs text-destructive ${className}`}>
        Lecture impossible.
      </p>
    );
  }

  if (!url) {
    return (
      <p className={`text-xs text-muted-foreground ${className}`}>Chargement…</p>
    );
  }

  return <audio controls src={url} className={className} />;
}

/**
 * Apercu de la pochette proposee, cliquable pour l'ouvrir en grand dans un nouvel onglet
 * (utile pour verifier les droits d'image avant d'accepter le depot).
 */
export function ApercuPochette({ idSubmission, aPochette, titre }) {
  const { url, erreur } = useFichierProtege(
    `/api/submissions/${idSubmission}/image`,
    Boolean(aPochette),
  );

  if (!aPochette) {
    return (
      <div className="w-20 h-20 shrink-0 rounded-xl border border-dashed border-border bg-background/40 flex items-center justify-center text-center">
        <span className="text-[10px] leading-tight text-muted-foreground px-1">
          Aucune
          <br />
          pochette
        </span>
      </div>
    );
  }

  if (erreur || !url) {
    return (
      <div className="w-20 h-20 shrink-0 rounded-xl border border-border bg-background/40 flex items-center justify-center">
        <span className="text-[10px] text-muted-foreground">
          {erreur ? "Erreur" : "…"}
        </span>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Ouvrir la pochette en grand"
      className="shrink-0"
    >
      <img
        src={url}
        alt={`Pochette proposée pour ${titre}`}
        className="w-20 h-20 rounded-xl object-cover border border-border transition-transform hover:scale-105"
      />
    </a>
  );
}

/**
 * Lien de telechargement d'un fichier protege.
 *
 * L'attribut `download` d'un <a> ne fonctionne que sur une URL de meme origine — c'est le cas
 * d'une URL `blob:`, qui appartient a la page. On peut donc imposer un nom de fichier lisible
 * (plutot que l'UUID interne), ce qui est pratique quand on telecharge plusieurs depots pour
 * verifier leurs droits.
 */
export function LienTelechargement({
  chemin,
  nomFichier,
  actif = true,
  children,
  className = "",
}) {
  const { url, erreur } = useFichierProtege(chemin, actif);

  if (!actif || erreur) return null;

  if (!url) {
    return (
      <span className={`text-xs text-muted-foreground ${className}`}>…</span>
    );
  }

  return (
    <a href={url} download={nomFichier} className={className}>
      {children}
    </a>
  );
}
