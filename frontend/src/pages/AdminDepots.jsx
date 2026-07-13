import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ShieldCheck, Check, X, Inbox, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  LecteurDepot,
  ApercuPochette,
  LienTelechargement,
} from "../composants/FichierDepot";
import { apiFetch, messageErreur } from "@/lib/api";

export default function AdminDepots({ user }) {
  const [depots, setDepots] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [depotARefuser, setDepotARefuser] = useState(null);
  const [motif, setMotif] = useState("");

  useEffect(() => {
    apiFetch("/api/submissions?statut=en_attente")
      .then(({ donnees }) => {
        setDepots(Array.isArray(donnees) ? donnees : []);
      })
      .catch((error) => console.error(error))
      .finally(() => setChargement(false));
  }, []);

  // Ce test n'est QUE du confort : il evite d'afficher une page vide a un non-admin.
  // La vraie protection est `adminMiddleware`, cote serveur — quelqu'un qui trafiquerait son
  // localStorage verrait cette page, mais toutes ses requetes seraient refusees en 403.
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  async function traiter(depot, action) {
    const corps = action === "refuser" ? { motif } : undefined;

    try {
      const { reponse, donnees } = await apiFetch(
        `/api/submissions/${depot.id_submission}/${action}`,
        { method: "PATCH", ...(corps ? { body: corps } : {}) },
      );

      if (!reponse.ok) {
        const message = messageErreur(reponse, donnees);
        if (message) toast.error(message);
        return;
      }

      toast.success(donnees.message);
      setDepots((prev) =>
        prev.filter((d) => d.id_submission !== depot.id_submission),
      );
      setDepotARefuser(null);
      setMotif("");
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }

  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">
            Modération des dépôts
          </h1>
          <p className="text-sm text-muted-foreground">
            {depots.length} {depots.length > 1 ? "dépôts" : "dépôt"} en attente
          </p>
        </div>
      </div>

      {chargement ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : depots.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-background/60 border border-border flex items-center justify-center">
            <Inbox className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-semibold">Aucun dépôt en attente</p>
          <p className="text-sm text-muted-foreground">
            Les nouvelles propositions apparaîtront ici.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {depots.map((depot) => (
            <li
              key={depot.id_submission}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-background/50 p-4 lg:flex-row lg:items-center"
            >
              {/* Apercu de la pochette : cliquable pour l'ouvrir en grand et verifier les
                  droits d'image. */}
              <ApercuPochette
                idSubmission={depot.id_submission}
                aPochette={Boolean(depot.a_pochette)}
                titre={depot.title}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">{depot.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {depot.artist}
                  {depot.genre ? ` — ${depot.genre}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Déposé par <span className="text-primary">{depot.pseudo}</span>
                  {depot.created_at
                    ? ` le ${new Date(depot.created_at).toLocaleDateString("fr-FR")}`
                    : ""}
                </p>

                {!depot.a_pochette ? (
                  <p className="mt-1 text-xs text-muted-foreground italic">
                    Sans pochette — une pochette du catalogue sera tirée au hasard
                    à l'approbation.
                  </p>
                ) : null}

                {/* Telecharger pour verifier les droits (audio et image). */}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <LienTelechargement
                    chemin={`/api/submissions/${depot.id_submission}/audio`}
                    nomFichier={`${depot.artist} - ${depot.title}.mp3`}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Télécharger l'audio
                  </LienTelechargement>

                  <LienTelechargement
                    chemin={`/api/submissions/${depot.id_submission}/image`}
                    nomFichier={`${depot.artist} - ${depot.title}.jpg`}
                    actif={Boolean(depot.a_pochette)}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Télécharger la pochette
                  </LienTelechargement>
                </div>
              </div>

              {/* Ecouter avant de decider. Le fichier n'est PAS dans public/ : il est servi
                  par une route reservee a l'admin. */}
              <LecteurDepot
                idSubmission={depot.id_submission}
                className="w-full lg:w-64 shrink-0"
              />

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  className="rounded-full gap-1.5"
                  onClick={() => traiter(depot, "approuver")}
                >
                  <Check className="w-4 h-4" />
                  Approuver
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-full gap-1.5"
                  onClick={() => setDepotARefuser(depot)}
                >
                  <X className="w-4 h-4" />
                  Refuser
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={depotARefuser !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) {
            setDepotARefuser(null);
            setMotif("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser ce dépôt</DialogTitle>
            <DialogDescription>
              « {depotARefuser?.title} » de {depotARefuser?.artist}. Le motif sera
              visible par la personne qui l'a déposé.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Motif du refus (facultatif)"
            value={motif}
            onChange={(event) => setMotif(event.target.value)}
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
            <Button
              variant="destructive"
              onClick={() => traiter(depotARefuser, "refuser")}
            >
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
