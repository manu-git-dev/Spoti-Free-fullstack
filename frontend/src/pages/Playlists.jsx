import { Link } from "react-router-dom";
import { ListMusic } from "lucide-react";
import ButtonAddPlaylist from "../composants/ButtonAddPlaylist";
import Playlist from "../composants/Playlist";
import Page from "../composants/Page";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export default function Playlists({ playlists, setPlaylists, user }) {
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
          <Link
            to={"/inscription"}
            className="text-foreground hover:text-primary underline-offset-4 hover:underline"
          >
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
    <Page
      icone={ListMusic}
      titre="Vos playlists"
      sousTitre={`${playlists.length} ${
        playlists.length > 1 ? "playlists" : "playlist"
      }`}
      actions={
        <ButtonAddPlaylist
          setPlaylists={setPlaylists}
          playlists={playlists}
          variant="default"
          size="default"
          className="rounded-full w-full md:w-auto"
        >
          Ajouter une playlist
        </ButtonAddPlaylist>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {playlists.length === 0 ? (
          <div className="text-muted-foreground col-span-full">
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
    </Page>
  );
}
