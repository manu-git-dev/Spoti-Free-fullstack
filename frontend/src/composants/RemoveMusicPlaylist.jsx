import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, messageErreur } from "@/lib/api";

export default function RemoveMusicPlaylist({
  idMusic,
  idPlaylist,
  setMusicsPlaylist,
}) {
  async function handleClick() {
    try {
      const { reponse, donnees } = await apiFetch(
        `/api/playlists/retirer/${idPlaylist}/${idMusic}`,
        { method: "DELETE" },
      );

      if (!reponse.ok) {
        const message = messageErreur(reponse, donnees);
        if (message) toast.error(message);
        return;
      }
      toast.success(donnees.message);
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
