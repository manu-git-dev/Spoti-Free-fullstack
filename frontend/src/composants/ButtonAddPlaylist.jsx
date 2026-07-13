import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export default function ButtonAddPlaylist({
  setPlaylists,
  playlists,
  children = "",
  variant = "ghost",
  size = "icon-sm",
  className = "",
}) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const user = {
      nom: formData.get("nom"),
    };

    const url = "http://localhost:3000/api/playlists/ajouter";
    const token = localStorage.getItem("token");
    try {
      const reponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(user),
      });
      const resultat = await reponse.json();
      if (!reponse.ok) {
        toast.error(resultat.message);
        console.error(resultat.message);
        return;
      }
      const newPlaylist = {
        id_playlist: resultat.id_playlist,
        name: resultat.name,
      };
      setPlaylists((prev) => [...prev, newPlaylist]);
      toast.success(resultat.message);
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
          render={<Button variant={variant} size={size} className={className} />}
        >
          {children}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une playlist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="nom" className="text-sm text-muted-foreground">
                Quel nom souhaitez-vous donner à votre playlist ?
              </label>
              <Input
                type="text"
                id="nom"
                name="nom"
                placeholder="Saisissez le nom de votre playlist"
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Annuler
              </DialogClose>
              <Button type="submit">Ajouter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
