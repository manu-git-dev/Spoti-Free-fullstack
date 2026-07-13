import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
        <Alert variant={typeMessage === "success" ? "success" : "destructive"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      {estLike ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleUnlike}
          aria-label="Retirer des favoris"
        >
          <Heart className="w-4 h-4 fill-accent text-accent" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleLike}
          aria-label="Ajouter aux favoris"
        >
          <Heart className="w-4 h-4" />
        </Button>
      )}
    </>
  );
}
