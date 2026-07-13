import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, messageErreur } from "@/lib/api";

export default function ButtonLike({
  idMusic,
  setMusiquesLikee,
  musiquesLikee,
  musique,
}) {
  const estLike = musiquesLikee.some((musique) => musique.id_music === idMusic);

  async function handleLike() {
    try {
      const { reponse, donnees } = await apiFetch(`/api/users/like/${idMusic}`, {
        method: "POST",
      });

      if (!reponse.ok) {
        const message = messageErreur(reponse, donnees);
        if (message) toast.error(message);
        return;
      }
      setMusiquesLikee((prev) => [...prev, musique]);
      toast.success(donnees.message);
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }

  async function handleUnlike() {
    try {
      const { reponse, donnees } = await apiFetch(
        `/api/users/unlikes/${idMusic}`,
        { method: "DELETE" },
      );

      if (!reponse.ok) {
        const message = messageErreur(reponse, donnees);
        if (message) toast.error(message);
        return;
      }
      toast.success(donnees.message);
      setMusiquesLikee((prev) =>
        prev.filter((musique) => musique.id_music !== idMusic),
      );
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }

  return estLike ? (
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
  );
}
