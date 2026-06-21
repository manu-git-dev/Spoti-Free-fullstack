export default function ButtonLike({ idMusic }) {
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
    } catch (erreur) {
      console.error(erreur.message);
    }
  }

  return (
    <button className="btn btn-success" onClick={handleLike}>
      LIKE
    </button>
  );
}
