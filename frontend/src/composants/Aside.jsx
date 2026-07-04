import { Folder, Heart, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function Aside({user}) {
  return (
    <aside className="row-start-2 row-span-2 bg-zinc-800 rounded-2xl p-2 flex flex-col justify-between">
      <nav className="flex flex-col ">
        <Link to={"/"} className="flex text-3xl p-2 items-center mt-4">
          <Home className="fill-blue-600 mr-2 h-8 w-8" />
          Accueil
        </Link>
        <Link to={user === null ? "/connexion" : "/favoris" } className="flex text-3xl p-2 items-center mt-4">
          <Heart className="fill-red-600 mr-2 h-8 w-8" />
          Favoris
        </Link>
        <Link to={user === null ? "/connexion" : "/playlists" } className="flex text-3xl p-2 items-center mt-4">
          <Folder className="fill-yellow-300 mr-2 h-8 w-8" />
          Playlists
        </Link>
      </nav>
      <nav className="">
      <Link to={"/a-propos"} className="mx-2">
        A propos
      </Link>
      <Link to={"/contact"} className="mx-2 ">
        Contact
      </Link>
      </nav>
    </aside>
  );
}
