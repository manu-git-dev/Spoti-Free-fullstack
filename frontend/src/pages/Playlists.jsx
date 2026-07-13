import { Link } from "react-router-dom";
import { ListMusic } from "lucide-react";
import ButtonAddPlaylist from "../composants/ButtonAddPlaylist";
import Playlist from "../composants/Playlist";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export default function Playlists({playlists,setPlaylists,user}) {

  if (user === null) {
    return (
      <section className="h-full overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <ListMusic className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-xl font-serif font-bold mb-1">
            Connecte-toi pour voir tes playlists
          </p>
          <p className="text-sm text-muted-foreground">
            Crée et retrouve tes playlists personnelles.
          </p>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <Link to={"/inscription"} className="text-primary underline-offset-4 hover:underline">
            S'inscrire
          </Link>
          <Link
            to="/connexion"
            className={cn(buttonVariants(), "rounded-full px-6")}
          >
            Connexion
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">
            Vos playlists
          </h1>
          <p className="text-sm text-muted-foreground">
            {playlists.length}{" "}
            {playlists.length > 1 ? "playlists" : "playlist"}
          </p>
        </div>
        <ButtonAddPlaylist
          setPlaylists={setPlaylists}
          playlists={playlists}
          variant="default"
          size="default"
          className="rounded-full self-start md:self-auto shrink-0"
        >
          Ajouter une playlist
        </ButtonAddPlaylist>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {playlists.length === 0 ? (
          <div className="text-muted-foreground col-span-2 md:col-span-4 lg:col-span-5">
            Aucune playlist pour le moment
          </div>
        ) : (
          playlists.map((playlist) => (
            <Playlist
              key={playlist.id_playlist}
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
