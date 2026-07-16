import EnTetePage from "./EnTetePage";
import { cn } from "@/lib/utils";

// La coquille commune a toutes les pages de contenu : un en-tete FIGE en haut, et un contenu qui
// defile en dessous.
//
// POURQUOI CE COMPOSANT
// Chaque page reconstruisait sa propre mise en page, et trois comportements cohabitaient :
//   - `h-full overflow-y-auto` sur la section  -> TOUTE la page defile, titre et icone compris,
//     qui disparaissent des qu'on descend (c'etait le cas de la majorite des pages) ;
//   - `h-full overflow-hidden` + un enfant en `h-[calc(100%-6rem)]` (Bibliotheque) -> l'en-tete
//     reste, mais au prix d'un nombre magique ;
//   - `h-full overflow-hidden flex flex-col` + un enfant en `flex-1 min-h-0` (AdminMusiques) ->
//     la bonne solution.
//
// C'est la troisieme qui est generalisee ici.
//
// POURQUOI PAS LE `calc(100%-6rem)` DE BIBLIOTHEQUE
// Il code en dur la hauteur de l'en-tete. Or `EnTetePage` n'a pas de hauteur fixe : un sous-titre
// l'agrandit, et sur mobile le bloc `actions` passe SOUS le titre, ce qui l'agrandit encore. Le
// `calc` etait donc deja faux dans ces cas-la — le contenu depassait le bas de l'ecran, et les
// dernieres lignes devenaient inatteignables. Personne ne l'avait vu parce que la Bibliotheque
// n'a pas de sous-titre. Un nombre magique n'est pas faux tout de suite : il attend.
//
// `flex-1 min-h-0` n'a pas ce defaut : la zone de defilement prend ce qui reste, quelle que soit
// la hauteur reelle de l'en-tete.
//
// LE PIEGE DU `min-h-0`
// Sans lui, rien ne defile. Un enfant de flexbox a `min-height: auto` par defaut : il refuse de
// devenir plus petit que son contenu, donc `overflow-y-auto` n'a jamais rien a faire deborder —
// c'est la section entiere qui grandit et deborde de l'ecran. `min-h-0` leve cette protection et
// autorise l'enfant a etre plus petit que son contenu, donc a defiler.
export default function Page({
  icone,
  titre,
  sousTitre,
  actions,
  classeIcone,
  // Pour ce qui doit s'appliquer a la zone de defilement elle-meme (une grille, un `max-w`…).
  classeContenu,
  children,
}) {
  return (
    <section className="h-full flex flex-col overflow-hidden p-4 md:p-8">
      <EnTetePage
        icone={icone}
        titre={titre}
        sousTitre={sousTitre}
        actions={actions}
        classeIcone={classeIcone}
      />

      {/* `-mx-1 px-1` : la zone de defilement rogne ce qui depasse d'elle. Sans cette marge
          negative compensee par un padding, les ombres au survol des cartes et les anneaux de
          focus (navigation au clavier) seraient coupes net sur les bords. */}
      <div
        className={cn("flex-1 min-h-0 overflow-y-auto -mx-1 px-1", classeContenu)}
      >
        {children}
      </div>
    </section>
  );
}
