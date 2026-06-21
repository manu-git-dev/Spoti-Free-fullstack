import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
      <section className="h-full flex flex-col justify-center items-center">
        <h1 className="text-6xl my-8">PAGE CONNEXION</h1>
        <form
          action=""
          className="flex flex-col gap-4 "
          onSubmit={handleSubmit}
        >
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-3xl">Adresse mail</legend>
            <input
              type="email"
              name="email"
              className="input w-xl h-16 text-2xl"
              placeholder="Veuillez saisir votre adresse mail"
              required
            />
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-3xl">Mot de passe :</legend>
            <input
              type="password"
              className="input w-xl h-16 text-2xl"
              placeholder="Veuillez saisir votre mot de passe"
              name="password"
              required
            />
          </fieldset>
          <button className="btn btn-primary mt-12 h-24 text-3xl" type="submit">
            CONNEXION
          </button>
        </form>
      </section>
    </>
  );
}
