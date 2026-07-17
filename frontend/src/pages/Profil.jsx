import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User as UserIcon } from "lucide-react";
import Deconnexion from "../composants/Deconnexion";
import SupprimerCompte from "../composants/SupprimerCompte";
import Page from "../composants/Page";
import { apiFetch } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Un chiffre du profil. En pile verticale (colonne de droite), le chiffre a GAUCHE et son libelle
// a DROITE se lisent mieux qu'empiles : l'oeil descend une colonne de chiffres alignes.
function Stat({ valeur, libelle, classe }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-xl border border-border bg-background/50 px-4 py-3">
      <span className={`text-2xl font-bold ${classe}`}>{valeur}</span>
      <span className="text-xs text-muted-foreground">{libelle}</span>
    </div>
  );
}

export default function Profil({
  user,
  musiquesLikee,
  setUser,
  token,
  setToken,
  playlists,
}) {
  const [infoUser, setInfoUser] = useState({});

  useEffect(() => {
    if (!token) {
      return;
    }
    apiFetch("/api/users/profil")
      .then(({ donnees }) => {
        setInfoUser(donnees ?? {});
      })
      .catch((error) => console.error(error));
  }, [token]);
  if (user === null) {
    return (
      <section className="h-full overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <UserIcon className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-xl font-serif font-bold mb-1">
            Connecte-toi pour voir ton profil
          </p>
          <p className="text-sm text-muted-foreground">
            Retrouve tes playlists, tes favoris et tes infos de compte.
          </p>
        </div>
        <div className="flex items-center gap-4 mt-2">
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
      </section>
    );
  } else {
    return (
      <Page icone={UserIcon} titre="Mon profil">
        {/* DEUX COLONNES — meme agencement que `Deposer.jsx`. Rien n'est invente pour remplir : les
            3 chiffres existaient deja, ils passent simplement a droite, en pile verticale au lieu
            d'une rangee de 3. A gauche, ce qui concerne l'identite et les actions.

            Pas d'enveloppe grise ici, contrairement aux pages de prose : le contenu de cette page
            EST deja fait de panneaux (`bg-background/50`). Un panneau autour rendrait ceux du
            dedans invisibles — meme fond sur meme fond. */}
        <div className="grid max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,42rem)_minmax(0,22rem)]">
        <div className="space-y-6">
          <div className="relative overflow-hidden flex flex-col items-center text-center gap-3 rounded-2xl border border-border bg-background/50 p-6 md:flex-row md:text-left md:items-center md:gap-6">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/25 via-secondary/10 to-transparent"
            />
            <div className="relative w-20 h-20 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-white ring-4 ring-primary/20">
              {infoUser.pseudo?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="relative">
              <p className="text-xl font-serif font-bold">
                {infoUser.first_name?.charAt(0).toUpperCase()}
                {infoUser.first_name?.slice(1).toLowerCase()}{" "}
                <span className="uppercase">{infoUser.last_name}</span>
              </p>
              <p className="text-sm text-muted-foreground">{infoUser.pseudo}</p>
              <p className="text-sm text-muted-foreground">{infoUser.email}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <Deconnexion setUser={setUser} setToken={setToken} />
          </div>

          {/* La suppression du compte est separee du reste par un trait et reste discrete :
              c'est une action definitive, elle ne doit pas se trouver sous le doigt de
              quelqu'un qui cherchait juste a se deconnecter. */}
          <div className="flex justify-center border-t border-border pt-4">
            <SupprimerCompte setUser={setUser} setToken={setToken} />
          </div>
        </div>

        <aside className="flex flex-col gap-3">
          <Stat valeur={playlists.length} libelle="playlists" classe="text-primary" />
          <Stat
            valeur={musiquesLikee.length}
            libelle="favoris"
            classe="text-accent"
          />
          <Stat
            valeur={
              infoUser.created_at
                ? new Date(infoUser.created_at).toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"
            }
            libelle="membre depuis"
            classe="text-chart-2"
          />
        </aside>
        </div>
      </Page>
    );
  }
}
