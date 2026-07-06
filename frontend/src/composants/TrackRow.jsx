import AddMusicPlaylist from "./AddMusicPlaylist";
import ButtonLike from "./ButtonLike";
import RemoveMusicPlaylist from "./RemoveMusicPlaylist";

export default function TrackRow({
  musique,
  index,
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
    <div
      className={`flex items-center gap-4 px-2 py-2 rounded-xl border-l-2 hover:bg-base-200 transition-colors ${
        isPlaying ? "border-primary bg-primary/10" : "border-transparent"
      }`}
    >
      <span className="w-6 text-center text-base-content/50 font-serif">
        {index + 1}
      </span>
      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        onClick={handleClick}
      >
        <img
          src={`${API_URL}${musique.src_image}`}
          alt={`Pochette album ${musique.title}`}
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold">{musique.title}</p>
          <p className="truncate text-sm text-base-content/60">
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
    </div>
  );
}
