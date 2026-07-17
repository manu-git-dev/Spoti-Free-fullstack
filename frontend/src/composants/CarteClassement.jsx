import { Play } from "lucide-react";
import AddMusicPlaylist from "./AddMusicPlaylist";
import ButtonLike from "./ButtonLike";
import { urlFichier } from "@/lib/api";

// Carte du Top 5 de l'accueil. Volontairement DISTINCTE de `Card.jsx` (la carte du catalogue) :
// un classement n'est pas une grille de catalogue, il porte deux informations que le catalogue
// n'a pas — le RANG et l'ECART d'ecoutes. Ce sont eux qui justifient la forme dediee.
//
// On ne modifie pas `Card` pour lui ajouter ces props : une carte de catalogue n'a pas de rang,
// et lui en donner un optionnel melerait deux intentions dans un meme composant.
export default function CarteClassement({
  musique,
  rang,
  setCurrentMusic,
  setCurrentQueue,
  queue,
  setMusiquesLikee,
  musiquesLikee,
  user,
  currentMusic,
}) {
  const isPlaying = currentMusic?.id_music === musique.id_music;
  const jouer = () => {
    setCurrentMusic(musique);
    setCurrentQueue(queue);
  };

  const ecoutes = musique.play_count ?? 0;

  return (
    <article
      className={`group bg-background/50 border rounded-2xl p-3 flex flex-col transition-all hover:bg-background/80 hover:shadow-lg hover:shadow-primary/10 ${
        isPlaying
          ? "border-primary bg-primary/10"
          : "border-border hover:border-accent"
      }`}
    >
      <div className="cursor-pointer" onClick={jouer}>
        <div className="relative">
          <img
            src={urlFichier(musique.src_image)}
            alt={`Pochette album ${musique.title}`}
            className={`w-full aspect-square object-cover rounded-xl transition-transform group-hover:scale-[1.02] ${
              isPlaying ? "ring-2 ring-primary" : ""
            }`}
          />

          {/* Badge de rang : la marque distinctive du classement. Chiffre en empattement
              (`font-serif`), comme la numerotation de l'ancienne liste. */}
          <span className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-md font-serif">
            {rang}
          </span>

          {/* Bouton lecture : apparait au survol, comme sur les vraies applis. `stopPropagation`
              pour ne pas declencher DEUX fois le clic du conteneur (les deux jouent, mais autant
              rester net). Une cible de 44px : la taille minimale confortable au doigt. */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              jouer();
            }}
            aria-label={`Lire ${musique.title}`}
            className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105 focus-visible:opacity-100 focus-visible:translate-y-0"
          >
            <Play className="h-5 w-5 fill-current" />
          </button>
        </div>

        <h2
          className={`font-semibold truncate mt-2 ${
            isPlaying ? "text-primary" : ""
          }`}
        >
          {musique.title}
        </h2>
        <p className="text-xs text-muted-foreground uppercase truncate">
          {musique.artist}
        </p>

        {/* L'ecart d'ecoutes : ce qui distingue un classement d'une simple liste. */}
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          {ecoutes.toLocaleString("fr-FR")} {ecoutes > 1 ? "écoutes" : "écoute"}
        </p>
      </div>

      {user && (
        <div className="flex items-center justify-end gap-2 mt-2">
          <ButtonLike
            idMusic={musique.id_music}
            setMusiquesLikee={setMusiquesLikee}
            musiquesLikee={musiquesLikee}
            musique={musique}
          />
          <AddMusicPlaylist idMusic={musique.id_music} />
        </div>
      )}
    </article>
  );
}
