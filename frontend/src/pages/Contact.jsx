import { useState } from "react";
import { Send } from "lucide-react";
export default function Contact() {
  const [message, setMessage] = useState("");
  const [typeMessage, setTypeMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setIsSending(true);

    const contact = {
      nom: formData.get("nom"),
      email: formData.get("email"),
      sujet: formData.get("sujet"),
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
      }, 5000);
    } catch (erreur) {
      setTypeMessage("error");
      setMessage("Impossible de contacter le serveur.");
      setTimeout(() => {
        setMessage("");
      }, 1500);
      console.error(erreur.message);
    } finally {
      setIsSending(false);
    }
  }
  return (
    <section className="flex flex-col lg:grid lg:grid-cols-2 h-full overflow-y-auto p-4 md:p-8">
      <section className="flex flex-col lg:col-start-1">
        <h1 className="font-serif md:text-3xl my-4">Contact</h1>
        <h2 className="font-serif md:text-2xl my-4">Une question ?</h2>
        <p className="text-base-content/70 md:text-xl my-4">
          Ecris-moi, je te réponds rapidement. Que ce soit un bug, une idée de
          fonctionnalité ou juste un petit mot, je lis tout.
        </p>
        <p className="my-4">manuel.mattana.dev@gmail.com</p>
        <a
          className="my-4"
          href="https://www.github.com/manu-git-dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          Lien vers mon Github
        </a>
        <a
          className="my-4"
          href="https://www.linkedin.com/in/manuel-mattana/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Lien vers mon Linkedin
        </a>
      </section>
      <section className="bg-base-200 rounded-2xl p-8 h-fit w-full lg:self-center">
        <form action="" className="flex flex-col" onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-4 my-4 w-full">
            <fieldset className="fieldset w-full md:w-1/2">
              <legend className="fieldset-legend text-xl">Nom</legend>
              <input
                type="text"
                className="input"
                placeholder="Ton nom"
                name="nom"
                required
              />
            </fieldset>
            <fieldset className="fieldset w-full md:w-1/2">
              <legend className="fieldset-legend text-xl">Mail</legend>
              <input
                type="email"
                className="input"
                placeholder="ton@email.fr"
                name="email"
                required
              />
            </fieldset>
          </div>
          <fieldset className="fieldset my-4">
            <legend className="fieldset-legend text-xl">Sujet</legend>
            <input
              type="text"
              className="input"
              placeholder="De quoi veux-tu parler ?"
              name="sujet"
              required
            />
          </fieldset>
          <fieldset className="fieldset my-4">
            <legend className="fieldset-legend text-xl">Message</legend>
            <textarea
              name="message"
              className="textarea w-full h-48"
              placeholder="Ton message..."
              required
            ></textarea>
          </fieldset>
          <button className="btn btn-primary my-4 " disabled={isSending}>
            Envoyer le message
            <Send />
            {isSending ? (
              <span className="loading loading-spinner loading-md"></span>
            ) : null}
          </button>
        </form>{" "}
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
      </section>
    </section>
  );
}
