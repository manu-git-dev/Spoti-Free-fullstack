import { useState } from "react";
import { List, LayoutGrid } from "lucide-react";
import ListesCard from "../composants/ListesCard";
import TrackRow from "../composants/TrackRow";
import { Input } from "@/components/ui/input";

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
        <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-serif font-bold shrink-0">
          <span className="h-7 w-1 rounded-full bg-gradient-to-b from-primary to-accent" />
          Bibliothèque
        </h1>
        <Input
          type="text"
          value={valueInput}
          onChange={(e) => setValueInput(e.target.value)}
          placeholder="Recherchez un titre ou un artiste"
          className="rounded-full bg-background/60 w-full md:w-96"
        />
        <div className="flex items-center gap-1 bg-background/60 border border-border rounded-full p-1 self-end md:self-auto md:ml-auto">
          <button
            onClick={() => setViewMode("liste")}
            aria-label="Affichage liste"
            className={`p-2 rounded-full transition-colors ${
              viewMode === "liste"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grille")}
            aria-label="Affichage grille"
            className={`p-2 rounded-full transition-colors ${
              viewMode === "grille"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
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
