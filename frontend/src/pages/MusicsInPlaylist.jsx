import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Card from "../composants/Card";
export default function MusicsInPlaylist({setCurrentMusic,setMusiquesLikee, musiquesLikee}) {
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {musicsPlaylist.length === 0 ? (
          <div className="text-base-content/70 col-span-2 md:col-span-5">
            Aucune musique dans cette playlist
          </div>
        ) : (
          musicsPlaylist.map((playlistMusic) => (
                        <Card
                          key={playlistMusic.id_music}
                          musique={playlistMusic}
                          setMusiquesLikee={setMusiquesLikee}
                          setCurrentMusic={setCurrentMusic}
                          idPlaylist = {idPlaylist}
                          setMusicsPlaylist = {setMusicsPlaylist}
                          musiquesLikee={musiquesLikee}
                        />
          ))
        )}
      </div>
    </section>
  );
}