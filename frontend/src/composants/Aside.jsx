import { Folder, Heart, Home, Library, Plus, Info, Mail } from "lucide-react";
import { NavLink, useMatch } from "react-router-dom";
import ButtonAddPlaylist from "./ButtonAddPlaylist";

export default function Aside({
  user,
  className = "",
  playlists,
  setPlaylists,
}) {
  const isPlaylistsActive = useMatch("/playlists");
  return (
    <aside className={`flex-col bg-base-200  p-6 gap-7 ${className}`}>
      <NavLink to="/" className="text-2xl font-serif font-bold text-primary ">
        Spoti-Free
      </NavLink>
      <nav className="flex flex-col ">
        <NavLink
          to={"/"}
          className={({ isActive }) =>
            `flex text-xl  p-2 items-center mt-4 rounded-[10px]  ${
              isActive ? "bg-accent/15 text-accent" : "text-base-content/70"
            }`
          }
        >
          <Home className="mr-2" />
          Accueil
        </NavLink>
        <NavLink
          to={"/bibliotheque"}
          className={({ isActive }) =>
            `flex text-xl  p-2 items-center mt-4 rounded-[10px]  ${
              isActive ? "bg-accent/15 text-accent" : "text-base-content/70"
            }`
          }
        >
          <Library className=" mr-2" />
          Bibliothèque
        </NavLink>
        <NavLink
          to={"/favoris"}
          className={({ isActive }) =>
            `flex text-xl p-2 items-center mt-4 rounded-[10px]  ${
              isActive ? "bg-accent/15 text-accent" : "text-base-content/70"
            }`
          }
        >
          <Heart className=" mr-2" />
          Favoris
        </NavLink>
      </nav>
      <div className="h-px w-full bg-base-300" />
      <div
        className={`flex items-center rounded-[10px] ${
          isPlaylistsActive ? "bg-accent/15 text-accent" : "text-base-content/70"
        }`}
      >
        <NavLink to={"/playlists"} className="text-xl p-2">
          Mes playlists
        </NavLink>
        <ButtonAddPlaylist playlists={playlists} setPlaylists={setPlaylists} children={<Plus className="ml-auto " />}/>

      </div>
      {playlists.map((playlist) => (
        <NavLink key={playlist.id_playlist} to={`/playlists/${playlist.id_playlist}`}>
          <label htmlFor="" className="cursor-pointer">{playlist.name}</label>
        </NavLink>
      ))}
      <div className="h-px w-full bg-base-300" />
      <nav className="flex flex-col gap-7">
        <NavLink
          to={"/a-propos"}
          className={({ isActive }) =>
            `mx-2 flex rounded-[10px]  ${
              isActive ? "bg-accent/15 text-accent" : "text-base-content/70"
            }`
          }
        >
          <Info className="mr-2" /> A propos
        </NavLink>
        <NavLink
          to={"/contact"}
          className={({ isActive }) =>
            `mx-2  flex rounded-[10px] ${
              isActive ? "bg-accent/15 text-accent" : "text-base-content/70"
            }`
          }
        >
          <Mail className="mr-2" />
          Contact
        </NavLink>
      </nav>
    </aside>
  );
}
