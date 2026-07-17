import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, UploadCloud, Inbox, ArrowRight, Info } from "lucide-react";
import { toast } from "sonner";
import ZoneDepotFichier from "../composants/ZoneDepotFichier";
import Page from "../composants/Page";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiFetch, messageErreur } from "@/lib/api";
import { GENRES, LICENCES_DEPOT } from "@/lib/validation";

// Met en valeur sans crier : gras + encre normale. Meme composant que dans `Apropos.jsx`.
function Fort({ children }) {
  return <span className="font-semibold text-foreground">{children}</span>;
}

// Une regle du panneau lateral : son intitule, puis son explication.
function Regle({ titre, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-medium">{titre}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

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
    donneesEnvoi.append("licence", champs.get("licence"));
    donneesEnvoi.append("sourceUrl", champs.get("sourceUrl") ?? "");
    // Une case non cochee n'apparait pas du tout dans le FormData : `get` renvoie null. On
    // envoie donc explicitement "true"/"false" plutot que de laisser le serveur interpreter une
    // absence — un champ manquant peut aussi vouloir dire "bug du formulaire".
    donneesEnvoi.append(
      "droitsConfirmes",
      champs.get("droitsConfirmes") === "on" ? "true" : "false",
    );
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
    <Page
      icone={UploadCloud}
      titre="Déposer une musique"
      sousTitre="Ton morceau sera publié une fois validé."
    >
      {/* DEUX COLONNES : le formulaire a gauche, ce qu'il faut savoir a droite.
          L'en-tete reste cale a gauche, aligne sur toutes les autres pages de l'app, et le
          formulaire demarre au meme axe que lui — aucun desequilibre.

          Le panneau de droite n'est pas du remplissage : il accueille les explications qui
          vivaient sous les champs (genre, licence, source) et rallongeaient le formulaire. Elles
          y sont mieux : on les lit AVANT de saisir, au lieu de les decouvrir champ par champ.

          `items-start` : sans lui, les deux colonnes s'etirent a la meme hauteur (defaut `stretch`)
          et le panneau de droite se retrouve aussi haut que le formulaire, avec du vide dessous.
          `lg:` seulement : sous 1024 px, les deux colonnes s'empilent, le panneau passe dessous. */}
      <div className="grid max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,42rem)_minmax(0,22rem)]">
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
          <select
            id="genre"
            name="genre"
            defaultValue=""
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
          >
            <option value="">Sans genre</option>
            {GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="licence" className="text-sm font-medium">
            Licence
          </label>
          <select
            id="licence"
            name="licence"
            required
            defaultValue=""
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
          >
            <option value="" disabled>
              Choisis une licence…
            </option>
            {LICENCES_DEPOT.map((licence) => (
              <option key={licence.code} value={licence.code}>
                {licence.libelle}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sourceUrl" className="text-sm font-medium">
            Lien vers l'original{" "}
            <span className="text-muted-foreground">(facultatif)</span>
          </label>
          <Input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            placeholder="https://…"
          />
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

        {/* La case n'est volontairement PAS pré-cochée : un consentement pré-coché n'est pas
              un consentement, c'est un piège. L'utilisateur doit faire le geste. */}
        <label className="flex items-start gap-3 rounded-xl border border-border bg-background/50 p-3 cursor-pointer">
          <input
            type="checkbox"
            name="droitsConfirmes"
            required
            className="mt-0.5 size-4 shrink-0 accent-primary cursor-pointer"
          />
          <span className="text-sm text-muted-foreground">
            Je certifie être l'auteur de ce morceau et de sa pochette, ou
            détenir les droits nécessaires pour les diffuser sous cette licence.
            Je comprends qu'un dépôt qui ne respecte pas cette condition sera
            refusé et pourra être retiré.
          </span>
        </label>

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

      <div className="flex flex-col gap-4">
        <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-background/50 p-6">
          <p className="flex items-center gap-2 font-serif text-lg font-bold">
            <Info className="w-4 h-4 shrink-0 text-primary" />À savoir
          </p>

          <Regle titre="Les licences acceptées">
            Spotifree ne diffuse que des œuvres réutilisables : <Fort>CC BY</Fort>{" "}
            ou <Fort>CC BY-SA</Fort>. En déposant, tu places ton morceau sous
            cette licence — ou tu confirmes qu'il l'est déjà.
          </Regle>

          <Regle titre="Le lien vers l'original">
            Si le morceau vient d'ailleurs (Jamendo, ccMixter…), indique sa page
            d'origine. Inutile pour une création personnelle.
          </Regle>

          <Regle titre="Le genre">
            Une liste fermée, et non un champ libre : le filtre de la
            Bibliothèque déduit ses pastilles des genres réellement présents. Un
            « Trap » créerait une pastille menant à un seul morceau.
          </Regle>

          <Regle titre="Les fichiers">
            Audio : mp3, wav ou ogg, <Fort>10 Mo</Fort> maximum. Pochette : jpg,
            png ou webp, <Fort>2 Mo</Fort> — facultative, une image du catalogue
            sera choisie pour toi.
          </Regle>

          <Regle titre="Après l'envoi">
            Ton dépôt part en modération. Il ne rejoint le catalogue qu'une fois
            validé.
          </Regle>
        </aside>

        {nbDepots > 0 ? (
          <Link
            to="/mes-depots"
            className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 px-4 py-3 transition-colors hover:border-accent hover:bg-background/80"
          >
            <Inbox className="w-5 h-5 text-primary shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block font-medium">Mes demandes</span>
              <span className="block text-sm text-muted-foreground">
                Suis l'état de {nbDepots > 1 ? "tes" : "ta"} {nbDepots}{" "}
                {nbDepots > 1 ? "propositions" : "proposition"}.
              </span>
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
        ) : null}
      </div>
      </div>
    </Page>
  );
}
