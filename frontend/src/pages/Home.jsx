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

// Les pastilles de genre portaient un degrade arc-en-ciel calcule sur le rang (teinte =
// rang / total * 360). Retire le 2026-07-25 : ces couleurs etaient choisies HORS du theme, en HSL
// en dur, donc elles ne suivaient ni le clair ni le sombre et juraient avec le reste de la page.
//
// Un genre n'est pas une donnee quantitative ni une categorie qu'on doit distinguer d'un coup
// d'oeil : son libelle est ecrit dessus. La couleur ne portait donc aucune information — elle
// n'etait que du bruit, et douze bruits differents sur une meme rangee.
//
// Elles utilisent maintenant la meme surface que les cartes du Top 5 (`CarteClassement`) :
// `bg-background/50` + `border-border`. C'est ce que la regle des surfaces impose pour ce qui vit
// DANS un panneau — et le `main` est `bg-card` (voir App.jsx). Toute la page se lit ainsi comme un
// seul systeme, au lieu d'une rangee qui crie au milieu des autres.

export default function Home({
  musiques,
  top5,
  setCurrentMusic,
  setCurrentQueue,
  user,
  musiquesLikee,
  setMusiquesLikee,
  fermerSession,
  currentMusic,
  genresDisponibles,
  setGenreFiltre,
  historique,
}) {
  // `top5` vient de GET /api/musics/top : un vrai classement par nombre d'ecoutes.
  const topCinq = top5;

  // "A decouvrir" : une poignee de titres au hasard. `useMemo` pour ne tirer qu'UNE fois par
  // chargement du catalogue — sans lui, la selection se remelangerait a chaque rendu (chaque like,
  // chaque lecture) et danserait sous les yeux. Fisher-Yates, comme le shuffle du lecteur.
  const aDecouvrir = useMemo(() => {
    const copie = [...musiques];
    for (let i = copie.length - 1; i > 0; i--) {
      // eslint-disable-next-line react-hooks/purity -- hasard VOULU, memoise sur [musiques] : ne se retire qu'au chargement du catalogue, pas a chaque rendu
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
      //
      // DECONNECTE -> masque sous `md` : connexion et inscription sont reprises dans le menu du
      // `HeaderMobile`, ou elles ont davantage leur place (ce sont des navigations, pas des
      // actions de page). Elles restent ICI sur bureau, ou il n'existe aucune autre porte
      // d'entree — l'`Aside` n'en porte pas.
      //
      // CONNECTE -> sur la meme ligne que le titre, cale a droite. Sur mobile il ne reste que
      // l'avatar (voir plus bas), et un seul element etroit tient sans probleme a cote de
      // « Bonjour Manu » — c'est la place naturelle d'un acces au profil, en haut a droite.
      actionsMobile={user === null ? "masquees" : "a_cote"}
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
            {/* Masquee sur mobile : le bouton et l'avatar ne tiennent pas ensemble a cote du
                titre a 390px. On garde l'avatar, parce qu'il MENE a la page Profil — et c'est
                precisement la que vit l'autre bouton « Se deconnecter » (`Profil.jsx`), a un
                appui de la BottomNav. Rien n'est donc perdu : la deconnexion reste joignable,
                elle n'est simplement plus dupliquee sur l'accueil.

                Ici un simple `hidden` SUFFIT, contrairement au bloc `actions` d'EnTetePage :
                l'element masque est lui-meme l'enfant du flex, et `display:none` le retire
                entierement du calcul — donc aucun `gap-3` fantome. */}
            <div className="hidden md:block">
              <Deconnexion fermerSession={fermerSession} />
            </div>
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

        {/* Perso : écoutés récemment (connecte + au moins une écoute). L'historique est déjà
            ordonné du plus récent au plus ancien côté serveur (ORDER BY ecoute_at DESC). */}
        {user !== null && historique.length > 0 ? (
          <section>
            <EnTeteRangee titre="Écoutés récemment" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <ListesCard
                musiques={historique}
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
              {genresDisponibles.map(({ genre, nombre }) => (
                <Link
                  key={genre}
                  to="/bibliotheque"
                  onClick={() => setGenreFiltre(genre)}
                  className="relative flex h-24 flex-col justify-between overflow-hidden rounded-xl border border-border bg-background/50 p-4 transition-all hover:border-accent hover:bg-background/80 hover:shadow-lg hover:shadow-primary/10"
                >
                  {/* `text-foreground` / `text-muted-foreground` et non `text-white` : le blanc
                      n'etait lisible que parce que le degrade etait toujours sombre. Sur une
                      surface du theme, il disparaitrait en theme clair. */}
                  <span className="font-semibold capitalize text-foreground">
                    {genre}
                  </span>
                  <span className="text-xs text-muted-foreground">
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