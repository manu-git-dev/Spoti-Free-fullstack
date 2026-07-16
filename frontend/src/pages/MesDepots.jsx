import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Check, X, Inbox, UploadCloud, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import Page from "../composants/Page";

const STATUTS = {
  en_attente: {
    label: "En attente de validation",
    icone: Clock,
    classe: "text-muted-foreground bg-muted/40 border-border",
    explication:
      "Ta proposition a bien été reçue. Elle sera écoutée avant d'être publiée.",
  },
  approuve: {
    label: "Approuvé",
    icone: Check,
    classe: "text-success bg-success/10 border-success/40",
    explication:
      "Le morceau est en ligne : tu le retrouves dans la Bibliothèque.",
  },
  refuse: {
    label: "Refusé",
    icone: X,
    classe: "text-destructive bg-destructive/10 border-destructive/40",
    explication: null, // le motif du refus est affiche a la place
  },
};

export default function MesDepots({ user }) {
  const [depots, setDepots] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!user) {
      setChargement(false);
      return;
    }
    apiFetch("/api/submissions/mes-depots")
      .then(({ donnees }) => {
        setDepots(Array.isArray(donnees) ? donnees : []);
      })
      .catch((error) => console.error(error))
      .finally(() => setChargement(false));
  }, [user]);

  if (user === null) {
    return (
      <section className="h-full overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Inbox className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-xl font-serif font-bold mb-1">
            Connecte-toi pour suivre tes demandes
          </p>
          <p className="text-sm text-muted-foreground">
            Retrouve ici l'état de chaque morceau que tu as proposé.
          </p>
        </div>
        <Link
          to="/connexion"
          className={cn(buttonVariants(), "rounded-full px-6 mt-2")}
        >
          Connexion
        </Link>
      </section>
    );
  }

  return (
    <Page
      icone={Inbox}
      titre="Mes demandes de dépôt"
      sousTitre={`${depots.length} ${
        depots.length > 1 ? "propositions envoyées" : "proposition envoyée"
      }`}
      // Le retour vers le dépôt vivait au-dessus du titre. L'en-tête étant désormais figé, il
      // rejoint le bloc d'actions : il reste ainsi visible en permanence, au lieu de disparaître
      // au premier défilement.
      actions={
        <Link
          to="/deposer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Déposer une musique
        </Link>
      }
    >
      {chargement ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : depots.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-background/60 border border-border flex items-center justify-center">
            <UploadCloud className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-semibold">Aucune demande pour le moment</p>
          <p className="text-sm text-muted-foreground">
            Propose un morceau : il sera publié après validation.
          </p>
          <Link
            to="/deposer"
            className={cn(buttonVariants(), "rounded-full px-6 mt-2")}
          >
            Déposer une musique
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {depots.map((depot) => {
            const statut = STATUTS[depot.statut] ?? STATUTS.en_attente;
            const Icone = statut.icone;

            return (
              <li
                key={depot.id_submission}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{depot.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {depot.artist}
                    {depot.genre ? ` — ${depot.genre}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Envoyé le{" "}
                    {new Date(depot.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  {depot.statut === "refuse" && depot.motif_refus ? (
                    <p className="mt-2 text-sm text-destructive">
                      Motif : {depot.motif_refus}
                    </p>
                  ) : statut.explication ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {statut.explication}
                    </p>
                  ) : null}
                </div>

                <span
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs self-start ${statut.classe}`}
                >
                  <Icone className="w-3.5 h-3.5" />
                  {statut.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
