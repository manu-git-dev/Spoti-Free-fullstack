export default function ButtonLike({
  idMusic,
  setMusiquesLikee,
  musiquesLikee,
  musique,
}) {
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
        console.error(resultat.message);
        return;
      }
      setMusiquesLikee((prev) => [...prev, musique]);
    } catch (erreur) {
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
        console.error(resultat.message);
        return;
      }
      setMusiquesLikee((prev) =>
        prev.filter((musique) => musique.id_music !== idMusic),
      );
    } catch (erreur) {
      console.error(erreur.message);
    }
  }

  return estLike ? (
    <button className="btn btn-error m-4" onClick={handleUnlike}>
      UNLIKE
    </button>
  ) : (
    <button className="btn btn-success m-4" onClick={handleLike}>
      LIKE
    </button>
  );
}
