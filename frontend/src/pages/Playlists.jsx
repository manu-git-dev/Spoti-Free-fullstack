import { Link } from "react-router-dom";
import ButtonAddPlaylist from "../composants/ButtonAddPlaylist";
import { useState, useEffect } from "react";
import Playlist from "../composants/Playlist";
export default function Playlists({playlists,setPlaylists}) {


  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-serif">Vos playlists</h1>
        <ButtonAddPlaylist setPlaylists={setPlaylists} playlists={playlists} children="Ajouter une playlist"/>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {playlists.length === 0 ? (
          <div className="text-base-content/70 col-span-2 md:col-span-5">
            Aucune playlist pour le moment
          </div>
        ) : (
          playlists.map((playlist) => (
            <Playlist
              id={playlist.id_playlist}
              nom={playlist.name}
              setPlaylists={setPlaylists}
            />
          ))
        )}
      </div>
    </section>
  );
}
