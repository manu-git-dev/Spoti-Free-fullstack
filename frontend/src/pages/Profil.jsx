import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User as UserIcon } from "lucide-react";
import Deconnexion from "../composants/Deconnexion";
import EnTetePage from "../composants/EnTetePage";
import { apiFetch } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <section className="h-full overflow-y-auto p-4 md:p-8">
        <div className="max-w-xl mx-auto space-y-6">
          <EnTetePage icone={UserIcon} titre="Mon profil" />
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

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background/50 px-2 py-4">
              <p className="text-2xl font-bold text-primary">
                {playlists.length}
              </p>
              <p className="text-xs text-muted-foreground">playlists</p>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background/50 px-2 py-4">
              <p className="text-2xl font-bold text-accent">
                {musiquesLikee.length}
              </p>
              <p className="text-xs text-muted-foreground">favoris</p>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background/50 px-2 py-4">
              <p className="text-lg font-bold text-chart-2">
                {infoUser.created_at
                  ? new Date(infoUser.created_at).toLocaleDateString("fr-FR", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">membre depuis</p>
            </div>
          </div>

          <div className="flex justify-center">
            <Deconnexion setUser={setUser} setToken={setToken} />
          </div>
        </div>
      </section>
    );
  }
}
