import Aside from "./composants/Aside";
import Header from "./composants/Header";
import { useEffect, useState } from "react";
import MediaPlayer from "./composants/MediaPlayer";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Apropos from "./pages/Apropos";
import Contact from "./pages/Contact";
import Playlists from "./pages/Playlists";
import Favoris from "./pages/Favoris";

function App() {
  const [musiques, setMusiques] = useState([]);
  const [currentMusic, setCurrentMusic] = useState(null);
  const [messageDeconnexion, setMessageDeconnexion] = useState("");
  const [valueInput, setValueInput] = useState("");

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token");
  });



  useEffect(() => {
    fetch("http://localhost:3000/api/musics")
      .then((response) => response.json())
      .then((data) => {
        setMusiques(data);
      })
      .catch((error) => console.error(error));
  }, []);

 let musiquesFiltre = musiques.filter(
    (musique) =>
      musique.title.toLowerCase().includes(valueInput.toLowerCase()) ||
      musique.artist.toLowerCase().includes(valueInput.toLowerCase()),
  );

  musiquesFiltre = musiquesFiltre.sort((a,b) => a.title.localeCompare(b.title))  
  
  const currentIndex = musiquesFiltre.findIndex(
    (musique) => musique.id === currentMusic?.id,
  );

  return (
    <section className="box-border h-screen grid grid-cols-[250px_1fr] grid-rows-[100px_90px_1fr] p-2 bg-black gap-2">
      <header className="col-span-2 flex justify-between bg-zinc-900 rounded-2xl p-2 items-center">
        <Header
          user={user}
          setUser={setUser}
          token={token}
          setToken={setToken}
          setMessageDeconnexion={setMessageDeconnexion}
        />
      </header>
        <MediaPlayer music={currentMusic} currentIndex={currentIndex} />
      <Aside user={user} />
      <main className="col-start-2 row-start-3 bg-zinc-900 rounded-2xl h-full overflow-hidden">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                musiques={musiquesFiltre}
                user={user}
                messageDeconnexion={messageDeconnexion}
                onSelectMusique={setCurrentMusic}
                setValueInput={setValueInput}
                valueInput={valueInput}
              />
            }
          />
          <Route
            path="/connexion"
            element={
              <Login
                user={user}
                setUser={setUser}
                token={token}
                setToken={setToken}
              />
            }
          />
          <Route path="/inscription" element={<Register />} />
          <Route path="/a-propos" element={<Apropos />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/favoris" element={<Favoris />} />
        </Routes>
      </main>
    </section>
  );
}

export default App;
