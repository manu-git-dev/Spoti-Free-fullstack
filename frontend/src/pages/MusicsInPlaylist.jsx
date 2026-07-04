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
    <>
      <h1>Contenue de votre playlist  : </h1>
      <section className="grid grid-cols-5 gap-4 overflow-y-auto h-[calc(100%-4rem)]">
        {musicsPlaylist.length === 0 ? (
          <div>Aucune musiques dans cette playlist</div>
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
      </section>
    </>
  );
}