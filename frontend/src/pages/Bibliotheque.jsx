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
      // `shrink-0` : sur mobile la rangee ne passe plus a la ligne, elle DEFILE. Sans ca, flexbox
      // comprimerait les pastilles pour les faire tenir de force et casserait les libelles.
      className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors cursor-pointer ${
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
          le ferait grossir au point de manger la liste qu'il est cense coiffer.

          SUR MOBILE, UNE SEULE RANGEE QUI DEFILE (tranche par Manuel le 2026-07-22). Le
          `flex-wrap` les repartissait sur QUATRE rangees aux bords en dents de scie : les 10
          pastilles font de 58 a 101px de large, et a 390px la largeur utile (~334px) n'en laisse
          passer que trois. Une grille reglerait l'alignement mais garderait les 4 rangees, avec
          un trou en fin de derniere ligne — et elle regrossirait a chaque genre ajoute au
          catalogue.
          La rangee qui defile a une hauteur FIXE quel que soit le nombre de genres. C'est le
          modele des applications musicales, et l'indice de defilement est gratuit : la derniere
          pastille visible est coupee par le bord, ce qui se lit comme « il y en a d'autres ».
          A partir de `sm`, la place ne manque plus : on revient au `flex-wrap`.

          La barre de defilement est masquee (`scrollbar-width` + le pseudo-element WebKit) : sur
          mobile elle est deja en surimpression et disparait au repos, mais elle apparaitrait sur
          un ecran tactile de bureau entre `xs` et `sm` et couperait la rangee en deux. */}
      {genresDisponibles?.length > 0 ? (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-x-visible">
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
