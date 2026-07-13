import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiFetch } from "@/lib/api";

export default function MotDePasseOublie() {
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");

    setEnvoiEnCours(true);
    setErreur("");

    try {
      const { reponse, donnees } = await apiFetch("/api/users/mot-de-passe-oublie", {
        method: "POST",
        body: { email },
      });

      if (!reponse.ok) {
        setErreur(donnees?.message ?? "Une erreur est survenue.");
        return;
      }

      // Le serveur renvoie volontairement la MEME reponse, que le compte existe ou non
      // (sinon on pourrait deviner quelles adresses sont inscrites). L'interface reprend donc
      // ce message tel quel, sans jamais confirmer l'existence du compte.
      setEnvoye(true);
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <section className="h-full flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-3">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-serif font-bold">Mot de passe oublié</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Indique ton adresse : on t'envoie un lien pour en choisir un nouveau.
          </p>
        </div>

        {envoye ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Alert variant="success">
              <AlertDescription className="flex items-start gap-2 text-left">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Si un compte existe avec cette adresse, un lien de
                  réinitialisation vient d'être envoyé. Il est valable 1 heure.
                </span>
              </AlertDescription>
            </Alert>

            <p className="text-xs text-muted-foreground">
              Pense à regarder dans les spams.
            </p>

            <Link
              to="/connexion"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Adresse mail
              </label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="ton@email.fr"
                required
                autoFocus
              />
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
                  Envoi en cours
                  <Loader2 className="animate-spin" />
                </>
              ) : (
                "Envoyer le lien"
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
        )}
      </div>
    </section>
  );
}
