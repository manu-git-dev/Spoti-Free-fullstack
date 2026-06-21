import Card from "./Card";

export default function ListesCard({ musiques, onSelectMusique}) {


  return (
    <>
      {musiques.map((musique) => (
        <Card key={musique.id_music} musique={musique} onSelectMusique={onSelectMusique}/>
      ))}
    </>
  );
}
