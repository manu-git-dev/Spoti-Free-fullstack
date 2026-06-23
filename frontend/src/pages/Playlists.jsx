import ButtonAddPlaylist from "../composants/ButtonAddPlaylist";
import { useState, useEffect } from "react";
export default function Playlists() {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const url = `http://localhost:3000/api/playlists`;
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
          setPlaylists(data);
        } else {
          setPlaylists([]);
        }
      })
      .catch((error) => console.error(error));
  }, []);

  return (
    <>
      <ButtonAddPlaylist setPlaylists={setPlaylists}/>
      <h1>Vos playlists : </h1>
      <section className="grid grid-cols-5 gap-4 overflow-y-auto h-[calc(100%-4rem)]">
        {playlists.length === 0 ? (
          <div>Aucune musiques de likées</div>
        ) : (
          playlists.map((playlist) => (
            <h1>{playlist.name}</h1>
          ))
        )}
      </section>
    </>
  );
}
