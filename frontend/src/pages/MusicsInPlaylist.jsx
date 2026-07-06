import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TrackRow from "../composants/TrackRow";
export default function MusicsInPlaylist({setCurrentMusic,setMusiquesLikee, musiquesLikee, user}) {
  const [musicsPlaylist, setMusicsPlaylist] = useState([]);
  const {idPlaylist} = useParams();

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
        if (Array.isArray(data)) {
          setMusicsPlaylist(data);
        } else {
          setMusicsPlaylist([]);
        }
      })
      .catch((error) => console.error(error));
  }, []);

  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      <h1 className="text-2xl font-serif mb-6">Contenu de votre playlist</h1>
      <div className="flex flex-col gap-1">
        {musicsPlaylist.length === 0 ? (
          <p className="text-base-content/70">
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
              idPlaylist={idPlaylist}
              setMusicsPlaylist={setMusicsPlaylist}
              musiquesLikee={musiquesLikee}
              user={user}
            />
          ))
        )}
      </div>
    </section>
  );
}