import { useState } from "react";
export default function Contact() {
  const [message, setMessage] = useState("");
  const [typeMessage, setTypeMessage] = useState("");
  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const contact = {
      nom: formData.get("nom"),
      email: formData.get("mail"),
      message: formData.get("message"),
    };

    const url = "http://localhost:3000/api/contact/";
    try {
      const reponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contact),
      });
      const resultat = await reponse.json();
      if (!reponse.ok) {
        setTypeMessage("error");
        setMessage(resultat.message);
        setTimeout(() => {
          setMessage("");
        }, 1500);
        return;
      }
      setTypeMessage("success");
      setMessage(resultat.message);
      setTimeout(() => {
        setMessage("");
      }, 1500);
    } catch (erreur) {
      setTypeMessage("error");
      setMessage("Impossible de contacter le serveur.");
      setTimeout(() => {
        setMessage("");
      }, 1500);
      console.error(erreur.message);
    }
  }
  return (
    <section className="flex flex-col justify-center h-full items-center gap-4">
      <h1>Me contacter</h1>{" "}
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
      <form action="" onSubmit={handleSubmit}>
        <label className="floating-label my-2">
          <span>Nom</span>
          <input
            type="text"
            placeholder="Saisissez votre nom"
            className="input input-md"
            name="nom"
            required
          />
        </label>
        <label className="floating-label my-2">
          <span>Adresse Mail</span>
          <input
            type="mail"
            placeholder="Saisissez votre adresse mail"
            className="input input-md"
            name="mail"
            required
          />
        </label>
        <textarea
          name="message"
          className="textarea"
          placeholder="Saisissez votre message"
          required
        ></textarea>
        <button className="btn btn-success">Envoyer</button>
      </form>
    </section>
  );
}
