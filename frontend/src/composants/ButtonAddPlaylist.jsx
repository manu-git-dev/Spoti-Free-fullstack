import { useState } from "react";
export default function ButtonAddPlaylist({setPlaylists}) {
  const [message, setMessage] = useState("");
  const [typeMessage, setTypeMessage] = useState("");

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
        console.log(message);
        return;
      }
      setTypeMessage("success");
      setMessage(resultat.message);
      console.log(message);
    } catch (erreur) {
      setTypeMessage("error");
      setMessage("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
    
    
  }

  return (
    <>
      <button
        className="btn"
        onClick={() => document.getElementById("my_modal_1").showModal()}
      >
        Créer une playlist
      </button>
      <dialog id="my_modal_1" className="modal">
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
