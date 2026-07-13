import Card from "./Card";

export default function ListesCard({ musiques, setCurrentMusic, setCurrentQueue, musiquesLikee , setMusiquesLikee, user, currentMusic}) {


  return (
    <>
      {musiques.map((musique) => (
        <Card key={musique.id_music} musique={musique} setCurrentMusic={setCurrentMusic} setCurrentQueue={setCurrentQueue} queue={musiques} musiquesLikee={musiquesLikee} setMusiquesLikee={setMusiquesLikee} user={user} currentMusic={currentMusic}/>
      ))}
    </>
  );
}
