import { useState, useEffect, useMemo } from "react";
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

  // La correspondance valeur -> libelle, que Base UI attend sous la forme d'un objet.
  //
  // SANS ELLE, `<Select.Value>` affiche la VALEUR BRUTE — ici l'`id_playlist`. C'est le bug
  // signale : on choisissait « Chill du soir » et le champ affichait « 1332 ». Ce n'est pas un
  // defaut du composant, c'est son contrat, ecrit dans son type :
  //
  //   items — « When specified, `<Select.Value>` renders the label of the selected item
  //            instead of the raw value. »
  //
  // La valeur d'une option est l'identifiant (c'est lui qu'on envoie a l'API), le libelle est le
  // nom : sans table de correspondance, le composant n'a aucun moyen de deviner le second a
  // partir du premier.
  const libelles = useMemo(
    () =>
      Object.fromEntries(
        playlists.map((playlist) => [
          String(playlist.id_playlist),
          playlist.name,
        ]),
      ),
    [playlists],
  );

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
          <Select
            items={libelles}
            value={selectedPlaylist}
            onValueChange={setSelectedPlaylist}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner une playlist" />
            </SelectTrigger>
            {/* `alignItemWithTrigger={false}` : par defaut, Base UI aligne l'option selectionnee
                SUR le declencheur — le popup vient donc le recouvrir entierement. C'est le
                comportement d'un menu natif macOS, mais dans une modale on ne voit plus du tout
                le champ qu'on est en train de remplir. Ici, la liste s'ouvre DESSOUS. */}
            <SelectContent alignItemWithTrigger={false}>
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
