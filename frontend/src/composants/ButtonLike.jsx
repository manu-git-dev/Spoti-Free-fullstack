import { useState } from "react";
export default function ButtonLike({
  idMusic,
  setMusiquesLikee,
  musiquesLikee,
  musique,
}) {
  const [typeMessage, setTypeMessage] = useState("");
  const [message, setMessage] = useState("");
  const estLike = musiquesLikee.some((musique) => musique.id_music === idMusic);
  async function handleLike() {
    const url = `http://localhost:3000/api/users/like/${idMusic}`;

    try {
      const token = localStorage.getItem("token");
      const reponse = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const resultat = await reponse.json();
      console.log(resultat);

      if (!reponse.ok) {
        setTypeMessage("error");
        setMessage(resultat.message);
        setTimeout(() => {
          setMessage("");
        }, 1500);
        console.error(resultat.message);
        return;
      }
      setMusiquesLikee((prev) => [...prev, musique]);
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

  async function handleUnlike() {
    const url = `http://localhost:3000/api/users/unlikes/${idMusic}`;

    try {
      const token = localStorage.getItem("token");
      const reponse = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const resultat = await reponse.json();
      console.log(resultat);

      if (!reponse.ok) {
        setTypeMessage("error");
        setMessage(resultat.message);
        setTimeout(() => {
          setMessage("");
        }, 1500);
        console.error(resultat.message);
        return;
      }
      setTypeMessage("success");
      setMessage(resultat.message);
      setTimeout(() => {
        setMessage("");
      }, 1500);
      setMusiquesLikee((prev) =>
        prev.filter((musique) => musique.id_music !== idMusic),
      );
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
    <>
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

      {estLike ? (
        <button className="btn btn-error m-4" onClick={handleUnlike}>
          UNLIKE
        </button>
      ) : (
        <button className="btn btn-success m-4" onClick={handleLike}>
          LIKE
        </button>
      )}
    </>
  );
}
