import {
  ChevronDown,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { apiFetch, urlFichier } from "@/lib/api";
import { formaterDuree } from "@/lib/utils";
import Attribution from "./Attribution";

// Melange de Fisher-Yates : on parcourt le tableau de la fin au debut et on echange chaque element
// avec un element tire au hasard PARMI CEUX PAS ENCORE FIXES. C'est le melange "correct" — chaque
// permutation est equiprobable. Le raccourci qu'on voit partout, `sort(() => Math.random() - 0.5)`,
// est biaise (l'ordre de comparaison de `sort` n'est pas uniforme) : a fuir.
// `indexEnTete` (le titre en cours) est ramene en premiere position : activer l'aleatoire ne doit
// jamais couper le morceau qu'on est en train d'ecouter.
function melangerOrdre(taille, indexEnTete) {
  const ordre = Array.from({ length: taille }, (_, i) => i);
  for (let i = ordre.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
  }
  const pos = ordre.indexOf(indexEnTete);
  if (pos > 0) [ordre[0], ordre[pos]] = [ordre[pos], ordre[0]];
  return ordre;
}

// Raccourcis clavier « ambiants » : ils n'agissent que si AUCUN controle n'a le focus. Des
// qu'un champ, un bouton, un lien ou un slider est focus, son clavier natif gagne — on evite
// ainsi les trois pieges de la barre d'espace (taper une espace dans la recherche, activer
// deux fois un bouton focus, bloquer le defilement) et le vol des fleches d'un slider. C'est
// la regle la plus sure : elle ne peut structurellement rien casser.
function focusSurUnControle() {
  const actif = document.activeElement;
  if (!actif || actif === document.body) return false;
  return actif.matches(
    "input, textarea, select, button, a[href], [role='button'], [role='slider'], [contenteditable='true']",
  );
}

export default function MediaPlayer({
  music,
  currentIndex,
  queue,
  setCurrentMusic,
  setCurrentIndex,
  onEcouteComptee,
  // `isPlaying` ne vit plus ici mais dans App : le logo de l'Aside en a besoin lui aussi, et
  // deux composants freres ne peuvent partager un etat que via leur parent commun.
  isPlaying,
  setIsPlaying,
  className = "",
}) {
  const [volume, setVolume] = useState(50);
  const [duration, setDuration] = useState(0);
  const [timeUpdate, setTimeUpdate] = useState(0);

  // Mode de repetition : "off" (s'arrete en fin de file) -> "all" (reboucle) -> "one" (rejoue le
  // meme titre). Defaut "off", le standard. Avant, le lecteur rebouclait a l'infini sans qu'on
  // l'ait choisi, parce que `onEnded` revenait a l'index 0 : un "repeter tout" impose en dur.
  const [repeatMode, setRepeatMode] = useState("off");
  // Lecture aleatoire. Quand elle est active, `shuffleOrder` contient une SEQUENCE melangee des
  // index de la file (0..n-1), calculee UNE fois a l'activation. On la parcourt dans l'ordre : ca
  // garantit que chaque titre passe une fois avant repetition — ce qu'un tirage au hasard a chaque
  // saut ne garantit pas.
  const [isShuffle, setIsShuffle] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState([]);

  // Écran "Lecture en cours" plein écran (mobile uniquement). Ouvert en tapant la barre compacte.
  // Il vit ICI, pas dans un composant séparé, pour partager le même <audio> et les mêmes
  // gestionnaires : une seule source de vérité pour la lecture (cf. Piste 2, décidée avec Manuel).
  const [expanded, setExpanded] = useState(false);

  const audioRef = useRef(null);

  // Le volume de l'element <audio> suit l'etat React, et UNIQUEMENT ici.
  //
  // Avant, il etait ecrit a deux endroits : dans le JSX (sans effet, voir plus bas) et dans le
  // gestionnaire du curseur. Deux endroits qui ecrivent la meme chose, c'est deux endroits qui
  // finissent par ne plus etre d'accord. L'etat decide, l'effet applique.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume, music?.id_music]);

  // Compte une ecoute a chaque NOUVELLE piste lancee (alimente le Top 5).
  // La dependance est `music?.id_music` et non `music` : reprendre la lecture apres une pause
  // ne relance pas l'effet, donc une meme piste n'est comptee qu'une fois par lancement.
  const idMusic = music?.id_music;
  useEffect(() => {
    if (!idMusic) return;

    apiFetch(`/api/musics/ecoute/${idMusic}`, { method: "POST" })
      .then(() => onEcouteComptee?.())
      .catch((error) => console.error(error));
  }, [idMusic, onEcouteComptee]);

  // Si la file change pendant qu'on est en aleatoire (l'utilisateur lance un titre depuis une autre
  // page), la sequence melangee pointe vers l'ANCIENNE file : ses index ne veulent plus rien dire.
  // On la regenere. On ne depend QUE de `queue` a dessein : ajouter `currentIndex` remelangerait a
  // chaque changement de titre et casserait la garantie "une passe complete avant repetition".
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- regeneration voulue de l'ordre aleatoire quand la file change (les index de l'ancienne file ne valent plus rien)
    if (isShuffle) setShuffleOrder(melangerOrdre(queue.length, currentIndex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  const affichageDuration = formaterDuree(duration);
  const affichageCurrentTime = formaterDuree(timeUpdate);

  // Lance la lecture en AVALANT le rejet de `play()`. La promesse rejette (AbortError) quand une
  // nouvelle piste se charge avant que la precedente ait demarre — benin, mais non gere ca remonte
  // un "unhandled promise rejection" a chaque changement rapide de titre. Le `?.` protege le cas
  // (theorique) ou l'element audio n'est pas encore monte.
  const lire = () => audioRef.current?.play().catch(() => {});

  const handlePlay = () => {
    if (isPlaying == false) {
      setIsPlaying(true);
      lire();
    } else {
      setIsPlaying(false);
      audioRef.current.pause();
    }
  };
  // L'ordre dans lequel on parcourt la file. En lecture normale, c'est la file elle-meme
  // (0, 1, 2, ...). En aleatoire, c'est la sequence melangee. Une seule variable a consulter, quel
  // que soit le mode : les gestionnaires ci-dessous n'ont plus a distinguer les deux cas.
  const ordreLecture = isShuffle
    ? shuffleOrder
    : Array.from({ length: queue.length }, (_, i) => i);

  // Deplacement dans l'ordre de lecture. `delta` = +1 (suivant) ou -1 (precedent). On LIT la
  // position courante par `indexOf(currentIndex)` au lieu de conserver un pointeur separe : un etat
  // derive de moins a garder synchronise, exactement comme `currentIndex` l'est deja cote App.
  const allerVers = (delta) => {
    if (queue.length === 0) return;
    const pointeur = ordreLecture.indexOf(currentIndex);
    let cible = pointeur + delta;

    // Depassement en AVANT en aleatoire : on entame une nouvelle passe remelangee (sinon on
    // rejouerait la meme sequence). Le titre courant repasse en tete, puis on avance d'un cran pour
    // ne pas le rejouer immediatement.
    if (cible > ordreLecture.length - 1 && isShuffle) {
      const nouvelOrdre = melangerOrdre(queue.length, currentIndex);
      setShuffleOrder(nouvelOrdre);
      const indexFile = nouvelOrdre[1] ?? nouvelOrdre[0];
      setCurrentMusic(queue[indexFile]);
      setCurrentIndex(indexFile);
      return;
    }

    // Bouclage aux extremites (file lineaire, ou recul avant le premier titre).
    if (cible > ordreLecture.length - 1) cible = 0;
    if (cible < 0) cible = ordreLecture.length - 1;

    const indexFile = ordreLecture[cible] ?? 0;
    setCurrentMusic(queue[indexFile]);
    setCurrentIndex(indexFile);
  };

  // Les boutons manuels avancent/reculent TOUJOURS (appuyer sur "suivant" ne doit jamais rester
  // bloque) : ils ignorent le mode de repetition, qui ne concerne que la fin naturelle d'un titre.
  const handleNext = () => allerVers(1);
  const handlePrevious = () => allerVers(-1);

  // Fin NATURELLE d'un morceau (`onEnded`). C'est ici, et seulement ici, que le mode de repetition
  // agit : "one" rejoue le meme titre ; "off" au dernier titre de l'ordre s'arrete ; sinon on
  // enchaine comme un "suivant" (et "all" reboucle grace au wrap de `allerVers`).
  const handleEnded = () => {
    if (repeatMode === "one") {
      audioRef.current.currentTime = 0;
      lire();
      return;
    }
    const estDernier = ordreLecture.indexOf(currentIndex) === ordreLecture.length - 1;
    if (estDernier && repeatMode === "off") {
      setIsPlaying(false);
      return;
    }
    allerVers(1);
  };

  const toggleShuffle = () => {
    if (isShuffle) {
      setIsShuffle(false);
      setShuffleOrder([]);
    } else {
      setIsShuffle(true);
      setShuffleOrder(melangerOrdre(queue.length, currentIndex));
    }
  };

  // Cycle des trois etats au clic, comme sur les lecteurs standards.
  const cycleRepeat = () => {
    setRepeatMode((mode) =>
      mode === "off" ? "all" : mode === "all" ? "one" : "off",
    );
  };

  // Libellé partagé par les boutons repeat (desktop + mobile), pour ne pas répéter le ternaire.
  const repeatLabel =
    repeatMode === "one"
      ? "Répéter le titre courant"
      : repeatMode === "all"
        ? "Répéter la file"
        : "Répétition désactivée";

  // Pilotage au clavier. L'ecouteur est global (window) et pose UNE SEULE FOIS (deps []) : le
  // lecteur se re-rend ~4x/seconde pendant la lecture (barre de progression), on ne veut pas
  // retirer/reposer un listener a cette frequence. Mais les gestionnaires qu'il appelle
  // capturent l'etat courant (isPlaying, currentIndex...) et changent a chaque rendu : on les
  // garde donc a jour dans une ref, que l'ecouteur lit AU MOMENT de la frappe (pattern
  // "latest ref"). Sans ca, le listener fige appellerait des gestionnaires perimes.
  const actionsClavier = useRef({});
  useEffect(() => {
    actionsClavier.current = { handlePlay, handleNext, handlePrevious };
  });

  useEffect(() => {
    const onKeyDown = (evenement) => {
      // Pas de piste chargee (l'element <audio> n'est pas monte) : rien a piloter.
      if (!audioRef.current) return;
      // Regle ambiante : si un controle a le focus, on lui laisse son clavier natif.
      if (focusSurUnControle()) return;

      if (evenement.code === "Space") {
        evenement.preventDefault(); // sans quoi la barre d'espace fait defiler la page
        actionsClavier.current.handlePlay();
      } else if (evenement.code === "ArrowRight") {
        evenement.preventDefault();
        actionsClavier.current.handleNext();
      } else if (evenement.code === "ArrowLeft") {
        evenement.preventDefault();
        actionsClavier.current.handlePrevious();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!music) {
    return (
      <section className={`hidden md:flex ${className}`}>
        <div className="flex items-center justify-center gap-3 w-full h-full bg-card border border-border rounded-2xl px-6 text-muted-foreground">
          <Music className="w-5 h-5 opacity-60" />
          <p className="text-sm">
            Aucune musique sélectionnée — choisis un titre pour lancer la
            lecture.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      {/* Pas de `volume={...}` ici : le volume d'un <audio> est une PROPRIETE du DOM, pas un
          attribut HTML. React ecrivait donc sagement `volume="0.5"` dans le balisage, et le
          navigateur l'ignorait — le curseur affichait 50 % pendant que le son sortait a 100 %.
          C'est l'effet ci-dessus qui l'applique, sur la propriete. */}
      <audio
        src={urlFichier(music.src_audio)}
        ref={audioRef}
        onLoadedMetadata={() => {
          setDuration(audioRef.current.duration);
          lire();
          setIsPlaying(true);
        }}
        onTimeUpdate={() => setTimeUpdate(audioRef.current.currentTime)}
        onEnded={handleEnded}
      ></audio>

      {/* Bloc mobile : mini-lecteur compact, à la Spotify. La zone pochette+titre est un vrai
          bouton qui ouvre l'écran "Lecture en cours" ; le play/pause est un frère à côté (pas
          imbriqué) — sinon on aurait un bouton dans un bouton (HTML invalide) et il faudrait
          stopPropagation. Les commandes complètes (shuffle/prec/suiv/repeat) vivent dans l'écran
          plein écran, pas ici : une barre compacte reste minimale. */}
      <div className="flex md:hidden items-center gap-2 w-full px-3 py-2 bg-card border border-border rounded-2xl">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Ouvrir le lecteur"
          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
        >
          <img
            src={urlFichier(music.src_image)}
            alt={`Pochette album ${music.title}`}
            className="w-11 h-11 rounded-lg object-cover shrink-0"
          />
          <span className="flex flex-col min-w-0 flex-1">
            <span className="truncate font-semibold text-sm">{music.title}</span>
            <span className="truncate text-xs text-muted-foreground">
              {music.artist}
            </span>
          </span>
        </button>
        <Button
          size="icon-sm"
          onClick={handlePlay}
          aria-label={isPlaying ? "Pause" : "Lecture"}
          className="shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
        </Button>
      </div>

      {/* Écran "Lecture en cours" plein écran (mobile). On réutilise le Dialog partagé du projet
          (focus-trap, Échap, blocage du scroll gratuits) mais forcé en plein écran via className :
          les classes de centrage de base (top-1/2, -translate, max-w, rounded, grid) sont écrasées
          par tailwind-merge. Aucune modif du composant partagé — les 7 autres modales n'en savent
          rien. */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent
          showCloseButton={false}
          className="inset-0 top-0 left-0 flex h-full w-full max-w-none translate-x-0 translate-y-0 flex-col gap-6 rounded-none bg-background p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          {/* En-tête : chevron pour refermer (revient au mini-lecteur) */}
          <div className="flex items-center justify-start">
            <DialogClose
              render={<Button variant="ghost" size="icon" />}
              aria-label="Réduire le lecteur"
            >
              <ChevronDown className="w-6 h-6" />
            </DialogClose>
          </div>

          {/* Pochette */}
          <div className="flex flex-1 items-center justify-center min-h-0">
            <img
              src={urlFichier(music.src_image)}
              alt={`Pochette album ${music.title}`}
              className="w-full max-w-xs aspect-square rounded-2xl object-cover shadow-xl"
            />
          </div>

          {/* Titre / artiste / attribution — le titre EST le titre accessible du dialog */}
          <div className="min-w-0">
            <DialogTitle className="truncate text-xl font-bold">
              {music.title}
            </DialogTitle>
            <DialogDescription className="truncate text-base">
              {music.artist}
            </DialogDescription>
            <Attribution musique={music} />
          </div>

          {/* Barre de progression (mêmes gestionnaires que le desktop) */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 text-right">
              {affichageCurrentTime}
            </span>
            <Slider
              value={timeUpdate || 0}
              min={0}
              max={duration || 0}
              className="flex-1"
              aria-label="Position dans le morceau"
              onValueChange={(nouveauTemps) => {
                setTimeUpdate(nouveauTemps);
                if (audioRef.current) audioRef.current.currentTime = nouveauTemps;
              }}
            />
            <span className="text-xs text-muted-foreground w-10">
              {affichageDuration}
            </span>
          </div>

          {/* Transport complet : shuffle · prec · play · suiv · repeat */}
          <div className="flex items-center justify-between px-2 pb-4">
            <button
              className={`cursor-pointer p-2 transition ${
                isShuffle ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={toggleShuffle}
              aria-label="Lecture aléatoire"
              aria-pressed={isShuffle}
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <button
              className="cursor-pointer p-2 text-foreground transition"
              onClick={handlePrevious}
              aria-label="Titre précédent"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>
            <Button
              size="icon"
              onClick={handlePlay}
              aria-label={isPlaying ? "Pause" : "Lecture"}
              className="h-16 w-16 rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current" />
              )}
            </Button>
            <button
              className="cursor-pointer p-2 text-foreground transition"
              onClick={handleNext}
              aria-label="Titre suivant"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>
            <button
              className={`cursor-pointer p-2 transition ${
                repeatMode !== "off" ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={cycleRepeat}
              aria-label={repeatLabel}
              aria-pressed={repeatMode !== "off"}
            >
              {repeatMode === "one" ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bloc desktop : barre de contrôle complète */}
      <div className="hidden md:flex md:flex-col w-full h-full bg-card border border-border rounded-2xl px-6 py-3 gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 w-64 min-w-0">
            <img
              src={urlFichier(music.src_image)}
              alt={`Pochette album ${music.title}`}
              className="w-12 h-12 rounded-lg object-cover ring-2 ring-primary/40"
            />
            <div className="min-w-0">
              <p className="truncate font-semibold">{music.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {music.artist}
              </p>
              <Attribution musique={music} />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button
              className={`cursor-pointer p-2 -m-2 rounded-full hover:scale-110 transition ${
                isShuffle
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={toggleShuffle}
              aria-label="Lecture aléatoire"
              aria-pressed={isShuffle}
              title="Lecture aléatoire"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              className="cursor-pointer p-2 -m-2 rounded-full text-muted-foreground hover:text-foreground hover:scale-110 transition"
              onClick={handlePrevious}
              aria-label="Titre précédent"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <Button
              size="icon"
              onClick={handlePlay}
              aria-label={isPlaying ? "Pause" : "Lecture"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
            </Button>
            <button
              className="cursor-pointer p-2 -m-2 rounded-full text-muted-foreground hover:text-foreground hover:scale-110 transition"
              onClick={handleNext}
              aria-label="Titre suivant"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
            <button
              className={`cursor-pointer p-2 -m-2 rounded-full hover:scale-110 transition ${
                repeatMode !== "off"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={cycleRepeat}
              aria-label={repeatLabel}
              aria-pressed={repeatMode !== "off"}
              title={repeatLabel}
            >
              {repeatMode === "one" ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 w-64 justify-end">
            <Volume2 className="w-5 h-5 opacity-70" />
            {/* `value={volume}` et non `value={[volume]}`, et le gestionnaire recoit un NOMBRE.
                Le curseur de Base UI rend un tableau quand on lui donne un tableau (curseur a
                deux poignees, pour un intervalle), et un nombre sinon. On lui passait un tableau
                d'une seule valeur, il rendait un nombre — et `([newVolume]) => ...` tentait de
                destructurer 18 comme un tableau. « number 18 is not iterable » : le gestionnaire
                mourait a chaque mouvement, en silence pour l'utilisateur. */}
            <Slider
              value={volume}
              min={0}
              max={100}
              className="w-24"
              aria-label="Volume"
              onValueChange={(nouveauVolume) => setVolume(nouveauVolume)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <span className="text-xs text-muted-foreground">
            {affichageCurrentTime}
          </span>
          {/* Le deplacement dans le morceau reste imperatif : on ECRIT `currentTime`, on ne le
              declare pas. `setTimeUpdate` n'est la que pour que la poignee suive le doigt sans
              attendre le prochain `onTimeUpdate` de l'element audio. */}
          <Slider
            value={timeUpdate || 0}
            min={0}
            max={duration || 0}
            className="flex-1"
            aria-label="Position dans le morceau"
            onValueChange={(nouveauTemps) => {
              setTimeUpdate(nouveauTemps);
              if (audioRef.current) audioRef.current.currentTime = nouveauTemps;
            }}
          />
          <span className="text-xs text-muted-foreground">
            {affichageDuration}
          </span>
        </div>
      </div>
    </section>
  );
}
