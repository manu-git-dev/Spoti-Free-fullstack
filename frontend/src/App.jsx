import Aside from "../composants/Aside";
import Header from "../composants/Header";
import { useEffect, useState } from "react";
import MediaPlayer from "../composants/MediaPlayer";
import {Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Apropos from "./pages/Apropos";
import Contact from "./pages/Contact";

function App() {
  const [musiques, setMusiques] = useState([]);
  const [currentMusic, setCurrentMusic] = useState(null);
  
  const currentIndex = musiques.findIndex(
  (musique) => musique.id === currentMusic?.id
);

  

  useEffect(() => {
    fetch("http://localhost:8000/api/musiques")
      .then((response) => response.json())
      .then((data) => {
        setMusiques(data);
      })
      .catch((error) => console.error(error));
  }, []);

  return (
    <section className="box-border h-screen grid grid-cols-[250px_1fr] grid-rows-[100px_90px_1fr] p-2 bg-black gap-2">
      <header className="col-span-2 flex justify-between bg-zinc-900 rounded-2xl p-2 items-center">
        <Header  />
      </header>      
      <section className="row-start-2 col-start-2 col-span-1 flex items-center bg-zinc-800 rounded-4xl px-4 justify-around">
        <MediaPlayer music={currentMusic} currentIndex={currentIndex}/>
      </section>
        <Aside  />
      <main className="col-start-2 row-start-3 bg-zinc-900 rounded-2xl">
        <Routes>
          <Route path="/" element={<Home musiques={musiques}  onSelectMusique={setCurrentMusic} />}/>
          <Route path="/connexion" element={<Login/>}/>
          <Route path="/inscription" element={<Register/>}/>
          <Route path="/a-propos" element={<Apropos />}/>
          <Route path="/contact" element={<Contact/>}/>
        </Routes>
      </main>
    </section>
  );
}

export default App;
