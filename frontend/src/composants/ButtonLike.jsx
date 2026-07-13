import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ButtonLike({
  idMusic,
  setMusiquesLikee,
  musiquesLikee,
  musique,
}) {
  const estLike = musiquesLikee.some((musique) => musique.id_music === idMusic);

  async function handleLike() {
    const url = `http://localhost:3000/api/users/like/${idMusic}`;

    try {
      const token = localStorage.getItem("token");
      const reponse = await fetch(url, {
        method: "POST",
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
      setMusiquesLikee((prev) => [...prev, musique]);
      toast.success(resultat.message);
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }

  async function handleUnlike() {
    const url = `http://localhost:3000/api/users/unlikes/${idMusic}`;

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
