import { Link } from "react-router-dom";
import { useRef } from "react";
import { useState } from "react";
export default function Playlist({ id, nom, setPlaylists}) {
  const [typeMessage, setTypeMessage] = useState("");
  const [message, setMessage] = useState("");
  const [messageSuppression, setMessageSuppression] = useState("");
  const inputRef = useRef(null);
  async function handleDelete(event) {
    event.stopPropagation();
    event.preventDefault();
    const url = `http://localhost:3000/api/playlists/delete/${id}`;

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
        setMessageSuppression(resultat.message);
        setTimeout(() => {
          setMessageSuppression("");
        }, 1500);
        console.error(resultat.message);
        return;
      }
      setTypeMessage("success");
      setMessageSuppression(resultat.message);
      setTimeout(() => {
        setMessageSuppression("");
      }, 1500);
      setPlaylists((prev) =>
        prev.filter((playlist) => playlist.id_playlist !== id),
      );
    } catch (erreur) {
      setTypeMessage("error");
      setMessageSuppression("Impossible de contacter le serveur.");
      setTimeout(() => {
        setMessageSuppression("");
      }, 1500);
      console.error(erreur.message);
    }
  }

  async function handleRename() {
    const name = inputRef.current.value;
    const url = `http://localhost:3000/api/playlists/renommer/${id}`;
    try {
      const token = localStorage.getItem("token");
      const reponse = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      const resultat = await reponse.json();

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
      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist.id_playlist === id ? { ...playlist, name } : playlist,
        ),
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
    <div key={id}>
      <Link to={`/playlists/${id}`}>
        <h2>{nom}</h2>
      </Link>
      {/* Open the modal using document.getElementById('ID').showModal() method */}
      <button
        className="btn"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          document.getElementById(`my_modal_add-${id}`).showModal();
        }}
      >
        Renommer la playlist
      </button>
      <dialog id={`my_modal_add-${id}`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Hello {id}!</h3>
          <p className="py-4">
            Press ESC key or click the button below to close
          </p>
          <input type="text" defaultValue={nom} ref={inputRef} />
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
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Close</button>
            </form>
            <button className="btn btn-accent" onClick={handleRename}>
              Renommer
            </button>
          </div>
        </div>
      </dialog>

      <button className="btn btn-error" onClick={handleDelete}>
        Supprimer la playlist
      </button>      
      {messageSuppression ? (
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
          <span>{messageSuppression}</span>
        </div>
      ) : null}
    </div>
  );
}
