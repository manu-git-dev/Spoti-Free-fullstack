import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Music } from "lucide-react";

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
        <div
          role="alert"
          className={`alert ${typeMessage === "success" ? "alert-success" : "alert-error"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{message}</span>
        </div>
      ) : null}
      <section className="h-full flex flex-col justify-center items-center p-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
          <Music className="text-primary-content w-7 h-7" />
        </div>
        <h1 className="text-4xl font-serif">Connexion</h1>
        <p className="text-base-content/70 text-center mb-6">
          Content de te revoir ! Connecte-toi pour retrouver ta musique.
        </p>
        <form
          action=""
          className="flex flex-col gap-4 w-full max-w-sm"
          onSubmit={handleSubmit}
        >
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Adresse mail</legend>
            <label className="input w-full">
              <Mail className="opacity-50 w-4 h-4" />
              <input
                type="email"
                name="email"
                className="grow"
                placeholder="ton@email.fr"
                required
              />
            </label>
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Mot de passe</legend>
            <label className="input w-full">
              <Lock className="opacity-50 w-4 h-4" />
              <input
                type="password"
                className="grow"
                placeholder="Ton mot de passe"
                name="password"
                required
              />
            </label>
          </fieldset>
          <Link to="#" className="link link-primary text-sm self-end">
            Mot de passe oublié ?
          </Link>
          <button
            className="btn btn-primary rounded-full w-full mt-4"
            type="submit"
          >
            Connexion
          </button>
        </form>
        <p className="text-sm text-base-content/70 mt-4">
          Pas encore de compte ?{" "}
          <Link to="/inscription" className="link link-primary">
            S'inscrire
          </Link>
        </p>
      </section>
    </>
  );
}
