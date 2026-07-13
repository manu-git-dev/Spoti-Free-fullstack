import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";

// Zone de glisser-deposer. Pas de librairie : un <input type="file"> masque, plus les
// evenements dragOver / dragLeave / drop natifs.
//
// La validation faite ici (extension, taille) n'est qu'un CONFORT pour l'utilisateur : elle
// lui evite d'attendre un envoi qui sera refuse. Elle ne protege rien — le serveur revalide
// tout, et c'est lui seul qui fait autorite (un appel direct a l'API ne passe pas par ce code).
export default function ZoneDepotFichier({
  label,
  accept,
  extensions,
  tailleMaxMo,
  fichier,
  onFichierChange,
  description,
}) {
  const [survol, setSurvol] = useState(false);
  const [erreur, setErreur] = useState("");
  const inputRef = useRef(null);

  function validerPuisTransmettre(nouveauFichier) {
    if (!nouveauFichier) return;

    const extension = `.${nouveauFichier.name.split(".").pop().toLowerCase()}`;
    if (!extensions.includes(extension)) {
      setErreur(`Format non accepté (attendu : ${extensions.join(", ")}).`);
      return;
    }

    if (nouveauFichier.size > tailleMaxMo * 1024 * 1024) {
      const taille = (nouveauFichier.size / 1024 / 1024).toFixed(1);
      setErreur(`Fichier trop lourd (${taille} Mo, maximum ${tailleMaxMo} Mo).`);
      return;
    }

    setErreur("");
    onFichierChange(nouveauFichier);
  }

  function handleDrop(event) {
    event.preventDefault();
    setSurvol(false);
    validerPuisTransmettre(event.dataTransfer.files?.[0]);
  }

  function retirer(event) {
    event.stopPropagation();
    onFichierChange(null);
    setErreur("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors cursor-pointer ${
          survol
            ? "border-primary bg-primary/10"
            : erreur
              ? "border-destructive bg-destructive/5"
              : fichier
                ? "border-accent bg-background/60"
                : "border-border bg-background/40 hover:border-accent hover:bg-background/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => validerPuisTransmettre(event.target.files?.[0])}
        />

        {fichier ? (
          <>
            <p className="font-medium truncate max-w-full">{fichier.name}</p>
            <p className="text-xs text-muted-foreground">
              {(fichier.size / 1024 / 1024).toFixed(1)} Mo
            </p>
            <button
              type="button"
              onClick={retirer}
              className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="w-3 h-3" />
              Retirer
            </button>
          </>
        ) : (
          <>
            <UploadCloud
              className={`w-8 h-8 ${survol ? "text-primary" : "text-muted-foreground"}`}
            />
            <p className="text-sm">
              Glisse ton fichier ici, ou <span className="text-primary">parcours</span>
            </p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </>
        )}
      </div>

      {erreur ? <p className="text-xs text-destructive">{erreur}</p> : null}
    </div>
  );
}
