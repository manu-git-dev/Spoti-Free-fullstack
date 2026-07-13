import { useState } from "react";
import { List, LayoutGrid } from "lucide-react";
import ListesCard from "../composants/ListesCard";
import TrackRow from "../composants/TrackRow";

export default function Bibliotheque({
  musiques,
  setCurrentMusic,
  setCurrentQueue,
  setValueInput,
  valueInput,
  musiquesLikee,
  setMusiquesLikee,
  user,
  currentMusic,
}) {
  const [viewMode, setViewMode] = useState("liste");

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
        <div className="flex items-center gap-1 bg-base-200 rounded-full p-1 self-end md:self-auto md:ml-auto">
          <button
            onClick={() => setViewMode("liste")}
            aria-label="Affichage liste"
            className={`p-2 rounded-full transition-colors ${
              viewMode === "liste"
                ? "bg-accent text-accent-content"
                : "text-base-content/50 hover:text-base-content"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grille")}
            aria-label="Affichage grille"
            className={`p-2 rounded-full transition-colors ${
              viewMode === "grille"
                ? "bg-accent text-accent-content"
                : "text-base-content/50 hover:text-base-content"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
      {viewMode === "grille" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-y-auto h-[calc(100%-6rem)] p-1">
          <ListesCard
            musiques={musiques}
            setCurrentMusic={setCurrentMusic}
            setCurrentQueue={setCurrentQueue}
            musiquesLikee={musiquesLikee}
            setMusiquesLikee={setMusiquesLikee}
            user={user}
            currentMusic={currentMusic}
          />
        </div>
      ) : (
<div className="flex flex-col gap-1 overflow-y-auto h-[calc(100%-6rem)] p-1">
        {musiques.map((musique, index) => (
          <TrackRow
            key={musique.id_music}
            musique={musique}
            index={index}
            setCurrentMusic={setCurrentMusic}
            setCurrentQueue={setCurrentQueue}
            queue={musiques}
            musiquesLikee={musiquesLikee}
            setMusiquesLikee={setMusiquesLikee}
            user={user}
            currentMusic={currentMusic}
          />
        ))}
      </div>
      )}
    </section>
  );
}
