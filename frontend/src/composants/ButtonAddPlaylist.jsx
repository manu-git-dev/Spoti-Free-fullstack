import { useState,useRef } from "react";
export default function ButtonAddPlaylist({ setPlaylists,playlists,children = "" }) {
  const [message, setMessage] = useState("");
  const [typeMessage, setTypeMessage] = useState("");

  const modalRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const user = {
      nom: formData.get("nom"),
    };

    const url = "http://localhost:3000/api/playlists/ajouter";
    const token = localStorage.getItem("token");
    try {
      const reponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(user),
      });
      const resultat = await reponse.json();
      if (!reponse.ok) {
        setTypeMessage("error");
        setMessage(resultat.message);
        setTimeout(() => {
          setMessage("");
        }, 1500);
        console.log(message);
        return;
      }
      const newPlaylist = {id_playlist:resultat.id_playlist, name:resultat.name}
      setPlaylists((prev) => [...prev, newPlaylist]);
      setTypeMessage("success");
      setMessage(resultat.message);
      setTimeout(() => {
        setMessage("");
      }, 1500);
      console.log(message);
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
      <button
        className="btn"
        onClick={() => modalRef.current.showModal()}
      >
        {children}
      </button>{" "}
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
      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Créer une playlist</h3>
          <form action="" onSubmit={handleSubmit}>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                Quel nom souhaitez-vous donner à votre Playlist
              </legend>
              <input
                type="text"
                className="input"
                name="nom"
                placeholder="Saisissez le nom de votre playlist"
              />
              <button className="btn btn-success" type="submit">
                Ajouter
              </button>
            </fieldset>
          </form>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}

              <button className="btn btn-error ml-2">fermer</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
