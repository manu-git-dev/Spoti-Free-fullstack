import AddMusicPlaylist from "./AddMusicPlaylist";
import ButtonLike from "./ButtonLike";
import RemoveMusicPlaylist from "./RemoveMusicPlaylist";

export default function Card({
  musique,
  setCurrentMusic,
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
  };
  return (
    <article
      className={`bg-base-200 rounded-2xl p-3 flex flex-col cursor-pointer hover:shadow-xl transition-shadow ${
        isPlaying ? "ring-2 ring-primary" : ""
      }`}
    >
      <div onClick={handleClick}>
        <img
          src={`${API_URL}${musique.src_image}`}
          alt={`Pochette album ${musique.title}`}
          className="w-full aspect-square object-cover rounded-xl"
        />
        <h2 className="font-semibold truncate mt-2">{musique.title}</h2>
        <p className="text-xs text-base-content/60 uppercase truncate">
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
