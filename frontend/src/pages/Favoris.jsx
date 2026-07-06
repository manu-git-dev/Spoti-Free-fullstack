import { useState, useEffect } from "react";
import Card from "../composants/Card";
export default function Favoris({setCurrentMusic,musiquesLikee,setMusiquesLikee}) {

  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      <h1 className="text-2xl font-serif mb-6">Vos musiques likées</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {musiquesLikee.length === 0 ? (
          <div className="text-base-content/70 col-span-2 md:col-span-5">
            Aucune musique likée pour le moment
          </div>
        ) : (
          musiquesLikee.map((musique) => (
            <Card
              key={musique.id_music}
              musique={musique}
              setMusiquesLikee={setMusiquesLikee}
              setCurrentMusic={setCurrentMusic}
              musiquesLikee={musiquesLikee}
            />
          ))
        )}
      </div>
    </section>
  );
}
