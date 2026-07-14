import { Check, X, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { REGLES_MOT_DE_PASSE } from "@/lib/validation";

// Affiche les regles du mot de passe et les coche en direct pendant la saisie.
//
// Partage entre l'inscription et la reinitialisation : les deux pages exigent le meme mot de
// passe, elles doivent donc annoncer les memes regles. Dupliquer la liste dans chaque page, c'est
// se garantir qu'un jour l'une des deux mentira.
//
// `montrerErreurs` decide du ROUGE, pas du vert : tant que l'utilisateur n'a pas quitte le champ,
// une regle non remplie reste grise (il est simplement en train d'ecrire, ce n'est pas une faute).
// Le vert, lui, s'affiche des que la regle est remplie — un encouragement n'a pas besoin d'attendre.
export default function ChecklistMotDePasse({ motDePasse, montrerErreurs, id }) {
  return (
    <ul id={id} className="flex flex-col gap-1 mt-1.5">
      {REGLES_MOT_DE_PASSE.map((regle) => {
        const remplie = regle.test(motDePasse);
        const enFaute = !remplie && montrerErreurs;

        // Trois etats, trois symboles. Une regle pas encore remplie n'est PAS une erreur : lui
        // mettre une croix (le symbole de l'echec) reviendrait a reprocher a l'utilisateur de ne
        // pas avoir fini de taper. Elle reste un cercle vide, "a faire".
        const Icone = remplie ? Check : enFaute ? X : Circle;

        return (
          <li
            key={regle.id}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              remplie && "text-success",
              enFaute && "text-destructive",
              !remplie && !enFaute && "text-muted-foreground",
            )}
          >
            <Icone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{regle.libelle}</span>
            {/* L'etat d'une regle est porte par une couleur ET une icone — deux signaux qu'un
                lecteur d'ecran ne voit pas. Ce texte, invisible a l'ecran, le lui donne. */}
            <span className="sr-only">
              {remplie ? "(validé)" : "(pas encore validé)"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
