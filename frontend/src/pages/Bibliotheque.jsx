import ListesCard from "../composants/ListesCard";

export default function Bibliotheque({
  musiques,
  setCurrentMusic,
  setValueInput,
  valueInput,
  musiquesLikee,
  setMusiquesLikee,
  user,
  currentMusic,
}) {
  return (
    <section className="h-full overflow-hidden p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-4">
        <h1 className="text-2xl font-serif">Bibliothèque</h1>
        <input
          type="text"
          value={valueInput}
          onChange={(e) => setValueInput(e.target.value)}
          placeholder="Recherchez un titre ou un artiste"
          className="input input-bordered rounded-2xl w-full md:w-96 placeholder:text-base-content/50"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-y-auto h-[calc(100%-6rem)] p-1">
        <ListesCard
          musiques={musiques}
          setCurrentMusic={setCurrentMusic}
          musiquesLikee={musiquesLikee}
          setMusiquesLikee={setMusiquesLikee}
          user={user}
          currentMusic={currentMusic}
        />
      </div>
    </section>
  );
}
