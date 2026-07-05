import { Folder, Heart, Home, Library, Plus, Info, Mail } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Aside({ user, className = "" }) {
  return (
    <aside className={`flex-col bg-base-200  p-6 gap-7 ${className}`}>
      <NavLink to="/" className="text-2xl font-serif font-bold text-primary">
        Spoti-Free
      </NavLink>
      <nav className="flex flex-col ">
        <NavLink
          to={"/"}
          className="flex text-xl text-base-content/70 p-2 items-center mt-4"
        >
          <Home className="mr-2" />
          Accueil
        </NavLink>
        <NavLink
          to={user === null ? "/connexion" : "/bibliotheque"}
          className="flex text-xl text-base-content/70 p-2 items-center mt-4"
        >
          <Library className=" mr-2" />
          Bibliothèque
        </NavLink>
        <NavLink
          to={user === null ? "/connexion" : "/favoris"}
          className="flex text-xl p-2 items-center mt-4 text-base-content/70"
        >
          <Heart className=" mr-2" />
          Favoris
        </NavLink>
      </nav>
      <div className="h-px w-full bg-base-300" />
      <div className="text-base-content/70 flex">
        <NavLink
          to={user === null ? "/connexion" : "/playlists"}
          className="text-xl text-base-content/70"
        >
          Mes playlists
        </NavLink>
        <Plus className="ml-auto " />
      </div>
      <div className="h-px w-full bg-base-300" />
      <nav className="flex flex-col gap-7">
        <NavLink to={"/a-propos"} className="mx-2 text-base-content/70 flex">
          <Info className="mr-2"/> A propos
        </NavLink>
        <NavLink to={"/contact"} className="mx-2 text-base-content/70 flex">
          <Mail className="mr-2"/>Contact
        </NavLink>
      </nav>
    </aside>
  );
}
