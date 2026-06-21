import { useState, useEffect } from "react";
import Card from "../composants/Card";
export default function Favoris() {
  const [musiquesLikee, setMusiquesLikee] = useState([]);
  

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
        setMusiquesLikee(data);
      })
      .catch((error) => console.error(error));
  }, []);

  return (
    <>
    <h1>Vos musiques likées : </h1>
      <section className="grid grid-cols-5 gap-4 overflow-y-auto h-[calc(100%-4rem)]">
        {musiquesLikee.map((musique) => (
          <Card key={musique.id_music} musique={musique} />
        ))}
      </section>
    </>
  );
}
