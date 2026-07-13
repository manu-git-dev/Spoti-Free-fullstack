import Aside from "./composants/Aside";
import HeaderMobile from "./composants/HeaderMobile";
import BottomNav from "./composants/BottomNav";
import { useEffect, useState } from "react";
import MediaPlayer from "./composants/MediaPlayer";
import { Routes, Route } from "react-router-dom";
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
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [musiques, setMusiques] = useState([]);
  const [currentMusic, setCurrentMusic] = useState(null);
  const [valueInput, setValueInput] = useState("");
  const [currentIndex, setCurrentIndex] = useState("");
  const [maxIndex, setMaxIndex] = useState(0);
  const [currentQueue, setCurrentQueue] = useState([]);
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
  // Le token JWT expire (24h). Passe ce delai, le token stocke reste dans localStorage :
  // l'app croyait donc l'utilisateur connecte ("Bonjour X", bouton Deconnexion), alors que
  // chaque action echouait avec "Token invalide". On purge la session des qu'une route
  // protegee repond 401.
  function sessionExpiree() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    toast.info("Ta session a expiré, reconnecte-toi.");
  }

  // Ces deux effets dependent de `token` (le state), et non de localStorage lu une seule
  // fois au montage : localStorage n'est pas reactif, donc avec `[]` en dependances ils ne
  // se relancaient jamais apres une connexion. Consequence : `musiquesLikee` restait vide,
  // les coeurs des musiques deja likees s'affichaient vides, et recliquer dessus renvoyait
  // une erreur (like en doublon).
  useEffect(() => {
    if (!token) {
      setMusiquesLikee([]);
      return;
    }
    fetch(`http://localhost:3000/api/users/likes`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.status === 401) {
          sessionExpiree();
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (data === null) return;
        setMusiquesLikee(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error(error));
  }, [token]);

  useEffect(() => {
    if (!token) {
      setPlaylists([]);
      return;
    }
    fetch(`http://localhost:3000/api/playlists`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setPlaylists(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error(error));
  }, [token]);

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
      currentQueue.findIndex(
        (musique) => musique.id_music === currentMusic?.id_music,
      ),
    );
  }, [currentMusic, currentQueue]);

  useEffect(() => {
    setMaxIndex(currentQueue.length - 1);
  }, [currentQueue]);

  return (
    <section className="box-border h-screen flex flex-col bg-background md:grid md:grid-cols-[260px_1fr] md:grid-rows-[1fr_88px] md:gap-3 md:p-3">
      <div className="md:hidden">
        <HeaderMobile />
      </div>
      <Aside
        className="hidden md:flex md:row-start-1 md:col-start-1"
        user={user}
        playlists={playlists}
        setPlaylists={setPlaylists}
      />
      <main className="relative flex-1 min-h-0 mx-3 mt-3 md:m-0 md:col-start-2 md:row-start-1 bg-card border border-border rounded-2xl overflow-hidden">
        {/* "Bloom" du theme : halo violet/indigo en haut du panneau de contenu */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/20 via-secondary/10 to-transparent"
        />
        <div className="relative h-full">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                musiques={musiques}
                user={user}
                setCurrentMusic={setCurrentMusic}
                setCurrentQueue={setCurrentQueue}
                musiquesLikee={musiquesLikee}
                setMusiquesLikee={setMusiquesLikee}
                setUser={setUser}
                token={token}
                setToken={setToken}
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
                setCurrentQueue={setCurrentQueue}
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
              <Playlists playlists={playlists} setPlaylists={setPlaylists} user={user} />
            }
          />

          <Route
            path="/profil"
            element={
           
                <Profil
                  user={user}
                  musiquesLikee={musiquesLikee}
                  setUser={setUser}
                  token={token}
                  setToken={setToken}
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
                  setCurrentQueue={setCurrentQueue}
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
              <Favoris
                musiquesLikee={musiquesLikee}
                setMusiquesLikee={setMusiquesLikee}
                setCurrentMusic={setCurrentMusic}
                setCurrentQueue={setCurrentQueue}
                user={user}
                currentMusic={currentMusic}
              />
            }
          />
        </Routes>
        </div>
      </main>
      <MediaPlayer
        className="w-full px-3 pt-3 md:p-0 md:row-start-2 md:col-span-2"
        music={currentMusic}
        currentIndex={currentIndex}
        queue={currentQueue}
        setCurrentMusic={setCurrentMusic}
        setCurrentIndex={setCurrentIndex}
        maxIndex={maxIndex}
      />
      <div className="md:hidden">
        <BottomNav user={user} />
      </div>
      {/* Point de montage unique des toasts : toute l'app appelle toast() sans rien monter */}
      <Toaster />
    </section>
  );
}

export default App;
