import { Link } from "react-router-dom";
import { useRef } from "react";
export default function Playlist({ id, nom, setPlaylists }) {
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
        console.error(resultat.message);
        return;
      }
      setPlaylists((prev) =>
        prev.filter((playlist) => playlist.id_playlist !== id),
      );
    } catch (erreur) {
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
        console.error(resultat.message);
        return;
      }
      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist.id_playlist === id ? { ...playlist, name } : playlist,
        ),
      );
    } catch (erreur) {
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
    </div>
  );
}
