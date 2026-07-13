import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function RemoveMusicPlaylist({
  idMusic,
  idPlaylist,
  setMusicsPlaylist,
}) {
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

      if (!reponse.ok) {
        toast.error(resultat.message);
        console.error(resultat.message);
        return;
      }
      toast.success(resultat.message);
      setMusicsPlaylist((prev) =>
        prev.filter((musique) => musique.id_music !== idMusic),
      );
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleClick}
      aria-label="Retirer de la playlist"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
