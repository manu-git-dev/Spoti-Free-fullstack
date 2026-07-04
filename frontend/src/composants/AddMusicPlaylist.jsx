import { useState, useEffect, useRef } from "react";
export default function AddMusicPlaylist({ idMusic }) {
  const [playlists, setPlaylists] = useState([]);
  const selectRef = useRef(null);
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
      const token = localStorage.getItem("token");
      fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
        })
        .catch((error) => console.error(error));
  }

  return (
    <>
      {" "}
      {/* Open the modal using document.getElementById('ID').showModal() method */}
      <button
        className="btn"
        onClick={() => document.getElementById(`my_modal_${idMusic}`).showModal()}
      >
        Ajouter à une playlist
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
            <button onClick={handleClick} className="btn btn-success">Ajouter</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
