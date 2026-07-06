import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Music } from "lucide-react";

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

    const url = "http://localhost:3000/api/users/inscription";
    try {
      const reponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      const resultat = await reponse.json();
      if (!reponse.ok) {
        setTypeMessage("error");
        setMessage(resultat.message);
        return;
      }
      setTypeMessage("success");
      setMessage(resultat.message);
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
        <h1 className="text-4xl font-serif">Inscription</h1>
        <p className="text-base-content/70 text-center mb-6">
          Crée ton compte gratuitement et commence à écouter.
        </p>
        <form
          action=""
          className="flex flex-col gap-2 w-full max-w-sm"
          onSubmit={handleSubmit}
        >
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Pseudo</legend>
            <label className="input w-full">
              <User className="opacity-50 w-4 h-4" />
              <input
                name="pseudo"
                type="text"
                className="grow"
                placeholder="Ton pseudo"
              />
            </label>
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Prénom</legend>
            <label className="input w-full">
              <User className="opacity-50 w-4 h-4" />
              <input
                name="prenom"
                type="text"
                className="grow"
                placeholder="Ton prénom"
              />
            </label>
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Nom</legend>
            <label className="input w-full">
              <User className="opacity-50 w-4 h-4" />
              <input
                name="nom"
                type="text"
                className="grow"
                placeholder="Ton nom"
              />
            </label>
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Email</legend>
            <label className="input w-full">
              <Mail className="opacity-50 w-4 h-4" />
              <input
                name="email"
                type="email"
                className="grow"
                placeholder="ton@email.fr"
              />
            </label>
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Mot de passe</legend>
            <label className="input w-full">
              <Lock className="opacity-50 w-4 h-4" />
              <input
                name="password"
                type="password"
                className="grow"
                placeholder="Ton mot de passe"
              />
            </label>
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Confirmation du mot de passe</legend>
            <label className="input w-full">
              <Lock className="opacity-50 w-4 h-4" />
              <input
                name="confirmPassword"
                type="password"
                className="grow"
                placeholder="Confirme ton mot de passe"
              />
            </label>
          </fieldset>
          <button
            className="btn btn-primary rounded-full w-full mt-4"
            type="submit"
          >
            Inscription
          </button>
        </form>
        <p className="text-sm text-base-content/70 mt-4">
          Déjà un compte ?{" "}
          <Link to="/connexion" className="link link-primary">
            Connexion
          </Link>
        </p>
      </section>
    </>
  );
}
