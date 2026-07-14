import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, UploadCloud, Inbox, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import ZoneDepotFichier from "../composants/ZoneDepotFichier";
import EnTetePage from "../composants/EnTetePage";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiFetch, messageErreur } from "@/lib/api";

export default function Deposer({ user }) {
  const [audio, setAudio] = useState(null);
  const [image, setImage] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  // On ne garde que le compte : la liste vit sur sa propre page (/mes-depots).
  const [nbDepots, setNbDepots] = useState(0);

  useEffect(() => {
    if (!user) return;
    apiFetch("/api/submissions/mes-depots")
      .then(({ donnees }) => {
        setNbDepots(Array.isArray(donnees) ? donnees.length : 0);
      })
      .catch((error) => console.error(error));
  }, [user]);

  if (user === null) {
    return (
      <section className="h-full overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <UploadCloud className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-xl font-serif font-bold mb-1">
            Connecte-toi pour déposer une musique
          </p>
          <p className="text-sm text-muted-foreground">
            Propose un morceau : il sera publié après validation.
          </p>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <Link
            to="/inscription"
            className="text-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            S'inscrire
          </Link>
          <Link
            to="/connexion"
            className={cn(buttonVariants(), "rounded-full px-6")}
          >
            Connexion
          </Link>
        </div>
      </section>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!audio) {
      toast.error("Un fichier audio est nécessaire.");
      return;
    }

    const formulaire = event.currentTarget;
    const champs = new FormData(formulaire);

    // On construit le FormData nous-memes : les fichiers viennent du state (glisser-deposer),
    // pas d'un <input> du formulaire.
    const donneesEnvoi = new FormData();
    donneesEnvoi.append("title", champs.get("title"));
    donneesEnvoi.append("artist", champs.get("artist"));
    donneesEnvoi.append("genre", champs.get("genre") ?? "");
    donneesEnvoi.append("audio", audio);
    // Pochette facultative : si l'utilisateur n'en met pas, l'admin en attribuera une du
    // catalogue a l'approbation.
    if (image) donneesEnvoi.append("image", image);

    setEnvoiEnCours(true);
    try {
      const { reponse, donnees } = await apiFetch("/api/submissions", {
        method: "POST",
        body: donneesEnvoi,
      });

      if (!reponse.ok) {
        const message = messageErreur(reponse, donnees);
        if (message) toast.error(message);
        return;
      }

      toast.success(
        donnees.message ?? "Dépôt envoyé, il sera examiné rapidement.",
      );
      formulaire.reset();
      setAudio(null);
      setImage(null);

      // Le compteur du lien "Mes demandes" doit refleter le nouveau depot.
      const { donnees: liste } = await apiFetch("/api/submissions/mes-depots");
      setNbDepots(Array.isArray(liste) ? liste.length : 0);
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <EnTetePage
          icone={UploadCloud}
          titre="Déposer une musique"
          sousTitre="Ton morceau sera publié une fois validé."
        />

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-2xl border border-border bg-background/50 p-6"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              Titre
            </label>
            <Input
              id="title"
              name="title"
              placeholder="Le titre du morceau"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="artist" className="text-sm font-medium">
              Artiste
            </label>
            <Input
              id="artist"
              name="artist"
              placeholder="Le nom de l'artiste"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="genre" className="text-sm font-medium">
              Genre <span className="text-muted-foreground">(facultatif)</span>
            </label>
            <Input id="genre" name="genre" placeholder="Pop, Rock, Rap…" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ZoneDepotFichier
              label="Fichier audio"
              accept="audio/*"
              extensions={[".mp3", ".wav", ".ogg", ".m4a"]}
              tailleMaxMo={10}
              description="mp3, wav, ogg — 10 Mo maximum"
              fichier={audio}
              onFichierChange={setAudio}
            />
            <ZoneDepotFichier
              label="Pochette (facultatif)"
              accept="image/*"
              extensions={[".jpg", ".jpeg", ".png", ".webp"]}
              tailleMaxMo={2}
              description="jpg, png, webp — 2 Mo. Sans pochette, une image sera choisie pour toi."
              fichier={image}
              onFichierChange={setImage}
            />
          </div>

          <Button
            type="submit"
            className="rounded-full self-start px-6"
            disabled={envoiEnCours}
          >
            {envoiEnCours ? (
              <>
                Envoi en cours
                <Loader2 className="animate-spin" />
              </>
            ) : (
              <>
                Envoyer le dépôt
                <UploadCloud />
              </>
            )}
          </Button>
        </form>

        {nbDepots > 0 ? (
          <Link
            to="/mes-depots"
            className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-background/50 px-4 py-3 transition-colors hover:border-accent hover:bg-background/80"
          >
            <Inbox className="w-5 h-5 text-primary shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block font-medium">Mes demandes de dépôt</span>
              <span className="block text-sm text-muted-foreground">
                Suis l'état de {nbDepots > 1 ? "tes" : "ta"} {nbDepots}{" "}
                {nbDepots > 1 ? "propositions" : "proposition"}.
              </span>
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
