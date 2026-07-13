import Aside from "./composants/Aside";
import HeaderMobile from "./composants/HeaderMobile";
import BottomNav from "./composants/BottomNav";
import { useEffect, useState } from "react";
import MediaPlayer from "./composants/MediaPlayer";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Bibliotheque from "./pages/Bibliotheque";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Apropos from "./pages/Apropos";
import Contact from "./pages/Contact";
import Playlists from "./pages/Playlists";
import Favoris from "./pages/Favoris";
import MusicsInPlaylist from "./pages/MusicsInPlaylist";
import ProtectedRoute from "./composants/ProtectedRoute";
import Profil from "./pages/Profil";

function App() {
  const [musiques, setMusiques] = useState([]);
  const [currentMusic, setCurrentMusic] = useState(null);
  const [messageDeconnexion, setMessageDeconnexion] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [currentIndex, setCurrentIndex] = useState("");
  const [maxIndex, setMaxIndex] = useState(0);
  const [musiquesLikee, setMusiquesLikee] = useState([]);
  const [playlists, setPlaylists] = useState([]);

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
  useEffect(() => {
    const url = `http://localhost:3000/api/users/likes`;
    const token = localStorage.getItem("token");
    fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMusiquesLikee(data);
        } else {
          setMusiquesLikee([]);
        }
      })
      .catch((error) => console.error(error));
  }, []);
  useEffect(() => {
    const url = `http://localhost:3000/api/playlists`;
    const token = localStorage.getItem("token");
    fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPlaylists(data);
        } else {
          setPlaylists([]);
        }
      })
      .catch((error) => console.error(error));
  }, []);

  let musiquesFiltre = musiques.filter(
    (musique) =>
      musique.title.toLowerCase().includes(valueInput.toLowerCase()) ||
      musique.artist.toLowerCase().includes(valueInput.toLowerCase()),
  );

  musiquesFiltre = musiquesFiltre.sort((a, b) =>
    a.title.localeCompare(b.title),
  );

  useEffect(() => {
    setCurrentIndex(
      musiquesFiltre.findIndex(
        (musique) => musique.id_music === currentMusic?.id_music,
      ),
    );
  }, [currentMusic]);

  useEffect(() => {
    setMaxIndex(musiquesFiltre.length - 1);
  }, [musiquesFiltre]);

  return (
    <section className="box-border h-screen flex flex-col md:grid md:grid-cols-[260px_1fr] md:grid-rows-[1fr_88px] ">
      <div className="md:hidden">
        <HeaderMobile />
      </div>
      <Aside
        className="hidden md:flex md:row-start-1 md:col-start-1"
        user={user}
        playlists={playlists}
        setPlaylists={setPlaylists}
      />
      <main className="flex-1 min-h-0 md:col-start-2 md:row-start-1 bg-zinc-900 rounded-2xl overflow-hidden">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                musiques={musiques}
                user={user}
                messageDeconnexion={messageDeconnexion}
                setCurrentMusic={setCurrentMusic}
                musiquesLikee={musiquesLikee}
                setMusiquesLikee={setMusiquesLikee}
                setUser={setUser}
                token={token}
                setToken={setToken}
                setMessageDeconnexion={setMessageDeconnexion}
                currentMusic={currentMusic}
              />
            }
          />
          <Route
            path="/bibliotheque"
            element={
              <Bibliotheque
                musiques={musiquesFiltre}
                setCurrentMusic={setCurrentMusic}
                setValueInput={setValueInput}
                valueInput={valueInput}
                musiquesLikee={musiquesLikee}
                setMusiquesLikee={setMusiquesLikee}
                user={user}
                currentMusic={currentMusic}
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

          <Route
            path="/playlists"
            element={
              <ProtectedRoute user={user}>
                <Playlists playlists={playlists} setPlaylists={setPlaylists} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profil"
            element={
           
                <Profil
                  user={user}
                  messageDeconnexion={messageDeconnexion}
                  musiquesLikee={musiquesLikee}
                  setUser={setUser}
                  token={token}
                  setToken={setToken}
                  setMessageDeconnexion={setMessageDeconnexion}
                  playlists={playlists}
                />
             
            }
          />

          <Route
            path="/playlists/:idPlaylist"
            element={
              <ProtectedRoute user={user}>
                <MusicsInPlaylist
                  setCurrentMusic={setCurrentMusic}
                  setMusiquesLikee={setMusiquesLikee}
                  musiquesLikee={musiquesLikee}
                  user={user}
                  currentMusic={currentMusic}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/favoris"
            element={
              <ProtectedRoute user={user}>
                <Favoris
                  musiquesLikee={musiquesLikee}
                  setMusiquesLikee={setMusiquesLikee}
                  setCurrentMusic={setCurrentMusic}
                  user={user}
                  currentMusic={currentMusic}
                />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <MediaPlayer
        className="w-full md:row-start-2 md:col-span-2"
        music={currentMusic}
        currentIndex={currentIndex}
        musiquesFiltre={musiquesFiltre}
        setCurrentMusic={setCurrentMusic}
        setCurrentIndex={setCurrentIndex}
        maxIndex={maxIndex}
      />
      <div className="md:hidden">
        <BottomNav user={user} />
      </div>
    </section>
  );
}

export default App;
