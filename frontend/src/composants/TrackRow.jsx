import AddMusicPlaylist from "./AddMusicPlaylist";
import ButtonLike from "./ButtonLike";
import RemoveMusicPlaylist from "./RemoveMusicPlaylist";
import { urlFichier } from "@/lib/api";
import { formaterDuree } from "@/lib/utils";

export default function TrackRow({
  musique,
  index,
  setCurrentMusic,
  setCurrentQueue,
  queue,
  setMusiquesLikee,
  idPlaylist,
  setMusicsPlaylist,
  musiquesLikee,
  user,
  currentMusic,
}) {
  const isPlaying = currentMusic?.id_music === musique.id_music;
  const handleClick = () => {
    setCurrentMusic(musique);
    setCurrentQueue(queue);
  };
  // Zone de lecture accessible au clavier : Entree/Espace declenchent la lecture comme le clic.
  // `preventDefault` sur Espace evite que la page ne defile.
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };
  return (
    <div
      className={`group flex items-center gap-4 px-3 py-2 rounded-xl border border-l-4 transition-colors ${
        isPlaying
          ? "border-border border-l-primary bg-primary/15"
          : "border-transparent border-l-transparent bg-background/40 hover:bg-background/70 hover:border-l-accent"
      }`}
    >
      <span
        className={`w-6 text-center font-serif ${
          isPlaying ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {index + 1}
      </span>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`Lire ${musique.title} par ${musique.artist}`}
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Meme raison que dans Card.jsx : une liste de 100 lignes = 100 requetes d'image au
            montage, qui saturent les connexions et retardent le mp3. Voir le commentaire la-bas. */}
        <img
          src={urlFichier(musique.src_image)}
          alt={`Pochette album ${musique.title}`}
          loading="lazy"
          decoding="async"
          className={`w-12 h-12 rounded-lg object-cover transition-transform group-hover:scale-105 ${
            isPlaying ? "ring-2 ring-primary" : ""
          }`}
        />
        <div className="min-w-0">
          <p
            className={`truncate font-semibold ${
              isPlaying ? "text-primary" : ""
            }`}
          >
            {musique.title}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {musique.artist}
          </p>
        </div>
      </div>
      {user && (
        <div className="flex items-center gap-1">
          <ButtonLike
            idMusic={musique.id_music}
            setMusiquesLikee={setMusiquesLikee}
            musiquesLikee={musiquesLikee}
            musique={musique}
          />
          {!idPlaylist && <AddMusicPlaylist idMusic={musique.id_music} />}
          {idPlaylist && (
            <RemoveMusicPlaylist
              idMusic={musique.id_music}
              idPlaylist={idPlaylist}
              setMusicsPlaylist={setMusicsPlaylist}
            />
          )}
        </div>
      )}
      <span className="hidden sm:block text-sm text-muted-foreground shrink-0 tabular-nums">
        {formaterDuree(musique.duration)}
      </span>
    </div>
  );
}
