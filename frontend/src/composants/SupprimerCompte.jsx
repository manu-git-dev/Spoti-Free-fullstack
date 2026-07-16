import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch, messageErreur } from "@/lib/api";

// Suppression du compte par son proprietaire (RGPD : droit a l'effacement).
//
// Deux garde-fous, et ils ne font pas double emploi :
//
//   - la modale confirme l'INTENTION (on ne supprime pas son compte d'un clic egare) ;
//   - le mot de passe confirme l'IDENTITE (une session ouverte n'est pas une preuve que c'est
//     bien la bonne personne devant l'ecran).
//
// L'action est irreversible et emporte playlists, favoris et depots : elle merite les deux.
export default function SupprimerCompte({ setUser, setToken }) {
  const [ouverte, setOuverte] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const navigate = useNavigate();

  async function supprimer() {
    setSuppressionEnCours(true);
    try {
      const { reponse, donnees } = await apiFetch("/api/users/mon-compte", {
        method: "DELETE",
        body: { motDePasse },
      });

      if (!reponse.ok) {
        const message = messageErreur(reponse, donnees);
        if (message) toast.error(message);
        return;
      }

      // Le compte n'existe plus : la session locale ne vaut plus rien. On la purge nous-memes
      // plutot que d'attendre le prochain 401 — sinon l'app afficherait encore "Bonjour X"
      // pour un utilisateur qui vient de disparaitre.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      toast.success(donnees?.message ?? "Ton compte a été supprimé.");
      navigate("/");
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    } finally {
      setSuppressionEnCours(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        className="rounded-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => setOuverte(true)}
      >
        <Trash2 className="w-4 h-4" />
        Supprimer mon compte
      </Button>

      <Dialog
        open={ouverte}
        onOpenChange={(estOuverte) => {
          setOuverte(estOuverte);
          // Ne jamais laisser le mot de passe dans le state d'un composant ferme.
          if (!estOuverte) setMotDePasse("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ton compte</DialogTitle>
            <DialogDescription>
              Cette action est <strong>définitive</strong>. Tes playlists, tes
              favoris et tes dépôts en attente seront supprimés avec ton compte.
              Les morceaux que tu as déposés et qui ont été publiés resteront au
              catalogue.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(evenement) => {
              evenement.preventDefault();
              supprimer();
            }}
            className="flex flex-col gap-2"
          >
            <label htmlFor="motDePasseSuppression" className="text-sm">
              Saisis ton mot de passe pour confirmer :
            </label>
            <Input
              id="motDePasseSuppression"
              type="password"
              // Sans ca, le gestionnaire de mots de passe du navigateur propose d'enregistrer
              // la saisie comme un nouveau mot de passe.
              autoComplete="current-password"
              value={motDePasse}
              onChange={(evenement) => setMotDePasse(evenement.target.value)}
              placeholder="Ton mot de passe"
            />
          </form>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Annuler
            </DialogClose>
            <Button
              variant="destructive"
              onClick={supprimer}
              disabled={suppressionEnCours || motDePasse === ""}
            >
              {suppressionEnCours ? (
                <>
                  Suppression
                  <Loader2 className="animate-spin" />
                </>
              ) : (
                "Supprimer définitivement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
