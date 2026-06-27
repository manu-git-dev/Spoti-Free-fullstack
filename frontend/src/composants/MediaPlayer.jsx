import {
  CircleArrowLeft,
  CircleArrowRight,
  Heart,
  Pause,
  Play,
  Volume1,
  Volume2,
} from "lucide-react";
import { useState, useRef } from "react";

export default function MediaPlayer({ music, currentIndex }) {
  // je dispose de la music cliquée dans music;
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [timeUpdate, setTimeUpdate] = useState(0);

  const API_URL = "http://localhost:3000/";

  const audioRef = useRef(null);

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
    console.log(currentIndex);
  };
  if (!music) {
    return <p>Aucune musique sélectionnée</p>;
  }

  return (
    <section className="row-start-2 col-start-2 col-span-1 flex items-center bg-zinc-800 rounded-4xl px-4 justify-around">
      <audio
        src={`${API_URL}${music.src_audio}`}
        ref={audioRef}
        volume = {volume / 100}
        onLoadedMetadata={() => {
          setDuration(audioRef.current.duration);
        }}
        onTimeUpdate={() => setTimeUpdate(audioRef.current.currentTime)}
      ></audio>
      <button className="cursor-pointer hover:scale-110" onClick={handlePlay}>
        {isPlaying ? (
          <Pause className="w-10 h-10 fill-blue-600" />
        ) : (
          <Play className="w-10 h-10 fill-blue-600" />
        )}
      </button>
      <button className="cursor-pointer hover:scale-110 ">
        <CircleArrowLeft className="w-10 h-10 fill-blue-600" />
      </button>
      <button className="cursor-pointer hover:scale-110">
        <CircleArrowRight
          className="w-10 h-10 fill-blue-600"
          onClick={handleNext}
        />
      </button>
      <button className="cursor-pointer hover:scale-110">
        <Volume1
          className="w-10 h-10 fill-blue-600"
          onClick={() => {
            const newVolume = Math.max(0, volume - 5);
            setVolume(newVolume);
            audioRef.current.volume = newVolume / 100;
          }}
        />
      </button>
      <input
        type="range"
        min={0}
        max="100"
        value={volume}
        className="range range-primary"
        onChange={(e) => {
          const newVolume = Number(e.target.value);
          setVolume(newVolume);
          audioRef.current.volume = newVolume / 100;
        }}
      />
      <button
        className="cursor-pointer hover:scale-110"
        onClick={() => {
          const newVolume = Math.min(100, volume + 5);
          setVolume(newVolume);
          audioRef.current.volume = newVolume / 100;
        }}
      >
        <Volume2 className="w-10 h-10 fill-blue-600" />
      </button>
      <h2 className="text-3xl mx-4">{music.title}</h2>
      <p className="text-2xl mx-4">{music.artist}</p>
      <p>
        {affichageCurrentTime} / {affichageDuration}
      </p>
      <input
        type="range"
        min={0}
        max={duration || 0}
        value={timeUpdate || 0}
        className="range range-primary"
        onChange={(e) => {
          const newTime = Number(e.target.value);
          setTimeUpdate(newTime);
          audioRef.current.currentTime = newTime;
        }}
      />
    </section>
  );
}
