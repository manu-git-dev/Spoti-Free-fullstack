import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import TrackRow from "../composants/TrackRow";
export default function Favoris({setCurrentMusic,setCurrentQueue,musiquesLikee,setMusiquesLikee,user,currentMusic}) {

  if (user === null) {
    return (
      <section className="h-full overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
          <Heart className="w-7 h-7 text-base-content/40" />
        </div>
        <div>
          <p className="text-xl font-serif font-bold mb-1">
            Connecte-toi pour voir tes favoris
          </p>
          <p className="text-sm text-base-content/60">
            Retrouve les musiques que tu as aimées.
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
      <h1 className="text-2xl font-serif mb-6">Vos musiques likées</h1>
      <div className="flex flex-col gap-1">
        {musiquesLikee.length === 0 ? (
          <p className="text-base-content/70">
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
