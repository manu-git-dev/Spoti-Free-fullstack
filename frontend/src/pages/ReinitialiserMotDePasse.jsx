import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { KeyRound, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motDePasseValide } from "@/lib/validation";
import ChecklistMotDePasse from "@/composants/ChecklistMotDePasse";

export default function ReinitialiserMotDePasse() {
  const [parametres] = useSearchParams();
  const navigate = useNavigate();

  // Le jeton arrive dans l'URL du lien recu par mail.
  const jeton = parametres.get("token");

  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  // Champs controles : les memes regles qu'a l'inscription doivent etre annoncees ici, sinon on
  // laisserait l'utilisateur choisir un mot de passe que le serveur refusera.
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [touche, setTouche] = useState({});

  const motDePasseOk = motDePasseValide(motDePasse);
  const confirmationOk = confirmation !== "" && confirmation === motDePasse;
  const erreurMotDePasse = Boolean(touche.password) && !motDePasseOk;
  const erreurConfirmation =
    Boolean(touche.confirm) && confirmation !== "" && !confirmationOk;

  async function handleSubmit(event) {
    event.preventDefault();

    // Verification de confort : elle evite un aller-retour reseau pour une faute de frappe.
    // La vraie validation (regles du mot de passe, validite du jeton) est faite par le serveur.
    if (!motDePasseOk) {
      setTouche({ password: true, confirm: true });
      setErreur(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.",
      );
      return;
    }

    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setEnvoiEnCours(true);
    setErreur("");

    try {
      const { reponse, donnees } = await apiFetch(
        "/api/users/reinitialiser-mot-de-passe",
        { method: "POST", body: { token: jeton, password: motDePasse } },
      );

      if (!reponse.ok) {
        setErreur(donnees?.message ?? "Une erreur est survenue.");
        return;
      }

      toast.success(donnees.message);
      navigate("/connexion");
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  // Lien ouvert sans jeton (copie de travers, ou visite directe de l'URL).
  if (!jeton) {
    return (
      <section className="h-full flex flex-col justify-center items-center p-4 text-center">
        <div className="w-full max-w-sm flex flex-col items-center gap-4">
          <Alert variant="destructive">
            <AlertDescription>
              Ce lien est incomplet. Refais une demande de réinitialisation.
            </AlertDescription>
          </Alert>
          <Link
            to="/mot-de-passe-oublie"
            className="text-sm text-primary hover:underline underline-offset-4"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="h-full flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-serif font-bold">
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choisis un nouveau mot de passe.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Nouveau mot de passe
            </label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Ton nouveau mot de passe"
              className={cn(
                erreurMotDePasse && "border-destructive",
                motDePasseOk && "border-success",
              )}
              value={motDePasse}
              onChange={(event) => setMotDePasse(event.target.value)}
              onBlur={() => setTouche((p) => ({ ...p, password: true }))}
              aria-invalid={erreurMotDePasse}
              aria-describedby="regles-mot-de-passe"
              required
              autoFocus
            />
            <ChecklistMotDePasse
              id="regles-mot-de-passe"
              motDePasse={motDePasse}
              montrerErreurs={erreurMotDePasse}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirmation
            </label>
            <Input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Retape le mot de passe"
              className={cn(
                erreurConfirmation && "border-destructive",
                confirmationOk && "border-success",
              )}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              onBlur={() => setTouche((p) => ({ ...p, confirm: true }))}
              aria-invalid={erreurConfirmation}
              aria-describedby={
                erreurConfirmation ? "erreur-confirmation" : undefined
              }
              required
            />
            {erreurConfirmation ? (
              <p id="erreur-confirmation" className="text-xs text-destructive">
                Les deux mots de passe ne correspondent pas.
              </p>
            ) : null}
          </div>

          {erreur ? (
            <Alert variant="destructive">
              <AlertDescription>{erreur}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            className="rounded-full w-full"
            disabled={envoiEnCours}
          >
            {envoiEnCours ? (
              <>
                Enregistrement
                <Loader2 className="animate-spin" />
              </>
            ) : (
              "Changer mon mot de passe"
            )}
          </Button>

          <Link
            to="/connexion"
            className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>
        </form>
      </div>
    </section>
  );
}
