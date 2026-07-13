import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { ListMusic, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Pochette generee : chaque playlist recoit un degrade stable, derive de son id
const degrades = [
  "from-chart-1 to-chart-3",
  "from-chart-2 to-chart-1",
  "from-chart-4 to-chart-3",
  "from-chart-5 to-chart-2",
  "from-chart-3 to-chart-4",
];

export default function Playlist({ id, nom, setPlaylists }) {
  const degrade = degrades[id % degrades.length];
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  async function handleDelete(event) {
    event.stopPropagation();
    event.preventDefault();
    try {
      const { reponse, donnees } = await apiFetch(
        `/api/playlists/delete/${id}`,
        { method: "DELETE" },
      );

      if (!reponse.ok) {
        const message = messageErreur(reponse, donnees);
        if (message) toast.error(message);
        return;
      }
      toast.success(donnees.message);
      setPlaylists((prev) =>
        prev.filter((playlist) => playlist.id_playlist !== id),
      );
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }

  async function handleRename() {
    const name = inputRef.current.value;
    try {
      const { reponse, donnees } = await apiFetch(
        `/api/playlists/renommer/${id}`,
        { method: "PUT", body: { name } },
      );

      if (!reponse.ok) {
        const message = messageErreur(reponse, donnees);
        if (message) toast.error(message);
        return;
      }
      toast.success(donnees.message);
      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist.id_playlist === id ? { ...playlist, name } : playlist,
        ),
      );
      setOpen(false);
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }

  return (
    <div className="group relative flex flex-col">
      <Link
        to={`/playlists/${id}`}
        className="flex flex-col rounded-2xl border border-border bg-background/50 p-3 transition-all hover:bg-background/80 hover:border-accent hover:shadow-lg hover:shadow-primary/10"
      >
        <div
          className={`aspect-square w-full rounded-xl bg-gradient-to-br ${degrade} flex items-center justify-center`}
        >
          <ListMusic className="w-10 h-10 text-white/90" />
        </div>
        <h2 className="mt-2 truncate font-semibold">{nom}</h2>
        <p className="text-xs text-muted-foreground uppercase">Playlist</p>
      </Link>

      {/* Actions : discretes, revelees au survol de la carte */}
      <div className="absolute top-5 right-5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button
                size="icon-sm"
                variant="secondary"
                className="rounded-full bg-background/80 backdrop-blur hover:bg-background"
                aria-label={`Renommer la playlist ${nom}`}
                onClick={(event) => event.stopPropagation()}
              />
            }
          >
            <Pencil className="w-4 h-4" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renommer la playlist</DialogTitle>
              <DialogDescription>
                Choisis un nouveau nom pour « {nom} ».
              </DialogDescription>
            </DialogHeader>
            <Input type="text" defaultValue={nom} ref={inputRef} />
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Annuler
              </DialogClose>
              <Button onClick={handleRename}>Renommer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          size="icon-sm"
          variant="secondary"
          className="rounded-full bg-background/80 backdrop-blur text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
          aria-label={`Supprimer la playlist ${nom}`}
          onClick={handleDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
