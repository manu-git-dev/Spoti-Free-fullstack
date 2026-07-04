import Card from "./Card";

export default function ListesCard({ musiques, setCurrentMusic , musiquesLikee , setMusiquesLikee}) {


  return (
    <>
      {musiques.map((musique) => (
        <Card key={musique.id_music} musique={musique} setCurrentMusic={setCurrentMusic} musiquesLikee={musiquesLikee} setMusiquesLikee={setMusiquesLikee}/>
      ))}
    </>
  );
}
