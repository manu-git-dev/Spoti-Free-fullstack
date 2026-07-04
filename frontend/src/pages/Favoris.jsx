import { useState, useEffect } from "react";
import Card from "../composants/Card";
export default function Favoris({setCurrentMusic,musiquesLikee,setMusiquesLikee}) {

  useEffect(() => {
    const url = `http://localhost:3000/api/users/likes`;
    const token = localStorage.getItem("token");
    fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMusiquesLikee(data);
        } else {
          setMusiquesLikee([]);
        }
      })
      .catch((error) => console.error(error));
  }, []);

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
              setMusiqueslike={setMusiquesLikee}
              setCurrentMusic={setCurrentMusic}
            />
          ))
        )}
      </section>
    </>
  );
}
