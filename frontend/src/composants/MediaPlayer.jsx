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

  const API_URL = "http://localhost:3000/";

  const audioRef = useRef(null);



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
    console.log();
    
  }
  if (!music) {
    return <p>Aucune musique sélectionnée</p>;
  }

  return (
    <>
      <audio src={`${API_URL}${music.src_audio}`} ref={audioRef}></audio>
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
        <CircleArrowRight className="w-10 h-10 fill-blue-600" />
      </button>
      <button className="cursor-pointer hover:scale-110">
        <Volume1 className="w-10 h-10 fill-blue-600" />
      </button>
      <input
        type="range"
        min={0}
        max="100"
        value={volume}
        className="range range-primary"
        onChange={(e) => setVolume(e.target.value)}
      />
      <button className="cursor-pointer hover:scale-110">
        <Volume2 className="w-10 h-10 fill-blue-600" />
      </button>
      <h2 className="text-3xl mx-4">{music.titre}</h2>
      <p className="text-2xl mx-4">{music.artiste}</p>

      {/* <Heart
    className="
        w-8 h-8
        fill-red-500
        text-red-500
        cursor-pointer
        hover:scale-110
        transition
    "
/> */}
    </>
  );
}
