import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TrackRow from "../composants/TrackRow";
export default function MusicsInPlaylist({setCurrentMusic,setCurrentQueue,setMusiquesLikee, musiquesLikee, user, currentMusic}) {
  const [musicsPlaylist, setMusicsPlaylist] = useState([]);
  const {idPlaylist} = useParams();

  // Depend de `idPlaylist` : en passant d'une playlist a une autre, React Router reutilise
  // le meme composant (pas de remontage). Avec `[]`, l'effet ne se relancait pas et la page
  // continuait d'afficher le contenu de la playlist precedente.
  useEffect(() => {
    const url = `http://localhost:3000/api/playlists/musics/${idPlaylist}`;
    const token = localStorage.getItem("token");
    fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setMusicsPlaylist(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error(error));
  }, [idPlaylist]);

  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-serif font-bold mb-6">
        <span className="h-7 w-1 rounded-full bg-gradient-to-b from-primary to-accent" />
        Contenu de votre playlist
      </h1>
      <div className="flex flex-col gap-1">
        {musicsPlaylist.length === 0 ? (
          <p className="text-muted-foreground">
            Aucune musique dans cette playlist
          </p>
        ) : (
          musicsPlaylist.map((playlistMusic, index) => (
            <TrackRow
              key={playlistMusic.id_music}
              musique={playlistMusic}
              index={index}
              setMusiquesLikee={setMusiquesLikee}
              setCurrentMusic={setCurrentMusic}
              setCurrentQueue={setCurrentQueue}
              queue={musicsPlaylist}
              idPlaylist={idPlaylist}
              setMusicsPlaylist={setMusicsPlaylist}
              musiquesLikee={musiquesLikee}
              user={user}
              currentMusic={currentMusic}
            />
          ))
        )}
      </div>
    </section>
  );
}