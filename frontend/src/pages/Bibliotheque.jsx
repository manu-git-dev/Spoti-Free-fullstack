import { useState } from "react";
import { List, LayoutGrid, Library } from "lucide-react";
import ListesCard from "../composants/ListesCard";
import Page from "../composants/Page";
import TrackRow from "../composants/TrackRow";
import { Input } from "@/components/ui/input";

// Une pastille de filtre. Le composant existe pour que l'etat actif se decrive a UN endroit :
// c'est exactement le mecanisme par lequel les tailles de titres avaient diverge entre A propos
// et Mentions legales.
//
// `aria-pressed` et non un simple `onClick` : pour un lecteur d'ecran, un bouton qui ne dit pas
// s'il est enfonce est un bouton dont on ne sait pas s'il a agi. La couleur seule ne suffit pas.
function Pastille({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm transition-colors cursor-pointer ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background/60 text-muted-foreground hover:border-accent hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default function Bibliotheque({
  musiques,
  setCurrentMusic,
  setCurrentQueue,
  setValueInput,
  valueInput,
  genresDisponibles,
  genreFiltre,
  setGenreFiltre,
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
      actionsLarges
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
      {/* Les pastilles de genre.
          Elles vivent DANS la zone de defilement et non dans l'en-tete : l'en-tete accueille
          deja la recherche et le choix d'affichage, et sur un ecran etroit une troisieme rangee
          le ferait grossir au point de manger la liste qu'il est cense coiffer. */}
      {genresDisponibles?.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Pastille
            active={genreFiltre === null}
            onClick={() => setGenreFiltre(null)}
          >
            Tous
          </Pastille>
          {genresDisponibles.map(({ genre, nombre }) => (
            <Pastille
              key={genre}
              active={genreFiltre === genre}
              // Recliquer sur le genre actif le desactive : sans ca, il n'y aurait aucun moyen
              // de revenir en arriere sans viser « Tous ».
              onClick={() =>
                setGenreFiltre(genreFiltre === genre ? null : genre)
              }
            >
              {genre}
              <span className="ml-1.5 opacity-60 tabular-nums">{nombre}</span>
            </Pastille>
          ))}
        </div>
      ) : null}

      {musiques.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          Aucun morceau ne correspond.
        </p>
      ) : viewMode === "grille" ? (
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
