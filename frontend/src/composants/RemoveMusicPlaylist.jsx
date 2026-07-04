export default function RemoveMusicPlaylist({ idMusic, idPlaylist , setMusicsPlaylist }) {
  async function handleClick() {
    const url = `http://localhost:3000/api/playlists/retirer/${idPlaylist}/${idMusic}`;

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
      setMusicsPlaylist((prev) =>
        prev.filter((musique) => musique.id_music !== idMusic),
      );
    } catch (erreur) {
      console.error(erreur.message);
    }
  }

  return (
    <>
      <button className="btn btn-error" onClick={handleClick}>
        Retirer la musique de la playlist
      </button>
    </>
  );
}
