import { useState, useEffect } from "react";
import Card from "../composants/Card";
export default function Favoris({setCurrentMusic,musiquesLikee,setMusiquesLikee}) {

  return (
    <>
      <h1>Vos musiques likées : </h1>
      <section className="grid grid-cols-5 gap-4 overflow-y-auto h-[calc(100%-4rem)]">
        {musiquesLikee.length === 0 ? (
          <div>Aucune musiques de likées</div>
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
      </section>
    </>
  );
}
