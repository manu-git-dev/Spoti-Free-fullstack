import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RemoveMusicPlaylist({
  idMusic,
  idPlaylist,
  setMusicsPlaylist,
}) {
  const [typeMessage, setTypeMessage] = useState("");
  const [message, setMessage] = useState("");
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
      setMusicsPlaylist((prev) =>
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
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleClick}
        aria-label="Retirer de la playlist"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </>
  );
}
