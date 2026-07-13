import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, messageErreur } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddMusicPlaylist({ idMusic }) {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    apiFetch("/api/playlists")
      .then(({ donnees }) => {
        setPlaylists(Array.isArray(donnees) ? donnees : []);
      })
      .catch((error) => console.error(error));
  }, []);

  async function handleClick() {
    try {
      const { reponse, donnees } = await apiFetch(
        `/api/playlists/ajouter/${selectedPlaylist}/${idMusic}`,
        { method: "POST" },
      );

      if (!reponse.ok) {
        const message = messageErreur(reponse, donnees);
        if (message) toast.error(message);
        return;
      }
      toast.success(donnees.message);
      setOpen(false);
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Ajouter à une playlist"
            />
          }
        >
          <Plus className="w-4 h-4" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter à une playlist</DialogTitle>
            <DialogDescription>
              Choisissez la playlist dans laquelle ajouter ce titre.
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner une playlist" />
            </SelectTrigger>
            <SelectContent>
              {playlists.map((playlist) => (
                <SelectItem
                  key={playlist.id_playlist}
                  value={String(playlist.id_playlist)}
                >
                  {playlist.name}
                </SelectItem>
              ))}
              </SelectContent>
          </Select>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Annuler
            </DialogClose>
            <Button onClick={handleClick} disabled={!selectedPlaylist}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
