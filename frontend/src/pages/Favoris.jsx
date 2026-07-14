import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import TrackRow from "../composants/TrackRow";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export default function Favoris({setCurrentMusic,setCurrentQueue,musiquesLikee,setMusiquesLikee,user,currentMusic}) {

  if (user === null) {
    return (
      <section className="h-full overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Heart className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-xl font-serif font-bold mb-1">
            Connecte-toi pour voir tes favoris
          </p>
          <p className="text-sm text-muted-foreground">
            Retrouve les musiques que tu as aimées.
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
    <section className="h-full overflow-y-auto p-4 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Heart className="w-6 h-6 text-white fill-current" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">
            Vos musiques likées
          </h1>
          <p className="text-sm text-muted-foreground">
            {musiquesLikee.length}{" "}
            {musiquesLikee.length > 1 ? "titres" : "titre"}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {musiquesLikee.length === 0 ? (
          <p className="text-muted-foreground">
            Aucune musique likée pour le moment
          </p>
        ) : (
          musiquesLikee.map((musique, index) => (
            <TrackRow
              key={musique.id_music}
              musique={musique}
              index={index}
              setMusiquesLikee={setMusiquesLikee}
              setCurrentMusic={setCurrentMusic}
              setCurrentQueue={setCurrentQueue}
              queue={musiquesLikee}
              musiquesLikee={musiquesLikee}
              user={user}
              currentMusic={currentMusic}
            />
          ))
        )}
      </div>
    </section>
  );
}
