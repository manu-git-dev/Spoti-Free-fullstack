import ButtonLike from "./ButtonLike";

export default function Card({ musique, onSelectMusique,user }) {
  const API_URL = "http://localhost:3000/";
  const handleClick = () => {
    onSelectMusique(musique);
  };
  return (
    <article
      className="border rounded-2xl border-blue-500 flex flex-col cursor-pointer hover:shadow-2xl justify-center"
      
    >
      <div onClick={handleClick}>
        <img
          src={`${API_URL}${musique.src_image}`}
          alt={`Pochette album ${musique.title}`}
          className="w-full h-4/6 object-cover rounded-2xl"
        />
        <h2 className="text-center h-1/6 ">{musique.title}</h2>
        <p className="text-center h-1/6 ">{musique.artist.toUpperCase()}</p>
      </div>
      <ButtonLike idMusic = {musique.id_music} />
    </article>
  );
}
