import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login({ user, setUser, token, setToken }) {
  const [message, setMessage] = useState("");
  const [typeMessage, setTypeMessage] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const user = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const url = "http://localhost:3000/api/users/connexion";
    try {
      const reponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      const resultat = await reponse.json();
      console.log(resultat);

      if (!reponse.ok) {
        setTypeMessage("error");
        setMessage(resultat.message);
        return;
      }
      localStorage.setItem("token", resultat.token);
      localStorage.setItem("user", JSON.stringify(resultat.user));
      setToken(resultat.token);
      setUser(resultat.user);
      setTypeMessage("success");
      setMessage(resultat.message);
      setTimeout(() => {
        navigate("/");
      }, 1000);
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
          <Link to="#" className="text-primary underline-offset-4 hover:underline text-sm self-end">
            Mot de passe oublié ?
          </Link>
          <Button className="rounded-full w-full mt-4" type="submit">
            Connexion
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4">
          Pas encore de compte ?{" "}
          <Link to="/inscription" className="text-primary underline-offset-4 hover:underline">
            S'inscrire
          </Link>
        </p>
      </section>
    </>
  );
}
