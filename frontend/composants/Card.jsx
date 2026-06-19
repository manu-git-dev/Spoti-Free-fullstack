export default function Card({ musique, onSelectMusique}) {
  const API_URL = "http://localhost:8000";
  const handleClick = () => {
    onSelectMusique(musique)
  }
  return (
    <article className="w-1/6 m-6 border p-4 rounded-2xl border-blue-500 h-1/2 flex flex-col cursor-pointer hover:shadow-2xl justify-center" onClick={handleClick}>
      <img
        src={`${API_URL}${musique.image}`}
        alt={`Pochette album ${musique.titre}`}
        className="w-full h-4/6 object-cover rounded-2xl"
      />
      <h2 className="text-center h-1/6 ">{musique.titre}</h2>
      <p className="text-center h-1/6 ">{musique.artiste.toUpperCase()}</p>
    </article>
  );
}
