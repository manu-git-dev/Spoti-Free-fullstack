import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, messageErreur } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login({ ouvrirSession }) {
  // Un seul etat de message, et il ne sert qu'aux ECHECS : le succes ne s'annonce plus, il se
  // constate. Rediriger tout de suite vers l'accueil, connecte, dit mieux "c'est bon" qu'une
  // phrase verte que personne ne lit — et n'impose pas d'attendre pour l'apprendre.
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const user = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const { reponse, donnees } = await apiFetch("/api/users/connexion", {
        method: "POST",
        body: user,
      });

      if (!reponse.ok) {
        // `messageErreur` plutot que `donnees.message` : `donnees` vaut `null` quand la reponse
        // n'a pas de corps JSON (une 502 du proxy, par exemple), et on lirait `.message` sur
        // `null` — une exception a l'endroit meme ou on essayait d'afficher une erreur.
        setMessage(messageErreur(reponse, donnees));
        return;
      }

      // Un seul geste : stockage + etat React, les deux moities de la session ensemble.
      ouvrirSession({ token: donnees.token, user: donnees.user });

      // `replace` et non un empilement : une fois connecte, le bouton "Retour" du navigateur
      // ne doit pas ramener sur le formulaire de connexion. On remplace donc cette etape dans
      // l'historique au lieu de l'y laisser — la page de login est un passage, pas une
      // destination.
      navigate("/", { replace: true });
    } catch (erreur) {
      setMessage("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }
  return (
    <>
      {" "}
      {message ? (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <section className="h-full flex flex-col justify-center items-center p-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
          <Music className="text-primary-foreground w-7 h-7" />
        </div>
        <h1 className="text-4xl font-serif">Connexion</h1>
        <p className="text-muted-foreground text-center mb-6">
          Content de te revoir ! Connecte-toi pour retrouver ta musique.
        </p>
        <form
          action=""
          className="flex flex-col gap-4 w-full max-w-sm"
          onSubmit={handleSubmit}
        >
          <fieldset className="flex flex-col gap-1.5 w-full">
            <legend className="text-sm mb-1">Adresse mail</legend>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                name="email"
                className="pl-8"
                placeholder="ton@email.fr"
                required
              />
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-1.5 w-full">
            <legend className="text-sm mb-1">Mot de passe</legend>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                className="pl-8"
                placeholder="Ton mot de passe"
                name="password"
                required
              />
            </div>
          </fieldset>
          <Link
            to="/mot-de-passe-oublie"
            className="text-primary underline-offset-4 hover:underline text-sm self-end"
          >
            Mot de passe oublié ?
          </Link>
          <Button className="rounded-full w-full mt-4" type="submit">
            Connexion
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4">
          Pas encore de compte ?{" "}
          <Link
            to="/inscription"
            className="text-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            S'inscrire
          </Link>
        </p>
      </section>
    </>
  );
}
