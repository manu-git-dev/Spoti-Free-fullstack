import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, UploadCloud, Clock, Check, X } from "lucide-react";
import { toast } from "sonner";
import ZoneDepotFichier from "../composants/ZoneDepotFichier";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiFetch, messageErreur } from "@/lib/api";

const STATUTS = {
  en_attente: {
    label: "En attente de validation",
    icone: Clock,
    classe: "text-muted-foreground bg-muted/40 border-border",
  },
  approuve: {
    label: "Approuvé",
    icone: Check,
    classe: "text-success bg-success/10 border-success/40",
  },
  refuse: {
    label: "Refusé",
    icone: X,
    classe: "text-destructive bg-destructive/10 border-destructive/40",
  },
};

export default function Deposer({ user }) {
  const [audio, setAudio] = useState(null);
  const [image, setImage] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [mesDepots, setMesDepots] = useState([]);

  useEffect(() => {
    if (!user) return;
    apiFetch("/api/submissions/mes-depots")
      .then(({ donnees }) => {
        setMesDepots(Array.isArray(donnees) ? donnees : []);
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
            className="text-primary underline-offset-4 hover:underline"
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

      toast.success(donnees.message ?? "Dépôt envoyé, il sera examiné rapidement.");
      formulaire.reset();
      setAudio(null);
      setImage(null);

      // On rafraichit la liste pour que l'utilisateur voie son depot apparaitre.
      const { donnees: liste } = await apiFetch("/api/submissions/mes-depots");
      setMesDepots(Array.isArray(liste) ? liste : []);
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
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <UploadCloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold">
              Déposer une musique
            </h1>
            <p className="text-sm text-muted-foreground">
              Ton morceau sera publié une fois validé.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-5 rounded-2xl border border-border bg-background/50 p-6"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              Titre
            </label>
            <Input id="title" name="title" placeholder="Le titre du morceau" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="artist" className="text-sm font-medium">
              Artiste
            </label>
            <Input id="artist" name="artist" placeholder="Le nom de l'artiste" required />
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

        {mesDepots.length > 0 ? (
          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
              <span className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-accent" />
              Mes dépôts
            </h2>
            <ul className="flex flex-col gap-2">
              {mesDepots.map((depot) => {
                const statut = STATUTS[depot.statut] ?? STATUTS.en_attente;
                const Icone = statut.icone;
                return (
                  <li
                    key={depot.id_submission}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{depot.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {depot.artist}
                      </p>
                      {depot.statut === "refuse" && depot.motif_refus ? (
                        <p className="mt-1 text-xs text-destructive">
                          Motif : {depot.motif_refus}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${statut.classe}`}
                    >
                      <Icone className="w-3.5 h-3.5" />
                      {statut.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
