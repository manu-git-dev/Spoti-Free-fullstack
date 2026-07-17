import { Link } from "react-router-dom";
import { Home as IconeAccueil } from "lucide-react";
import Deconnexion from "../composants/Deconnexion";
import CarteClassement from "../composants/CarteClassement";
import Page from "../composants/Page";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home({
  top5,
  setCurrentMusic,
  setCurrentQueue,
  user,
  musiquesLikee,
  setMusiquesLikee,
  setUser,
  setToken,
  currentMusic,
}) {
  // `top5` vient de GET /api/musics/top : un vrai classement par nombre d'ecoutes.
  // (Avant : un `.slice(0, 5)` de la bibliotheque triee par titre — donc pas un top du tout.)
  const topCinq = top5;

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
      <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
        <span className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-accent" />
        Top 5 des titres les plus écoutés
      </h2>
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
    </Page>
  );
}
