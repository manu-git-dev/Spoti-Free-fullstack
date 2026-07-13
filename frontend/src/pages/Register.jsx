import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Register() {
  const [message, setMessage] = useState("");
  const [typeMessage, setTypeMessage] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    if (formData.get("password") !== formData.get("confirmPassword")) {
      setTypeMessage("error");
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    const user = {
      pseudo: formData.get("pseudo"),
      prenom: formData.get("prenom"),
      nom: formData.get("nom"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const { reponse, donnees } = await apiFetch("/api/users/inscription", {
        method: "POST",
        body: user,
      });
      if (!reponse.ok) {
        setTypeMessage("error");
        setMessage(donnees.message);
        return;
      }
      setTypeMessage("success");
      setMessage(donnees.message);
      setTimeout(() => {
        navigate("/connexion");
      }, 3000);
    } catch (erreur) {
      setTypeMessage("error");
      setMessage("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }

  return (
    <>
      {" "}
      {message ? (
        <Alert variant={typeMessage === "success" ? "success" : "destructive"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <section className="h-full flex flex-col justify-center items-center p-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
          <Music className="text-primary-foreground w-7 h-7" />
        </div>
        <h1 className="text-4xl font-serif">Inscription</h1>
        <p className="text-muted-foreground text-center mb-6">
          Crée ton compte gratuitement et commence à écouter.
        </p>
        <form
          action=""
          className="flex flex-col gap-2 w-full max-w-sm"
          onSubmit={handleSubmit}
        >
          <fieldset className="flex flex-col gap-1.5 w-full">
            <legend className="text-sm mb-1">Pseudo</legend>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="pseudo"
                type="text"
                className="pl-8"
                placeholder="Ton pseudo"
              />
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-1.5 w-full">
            <legend className="text-sm mb-1">Prénom</legend>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="prenom"
                type="text"
                className="pl-8"
                placeholder="Ton prénom"
              />
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-1.5 w-full">
            <legend className="text-sm mb-1">Nom</legend>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="nom"
                type="text"
                className="pl-8"
                placeholder="Ton nom"
              />
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-1.5 w-full">
            <legend className="text-sm mb-1">Email</legend>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="email"
                type="email"
                className="pl-8"
                placeholder="ton@email.fr"
              />
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-1.5 w-full">
            <legend className="text-sm mb-1">Mot de passe</legend>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="password"
                type="password"
                className="pl-8"
                placeholder="Ton mot de passe"
              />
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-1.5 w-full">
            <legend className="text-sm mb-1">Confirmation du mot de passe</legend>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="confirmPassword"
                type="password"
                className="pl-8"
                placeholder="Confirme ton mot de passe"
              />
            </div>
          </fieldset>
          <Button className="rounded-full w-full mt-4" type="submit">
            Inscription
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4">
          Déjà un compte ?{" "}
          <Link to="/connexion" className="text-primary underline-offset-4 hover:underline">
            Connexion
          </Link>
        </p>
      </section>
    </>
  );
}
