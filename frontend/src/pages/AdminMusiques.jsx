import { useEffect, useState } from "react";
import { Music, Pencil, Trash2, Play, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { apiFetch, messageErreur, urlFichier } from "@/lib/api";
import { GENRES, LICENCES_CATALOGUE } from "@/lib/validation";
import Page from "../composants/Page";

const formatDuree = (secondes) => {
  if (!secondes) return "--:--";
  const m = Math.floor(secondes / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(secondes % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

export default function AdminMusiques() {
  const [musiques, setMusiques] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [aModifier, setAModifier] = useState(null);
  const [aSupprimer, setASupprimer] = useState(null);
  // `licence` et `sourceUrl` font partie du formulaire, et ce n'est pas cosmetique : la route
  // les EXIGE (le catalogue est diffuse publiquement, un morceau sans licence n'a rien a y
  // faire). Les omettre faisait repondre 400 a chaque modification — le bouton « Modifier » ne
  // marchait plus du tout.
  const [formulaire, setFormulaire] = useState({
    title: "",
    artist: "",
    genre: "",
    licence: "",
    sourceUrl: "",
  });

  useEffect(() => {
    apiFetch("/api/musics")
      .then(({ donnees }) => {
        setMusiques(Array.isArray(donnees) ? donnees : []);
      })
      .catch((error) => console.error(error))
      .finally(() => setChargement(false));
  }, []);

  // Acces (session + role admin) garanti par ProtectedRoute en amont. Vraie protection : serveur.
  function ouvrirModification(musique) {
    setFormulaire({
      title: musique.title,
      artist: musique.artist,
      genre: musique.genre ?? "",
      licence: musique.licence ?? "",
      sourceUrl: musique.source_url ?? "",
    });
    setAModifier(musique);
  }

  async function enregistrer() {
    try {
      const { reponse, donnees } = await apiFetch(
        `/api/musics/update/${aModifier.id_music}`,
        { method: "PUT", body: formulaire },
      );

      if (!reponse.ok) {
        const message = messageErreur(reponse, donnees);
        if (message) toast.error(message);
        return;
      }

      toast.success(donnees.message);
      setMusiques((prev) =>
        prev.map((m) =>
          m.id_music === aModifier.id_music ? { ...m, ...formulaire } : m,
        ),
      );
      setAModifier(null);
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }

  async function supprimer(musique) {
    try {
      const { reponse, donnees } = await apiFetch(
        `/api/musics/delete/${musique.id_music}`,
        { method: "DELETE" },
      );

      if (!reponse.ok) {
        const message = messageErreur(reponse, donnees);
        if (message) toast.error(message);
        return;
      }

      toast.success(donnees.message);
      setMusiques((prev) =>
        prev.filter((m) => m.id_music !== musique.id_music),
      );
      setASupprimer(null);
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }

  const filtrees = musiques.filter(
    (m) =>
      m.title.toLowerCase().includes(recherche.toLowerCase()) ||
      m.artist.toLowerCase().includes(recherche.toLowerCase()),
  );

  return (
    <Page
      icone={Music}
      titre="Catalogue"
      sousTitre={`${musiques.length} morceaux`}
      actions={
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un titre, un artiste"
            className="rounded-full bg-background/60 pl-9"
          />
        </div>
      }
    >
      <p className="mb-4 text-xs text-muted-foreground">
        Pour ajouter un morceau, passe par la modération des dépôts. Ici, seules
        les métadonnées (titre, artiste, genre) sont modifiables — les fichiers
        ne se remplacent pas.
      </p>

      {chargement ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {filtrees.map((m) => (
            <li
              key={m.id_music}
              className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-3 py-2"
            >
              <img
                src={urlFichier(m.src_image)}
                alt=""
                className="w-11 h-11 rounded-lg object-cover shrink-0"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {m.artist}
                  {m.genre ? ` — ${m.genre}` : ""}
                </p>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1 shrink-0 text-xs text-muted-foreground tabular-nums">
                <Play className="w-3 h-3" />
                {m.play_count ?? 0}
              </span>

              <span className="hidden sm:block shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatDuree(m.duration)}
              </span>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Modifier ${m.title}`}
                  onClick={() => ouvrirModification(m)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Supprimer ${m.title}`}
                  onClick={() => setASupprimer(m)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}

          {filtrees.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Aucun morceau ne correspond à « {recherche} ».
            </p>
          ) : null}
        </ul>
      )}

      {/* Modification : uniquement les metadonnees. Les chemins de fichiers ne sont pas
          exposes — c'est le serveur qui les gere. */}
      <Dialog
        open={aModifier !== null}
        onOpenChange={(ouvert) => !ouvert && setAModifier(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le morceau</DialogTitle>
            <DialogDescription>
              Le fichier audio et la pochette restent inchangés.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="titre" className="text-sm font-medium">
                Titre
              </label>
              <Input
                id="titre"
                value={formulaire.title}
                onChange={(e) =>
                  setFormulaire((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="artiste" className="text-sm font-medium">
                Artiste
              </label>
              <Input
                id="artiste"
                value={formulaire.artist}
                onChange={(e) =>
                  setFormulaire((f) => ({ ...f, artist: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="genre" className="text-sm font-medium">
                Genre
              </label>
              <select
                id="genre"
                value={formulaire.genre}
                onChange={(e) =>
                  setFormulaire((f) => ({ ...f, genre: e.target.value }))
                }
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
              >
                <option value="">Sans genre</option>
                {/* Le genre actuel s'il sort de la liste — cas d'un dépôt approuvé avec un genre
                    libre. Sans cette option, le <select> retomberait sur « Sans genre » et
                    enregistrer une simple correction de titre EFFACERAIT le genre en silence. */}
                {formulaire.genre && !GENRES.includes(formulaire.genre) ? (
                  <option value={formulaire.genre}>
                    {formulaire.genre} (hors liste)
                  </option>
                ) : null}
                {GENRES.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Une liste fermée, et non un champ libre : le filtre de la
                Bibliothèque déduit ses pastilles des genres présents. Un
                « Trap » saisi ici créerait une pastille menant à un seul
                morceau.
              </p>
            </div>

            {/* La licence est OBLIGATOIRE cote serveur. Elle est affichee ici pour pouvoir
                corriger une attribution fausse — ce qui est un probleme juridique, pas une
                coquille — et parce qu'un formulaire qui envoie un champ invisible est un
                formulaire qui echouera un jour sans qu'on comprenne pourquoi. */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="licence" className="text-sm font-medium">
                Licence
              </label>
              <select
                id="licence"
                value={formulaire.licence}
                onChange={(e) =>
                  setFormulaire((f) => ({ ...f, licence: e.target.value }))
                }
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
              >
                <option value="" disabled>
                  Choisis une licence…
                </option>
                {LICENCES_CATALOGUE.map((licence) => (
                  <option key={licence} value={licence}>
                    {licence}
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
                type="url"
                placeholder="https://…"
                value={formulaire.sourceUrl}
                onChange={(e) =>
                  setFormulaire((f) => ({ ...f, sourceUrl: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Annuler
            </DialogClose>
            <Button onClick={enregistrer}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={aSupprimer !== null}
        onOpenChange={(ouvert) => !ouvert && setASupprimer(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce morceau ?</DialogTitle>
            <DialogDescription>
              « {aSupprimer?.title} » de {aSupprimer?.artist} sera retiré du
              catalogue, ainsi que des favoris et des playlists où il figure.
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Annuler
            </DialogClose>
            <Button variant="destructive" onClick={() => supprimer(aSupprimer)}>
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
