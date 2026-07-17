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

  // Mobile : une rangee (vignette a gauche + nom) — une playlist est un placeholder generique,
  // pas une pochette d'album, un grand carre lui donne un poids qu'elle n'a pas. Desktop (`sm:`) :
  // la carte poster de toujours. `pr-20` reserve la place des actions cote mobile (elles sont en
  // overlay absolu, donc hors du flux : sans ca, un nom long passerait dessous).
  return (
    <div className="group relative flex">
      <Link
        to={`/playlists/${id}`}
        className="flex flex-1 min-w-0 items-center gap-3 p-3 pr-20 rounded-2xl border border-border bg-background/50 transition-all hover:bg-background/80 hover:border-accent hover:shadow-lg hover:shadow-primary/10 sm:flex-col sm:items-stretch sm:gap-0 sm:pr-3"
      >
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${degrade} sm:h-auto sm:w-full sm:aspect-square`}
        >
          <ListMusic className="h-7 w-7 text-white/90 sm:h-10 sm:w-10" />
        </div>
        <div className="min-w-0 flex-1 sm:mt-2 sm:flex-none">
          <h2 className="truncate font-semibold">{nom}</h2>
          <p className="text-xs text-muted-foreground uppercase">Playlist</p>
        </div>
      </Link>

      {/* Actions. Mobile : toujours visibles (pas de survol au doigt), calees a droite de la
          rangee. Desktop : discretes, revelees au survol de la carte. */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-100 transition-opacity sm:right-5 sm:top-5 sm:translate-y-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
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
