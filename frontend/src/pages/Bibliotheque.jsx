import { useState } from "react";
import { List, LayoutGrid, Library } from "lucide-react";
import ListesCard from "../composants/ListesCard";
import Page from "../composants/Page";
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
    <Page
      icone={Library}
      titre="Bibliothèque"
      actions={
        <div className="flex items-center gap-3">
          <Input
            type="text"
            value={valueInput}
            onChange={(e) => setValueInput(e.target.value)}
            placeholder="Recherchez un titre ou un artiste"
            className="rounded-full bg-background/60 w-full md:w-96"
          />
          <div className="flex items-center gap-1 shrink-0 bg-background/60 border border-border rounded-full p-1">
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
      }
    >
      {viewMode === "grille" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
        <div className="flex flex-col gap-1">
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
    </Page>
  );
}
