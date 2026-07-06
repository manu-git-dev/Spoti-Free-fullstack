import { useState, useEffect } from "react";
import TrackRow from "../composants/TrackRow";
export default function Favoris({setCurrentMusic,musiquesLikee,setMusiquesLikee,user,currentMusic}) {

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
