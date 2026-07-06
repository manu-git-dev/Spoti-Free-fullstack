import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
export default function AddMusicPlaylist({ idMusic }) {
  const [playlists, setPlaylists] = useState([]);
  const selectRef = useRef(null);
  const [typeMessage, setTypeMessage] = useState("");
  const [message, setMessage] = useState("");
  
  useEffect(() => {
    const url = `http://localhost:3000/api/playlists`;
    const token = localStorage.getItem("token");
    fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPlaylists(data);
        } else {
          setPlaylists([]);
        }
      })
      .catch((error) => console.error(error));
  }, []);

  async function handleClick() {
    const idPlaylist = selectRef.current.value;
    const url = `http://localhost:3000/api/playlists/ajouter/${idPlaylist}/${idMusic}`;

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
      ) : null}{" "}
      {/* Open the modal using document.getElementById('ID').showModal() method */}
      <button
        className="btn btn-circle btn-ghost btn-sm"
        onClick={() =>
          document.getElementById(`my_modal_${idMusic}`).showModal()
        }
        aria-label="Ajouter à une playlist"
      >
        <Plus className="w-4 h-4" />
      </button>
      <dialog id={`my_modal_${idMusic}`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Hello!</h3>
          <p className="py-4">
            Press ESC key or click the button below to close
          </p>
          <select
            ref={selectRef}
            defaultValue="Pick a color"
            className="select"
            name="select"
          >
            <option disabled={true}>Selectionner une playlist</option>
            {playlists.map((playlist) => (
              <option key={playlist.id_playlist} value={playlist.id_playlist}>
                {playlist.name}
              </option>
            ))}
          </select>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Close</button>
            </form>
            <button onClick={handleClick} className="btn btn-success">
              Ajouter
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
