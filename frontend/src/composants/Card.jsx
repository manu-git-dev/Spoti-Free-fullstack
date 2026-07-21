import AddMusicPlaylist from "./AddMusicPlaylist";
import ButtonLike from "./ButtonLike";
import RemoveMusicPlaylist from "./RemoveMusicPlaylist";
import { urlFichier } from "@/lib/api";

export default function Card({
  musique,
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
  // Zone de lecture accessible au clavier : Entree/Espace lancent la lecture comme le clic.
  // `preventDefault` sur Espace evite que la page ne defile.
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };
  return (
    <article
      className={`group bg-background/50 border rounded-2xl p-3 flex flex-col cursor-pointer transition-all hover:bg-background/80 hover:shadow-lg hover:shadow-primary/10 ${
        isPlaying
          ? "border-primary bg-primary/10"
          : "border-border hover:border-accent"
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`Lire ${musique.title} par ${musique.artist}`}
        className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* loading="lazy" : le catalogue affiche 100 pochettes. Sans lui, le navigateur les
            demande TOUTES au montage — et comme il plafonne a ~6 connexions simultanees par
            domaine en HTTP/1.1, la requete du mp3 qu'on vient de cliquer se retrouve en file
            d'attente DERRIERE des dizaines d'images. C'est la cause principale des 2-3 s avant
            que le son ne demarre : ce n'est pas le fichier audio qui est lent, c'est qu'il
            attend son tour. Lazy ne charge que ce qui approche du viewport.
            decoding="async" : le decodage JPEG ne bloque plus le thread principal. */}
        <img
          src={urlFichier(musique.src_image)}
          alt={`Pochette album ${musique.title}`}
          loading="lazy"
          decoding="async"
          className="w-full aspect-square object-cover rounded-xl transition-transform group-hover:scale-[1.02]"
        />
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
      </div>
      {user && (
        <div className="flex items-center justify-end gap-2 mt-2">
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
    </article>
  );
}
