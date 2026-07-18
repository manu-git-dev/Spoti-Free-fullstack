import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User as UserIcon,
  ListMusic,
  Heart,
  CalendarDays,
} from "lucide-react";
import Deconnexion from "../composants/Deconnexion";
import SupprimerCompte from "../composants/SupprimerCompte";
import Page from "../composants/Page";
import { apiFetch } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Une tuile de statistique : la valeur en gros, puis une ligne "icone + libelle" dessous, le tout
// CALE A GAUCHE. (Avant : valeur a gauche / libelle a droite via `justify-between`, pense pour une
// colonne verticale etroite.) L'icone reprend la couleur de la valeur (`classe`) pour lier les
// deux ; le libelle passe en capitales espacees et un peu plus gras, plus present que le `text-xs`
// gris d'origine.
function Stat({ valeur, libelle, classe, icone: Icone }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-background/50 px-5 py-4">
      <span className={`text-2xl font-bold leading-tight ${classe}`}>
        {valeur}
      </span>
      <span className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {Icone ? <Icone className={`h-4 w-4 shrink-0 ${classe}`} /> : null}
        {libelle}
      </span>
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
        {/* Trois blocs EMPILES (identite -> stats -> actions), l'ordre du DOM donnant l'ordre a
            l'ecran (mobile comme desktop) : les actions restent en bas, plus coincees entre les
            blocs d'info comme dans l'ancienne version deux colonnes.

            `max-w-[1600px]` et jamais `mx-auto` : sur un portable le contenu fait moins de 1600px,
            donc les cartes sont pleine largeur ; sur un tres grand ecran (2560/4K), la borne les
            empeche de s'etirer. Plafond plus large que les pages a deux colonnes (`max-w-6xl` =
            1152px) : un empilement a besoin de plus de place pour remplir sans laisser de vide sur
            un portable large. Choix tranche avec Manuel (2026-07-18), qui a assume d'elargir la
            regle "Largeurs" pour cette page. Le test e2e a une limite propre a Profil (1700px).

            Pas d'enveloppe grise : le contenu EST deja fait de panneaux (`bg-background/50`). */}
        <div className="flex flex-col gap-6 max-w-[1600px]">
          {/* Identite */}
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

          {/* Stats — rangee de 3 tuiles (empilees sur mobile) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat
              valeur={playlists.length}
              libelle="playlists"
              classe="text-primary"
              icone={ListMusic}
            />
            <Stat
              valeur={musiquesLikee.length}
              libelle="favoris"
              classe="text-accent"
              icone={Heart}
            />
            <Stat
              valeur={
                infoUser.created_at
                  ? new Date(infoUser.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"
              }
              libelle="membre depuis"
              classe="text-chart-2"
              icone={CalendarDays}
            />
          </div>

          {/* Deconnexion, puis suppression separee par un trait : action definitive et discrete,
              elle ne doit pas se trouver sous le doigt de quelqu'un qui cherchait juste a se
              deconnecter. */}
          <div className="flex justify-center">
            <Deconnexion setUser={setUser} setToken={setToken} />
          </div>
          <div className="flex justify-center border-t border-border pt-4">
            <SupprimerCompte setUser={setUser} setToken={setToken} />
          </div>
        </div>
      </Page>
    );
  }
}
