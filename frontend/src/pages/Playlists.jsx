import { Link } from "react-router-dom";
import ButtonAddPlaylist from "../composants/ButtonAddPlaylist";
import { useState, useEffect } from "react";
import Playlist from "../composants/Playlist";
export default function Playlists({playlists,setPlaylists}) {


  return (
    <>
      <ButtonAddPlaylist setPlaylists={setPlaylists} playlists={playlists} children="Ajouter une playlist"/>
      <h1>Vos playlists : </h1>
      <section className="grid grid-cols-5 gap-4 overflow-y-auto h-[calc(100%-4rem)]">
        {playlists.length === 0 ? (
          <div>Aucune playlist pour le moment</div>
        ) : (
          playlists.map((playlist) => (
            <Playlist
              id={playlist.id_playlist}
              nom={playlist.name}
              setPlaylists={setPlaylists}
            />
          ))
        )}
      </section>
    </>
  );
}
