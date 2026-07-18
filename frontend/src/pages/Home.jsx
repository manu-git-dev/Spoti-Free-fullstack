import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Home as IconeAccueil } from "lucide-react";
import Deconnexion from "../composants/Deconnexion";
import CarteClassement from "../composants/CarteClassement";
import ListesCard from "../composants/ListesCard";
import Page from "../composants/Page";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// En-tete de rangee, defini UNE fois : toutes les sections de l'accueil partagent la meme taille
// et le meme liseret. Un <h2> reecrit par section, c'est exactement comme ca que les tailles de
// titres divergent (cf. la regle "Typographie" du CLAUDE.md). Le `lien` optionnel affiche un
// "Voir tout" a droite (favoris -> page Favoris).
function EnTeteRangee({ titre, lien }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <span className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-accent" />
        {titre}
      </h2>
      {lien ? (
        <Link
          to={lien}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          Voir tout
        </Link>
      ) : null}
    </div>
  );
}

// Degrade unique par pastille de genre. Plutot qu'une palette fixe (qui se repete des qu'il y a
// plus de genres que de couleurs), on repartit les genres sur TOUT le cercle chromatique : la
// teinte est `rang / total * 360`, donc chaque carte tombe sur une teinte differente, regulierement
// espacee. Comme elle vient du rang et non de `index % colonnes`, aucun banding vertical. Une
// palette de marque (primary/accent/secondary) ne pourrait pas garantir l'unicite ; c'est le choix
// assume "arc-en-ciel", comme les tuiles de genre de Spotify.
function styleDegradeGenre(rang, total) {
  const teinte = Math.round((rang * 360) / Math.max(total, 1));
  return {
    backgroundImage: `linear-gradient(135deg, hsl(${teinte} 62% 42%), hsl(${
      (teinte + 40) % 360
    } 70% 55%))`,
  };
}

export default function Home({
  musiques,
  top5,
  setCurrentMusic,
  setCurrentQueue,
  user,
  musiquesLikee,
  setMusiquesLikee,
  setUser,
  setToken,
  currentMusic,
  genresDisponibles,
  setGenreFiltre,
}) {
  // `top5` vient de GET /api/musics/top : un vrai classement par nombre d'ecoutes.
  const topCinq = top5;

  // "A decouvrir" : une poignee de titres au hasard. `useMemo` pour ne tirer qu'UNE fois par
  // chargement du catalogue — sans lui, la selection se remelangerait a chaque rendu (chaque like,
  // chaque lecture) et danserait sous les yeux. Fisher-Yates, comme le shuffle du lecteur.
  const aDecouvrir = useMemo(() => {
    const copie = [...musiques];
    for (let i = copie.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie.slice(0, 10);
  }, [musiques]);

  // Apercu des favoris sur l'accueil : les 5 premiers, le reste est derriere "Voir tout".
  const favorisApercu = musiquesLikee.slice(0, 5);

  return (
    <Page
      icone={IconeAccueil}
      titre={user === null ? "Bonjour" : `Bonjour ${user.pseudo}`}
      sousTitre="Prêt à écouter quelque chose ?"
      // L'accueil avait son propre en-tete, plus grand que celui des autres pages et sans icone.
      // Il correspondait pourtant exactement au modele d'`EnTetePage` : un titre, un sous-titre,
      // et un bloc a droite. Le cas particulier n'en etait pas un.
      actions={
        user === null ? (
          <div className="flex items-center justify-end gap-4 shrink-0">
            <Link
              to={"/inscription"}
              className="text-foreground hover:text-primary underline-offset-4 hover:underline"
            >
              S'inscrire
            </Link>
            <Link
              to="/connexion"
              className={cn(buttonVariants(), "rounded-full px-6")}
            >
              Connexion
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 shrink-0">
            <Deconnexion setUser={setUser} setToken={setToken} />
            <Link
              to={"/profil"}
              className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white ring-2 ring-primary/30 hover:ring-primary transition"
            >
              {user.pseudo?.charAt(0).toUpperCase()}
            </Link>
          </div>
        )
      }
    >
      {/* L'accueil est un EMPILEMENT de rangees. Certaines sont globales (Top, genres, decouvrir)
          et s'affichent pour tout le monde, connecte ou non — c'est le socle qui donne de la vie
          a la page meme deconnecte. La rangee personnelle (favoris) s'ajoute par-dessus quand
          `user !== null`. Chaque section ne se rend que si elle a de la donnee : pas de titre
          suspendu au-dessus d'une grille vide. */}
      <div className="flex flex-col gap-10">
        {/* Global : top des ecoutes */}
        {topCinq.length > 0 ? (
          <section>
            <EnTeteRangee titre="Top 5 des titres les plus écoutés" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {topCinq.map((musique, index) => (
                <CarteClassement
                  key={musique.id_music}
                  musique={musique}
                  rang={index + 1}
                  setCurrentMusic={setCurrentMusic}
                  setCurrentQueue={setCurrentQueue}
                  queue={topCinq}
                  musiquesLikee={musiquesLikee}
                  setMusiquesLikee={setMusiquesLikee}
                  user={user}
                  currentMusic={currentMusic}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Perso : tes favoris (connecte + au moins un like) */}
        {user !== null && favorisApercu.length > 0 ? (
          <section>
            <EnTeteRangee titre="Tes favoris" lien="/favoris" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <ListesCard
                musiques={favorisApercu}
                setCurrentMusic={setCurrentMusic}
                setCurrentQueue={setCurrentQueue}
                musiquesLikee={musiquesLikee}
                setMusiquesLikee={setMusiquesLikee}
                user={user}
                currentMusic={currentMusic}
              />
            </div>
          </section>
        ) : null}

        {/* Global : parcourir par genre. Chaque pastille pose le filtre de genre puis mene a la
            Bibliotheque, qui l'applique. `setGenreFiltre` est l'etat partage de `App` — on ne
            reimplemente pas un filtrage ici. */}
        {genresDisponibles?.length > 0 ? (
          <section>
            <EnTeteRangee titre="Parcourir par genre" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {genresDisponibles.map(({ genre, nombre }, index) => (
                <Link
                  key={genre}
                  to="/bibliotheque"
                  onClick={() => setGenreFiltre(genre)}
                  style={styleDegradeGenre(index, genresDisponibles.length)}
                  className="relative flex h-24 flex-col justify-between overflow-hidden rounded-xl p-4 transition hover:scale-[1.02]"
                >
                  <span className="font-semibold capitalize text-white">
                    {genre}
                  </span>
                  <span className="text-xs text-white/80">
                    {nombre} {nombre > 1 ? "titres" : "titre"}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Global : selection au hasard */}
        {aDecouvrir.length > 0 ? (
          <section>
            <EnTeteRangee titre="À découvrir" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <ListesCard
                musiques={aDecouvrir}
                setCurrentMusic={setCurrentMusic}
                setCurrentQueue={setCurrentQueue}
                musiquesLikee={musiquesLikee}
                setMusiquesLikee={setMusiquesLikee}
                user={user}
                currentMusic={currentMusic}
              />
            </div>
          </section>
        ) : null}
      </div>
    </Page>
  );
}