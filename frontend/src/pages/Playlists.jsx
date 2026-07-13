import { Link } from "react-router-dom";
import { ListMusic } from "lucide-react";
import ButtonAddPlaylist from "../composants/ButtonAddPlaylist";
import { useState, useEffect } from "react";
import Playlist from "../composants/Playlist";
export default function Playlists({playlists,setPlaylists,user}) {

  if (user === null) {
    return (
      <section className="h-full overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
          <ListMusic className="w-7 h-7 text-base-content/40" />
        </div>
        <div>
          <p className="text-xl font-serif font-bold mb-1">
            Connecte-toi pour voir tes playlists
          </p>
          <p className="text-sm text-base-content/60">
            Crée et retrouve tes playlists personnelles.
          </p>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <Link to={"/inscription"} className="link">
            S'inscrire
          </Link>
          <Link to={"/connexion"}>
            <button className="btn btn-primary rounded-full px-6">
              Connexion
            </button>
          </Link>
        </div>
      </section>
    );
  }

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
