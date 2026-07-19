import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formate une duree en secondes vers "mm:ss".
 *
 * Renvoie "--:--" pour une valeur absente ou non numerique (une piste dont la duree n'est pas
 * connue, ou `audio.duration` encore a NaN avant le chargement des metadonnees) — et non "00:00",
 * qui laisserait croire a un morceau de duree nulle.
 *
 * Vit ICI, partagee par TrackRow et MediaPlayer, qui la reimplementaient chacun a l'identique.
 */
export function formaterDuree(secondes) {
  if (secondes === null || secondes === undefined || Number.isNaN(secondes)) {
    return "--:--";
  }
  const minutes = Math.floor(secondes / 60)
    .toString()
    .padStart(2, "0");
  const reste = Math.floor(secondes % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${reste}`;
}
