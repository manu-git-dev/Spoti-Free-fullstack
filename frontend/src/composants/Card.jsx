import AddMusicPlaylist from "./AddMusicPlaylist";
import ButtonLike from "./ButtonLike";
import RemoveMusicPlaylist from "./RemoveMusicPlaylist";

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
  const API_URL = "http://localhost:3000/";
  const isPlaying = currentMusic?.id_music === musique.id_music;
  const handleClick = () => {
    setCurrentMusic(musique);
    setCurrentQueue(queue);
  };
  return (
    <article
      className={`group bg-background/50 border rounded-2xl p-3 flex flex-col cursor-pointer transition-all hover:bg-background/80 hover:shadow-lg hover:shadow-primary/10 ${
        isPlaying
          ? "border-primary bg-primary/10"
          : "border-border hover:border-accent"
      }`}
    >
      <div onClick={handleClick}>
        <img
          src={`${API_URL}${musique.src_image}`}
          alt={`Pochette album ${musique.title}`}
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
