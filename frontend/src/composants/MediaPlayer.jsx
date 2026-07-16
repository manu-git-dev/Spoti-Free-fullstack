import {
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { apiFetch, urlFichier } from "@/lib/api";
import Attribution from "./Attribution";

export default function MediaPlayer({
  music,
  currentIndex,
  queue,
  setCurrentMusic,
  setCurrentIndex,
  maxIndex,
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

  const affichageDuration =
    Math.trunc(duration / 60)
      .toString()
      .padStart(2, "0") +
    ":" +
    Math.floor(duration % 60)
      .toString()
      .padStart(2, "0");
  const affichageCurrentTime =
    Math.trunc(timeUpdate / 60)
      .toString()
      .padStart(2, "0") +
    ":" +
    Math.floor(timeUpdate % 60)
      .toString()
      .padStart(2, "0");

  const handlePlay = () => {
    if (isPlaying == false) {
      setIsPlaying(true);
      audioRef.current.play();
    } else {
      setIsPlaying(false);
      audioRef.current.pause();
    }
  };
  const handleNext = () => {
    let nextIndex = currentIndex + 1;
    if (nextIndex > maxIndex) {
      nextIndex = 0;
      let nextMusic = queue[nextIndex];
      setCurrentMusic(nextMusic);
      setCurrentIndex(nextIndex);
    } else {
      let nextMusic = queue[nextIndex];
      setCurrentMusic(nextMusic);
      setCurrentIndex(nextIndex);
    }
  };

  const handlePrevious = () => {
    let previousIndex = currentIndex - 1;

    if (previousIndex < 0) {
      previousIndex = maxIndex;
      let previousMusic = queue[previousIndex];
      setCurrentMusic(previousMusic);
      setCurrentIndex(previousIndex);
    } else {
      let previousMusic = queue[previousIndex];
      setCurrentMusic(previousMusic);
      setCurrentIndex(previousIndex);
    }
  };

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
          audioRef.current.play();
          setIsPlaying(true);
        }}
        onTimeUpdate={() => setTimeUpdate(audioRef.current.currentTime)}
        onEnded={handleNext}
      ></audio>

      {/* Bloc mobile : barre compacte, juste play/pause */}
      <div className="flex md:hidden items-center gap-3 w-full px-3 py-2 bg-card border border-border rounded-2xl">
        <img
          src={urlFichier(music.src_image)}
          alt={`Pochette album ${music.title}`}
          className="w-11 h-11 rounded-lg object-cover"
        />
        <div className="flex flex-col min-w-0 flex-1">
          <p className="truncate font-semibold text-sm">{music.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {music.artist}
          </p>
        </div>
        <Button
          size="icon-sm"
          onClick={handlePlay}
          aria-label={isPlaying ? "Pause" : "Lecture"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
        </Button>
      </div>

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

          <div className="flex items-center gap-6">
            <button
              className="cursor-pointer text-muted-foreground hover:text-foreground hover:scale-110 transition"
              onClick={handlePrevious}
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
              className="cursor-pointer text-muted-foreground hover:text-foreground hover:scale-110 transition"
              onClick={handleNext}
            >
              <SkipForward className="w-5 h-5 fill-current" />
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
