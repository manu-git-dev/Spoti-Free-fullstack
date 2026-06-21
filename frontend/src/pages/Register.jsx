import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [message, setMessage] = useState("");
  const [typeMessage, setTypeMessage] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

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
      <section className="h-full flex flex-col justify-center items-center">
        <form
          action=""
          className="flex flex-col gap-2 "
          onSubmit={handleSubmit}
        >
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-xl">Pseudo :</legend>
            <input
              name="pseudo"
              type="text"
              className="input w-xl h-12 text-xl"
              placeholder="Veuillez saisir votre pseudo"
            />
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-xl">Prénom :</legend>
            <input
              name="prenom"
              type="text"
              className="input w-xl h-12 text-xl"
              placeholder="Veuillez saisir votre prénom"
            />
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-xl">Nom :</legend>
            <input
              name="nom"
              type="text"
              className="input w-xl h-12 text-xl"
              placeholder="Veuillez saisir votre nom"
            />
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-xl">Email :</legend>
            <input
              name="email"
              type="email"
              className="input w-xl h-12 text-xl"
              placeholder="Veuillez saisir votre adresse mail"
            />
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-xl">Mot de passe :</legend>
            <input
              name="password"
              type="password"
              className="input w-xl h-12 text-xl"
              placeholder="Veuillez saisir votre mot de passe"
            />
          </fieldset>
          <button className="btn btn-success mt-4 h-16 text-2xl" type="submit">
            INSCRIPTION
          </button>
        </form>
      </section>
    </>
  );
}
