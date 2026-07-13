import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [message, setMessage] = useState("");
  const [typeMessage, setTypeMessage] = useState("");
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
        setTypeMessage("error");
        setMessage(resultat.message);
        setTimeout(() => {
          setMessage("");
        }, 1500);
        console.log(message);
        return;
      }
      const newPlaylist = { id_playlist: resultat.id_playlist, name: resultat.name };
      setPlaylists((prev) => [...prev, newPlaylist]);
      setTypeMessage("success");
      setMessage(resultat.message);
      setTimeout(() => {
        setMessage("");
      }, 1500);
      console.log(message);
      setOpen(false);
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
            {message ? (
              <Alert
                variant={typeMessage === "success" ? "success" : "destructive"}
              >
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : null}
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
