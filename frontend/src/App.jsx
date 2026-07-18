import Aside from "./composants/Aside";
import HeaderMobile from "./composants/HeaderMobile";
import BottomNav from "./composants/BottomNav";
import { useCallback, useEffect, useMemo, useState } from "react";
import MediaPlayer from "./composants/MediaPlayer";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Bibliotheque from "./pages/Bibliotheque";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MotDePasseOublie from "./pages/MotDePasseOublie";
import ReinitialiserMotDePasse from "./pages/ReinitialiserMotDePasse";
import Apropos from "./pages/Apropos";
import Contact from "./pages/Contact";
import MentionsLegales from "./pages/MentionsLegales";
import Playlists from "./pages/Playlists";
import Favoris from "./pages/Favoris";
import MusicsInPlaylist from "./pages/MusicsInPlaylist";
import ProtectedRoute from "./composants/ProtectedRoute";
import Profil from "./pages/Profil";
import Deposer from "./pages/Deposer";
import MesDepots from "./pages/MesDepots";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUtilisateurs from "./pages/AdminUtilisateurs";
import AdminMusiques from "./pages/AdminMusiques";
import AdminDepots from "./pages/AdminDepots";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { apiFetch, definirSurSessionExpiree } from "@/lib/api";

function App() {
  const emplacement = useLocation();
  const [musiques, setMusiques] = useState([]);
  const [currentMusic, setCurrentMusic] = useState(null);
  const [valueInput, setValueInput] = useState("");
  // `null` = aucun filtre, on montre tout. Ce n'est pas la chaine vide : "" est un genre qui
  // pourrait exister, `null` dit "la question n'est pas posee".
  const [genreFiltre, setGenreFiltre] = useState(null);
  const [currentIndex, setCurrentIndex] = useState("");
  const [currentQueue, setCurrentQueue] = useState([]);
  // "En lecture" vivait DANS MediaPlayer. Mais le logo (dans l'Aside et le HeaderMobile) doit
  // savoir si la musique tourne pour animer son egaliseur — et l'Aside n'est pas un enfant du
  // lecteur, c'est son frere. Un etat partage par deux freres doit remonter dans leur parent
  // commun, qui le redistribue : c'est le "lifting state up" de React.
  const [isPlaying, setIsPlaying] = useState(false);
  const [musiquesLikee, setMusiquesLikee] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [top5, setTop5] = useState([]);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token");
  });

  useEffect(() => {
    apiFetch("/api/musics")
      .then(({ donnees }) => {
        setMusiques(Array.isArray(donnees) ? donnees : []);
      })
      .catch((error) => console.error(error));
  }, []);

  // Comptage des pages vues.
  //
  // C'est le FRONT qui signale la visite, et non un middleware cote serveur : dans une SPA, le
  // serveur ne voit passer que des appels API — et une seule page en declenche plusieurs. On
  // compterait donc plusieurs "visites" pour une seule page reellement consultee.
  //
  // On n'attend pas la reponse et on avale l'erreur : un echec de comptage ne doit jamais
  // perturber la navigation de l'utilisateur.
  useEffect(() => {
    apiFetch("/api/admin/visite", {
      method: "POST",
      body: { chemin: emplacement.pathname },
    }).catch(() => {});
  }, [emplacement.pathname]);

  // Top 5 reel (classement par nombre d'ecoutes), et non plus un `.slice(0, 5)` de la
  // bibliotheque triee par titre. `chargerTop5` est rappelee apres chaque ecoute comptee
  // pour que le classement se mette a jour sans rechargement de page.
  const chargerTop5 = useCallback(() => {
    apiFetch("/api/musics/top")
      .then(({ donnees }) => {
        setTop5(Array.isArray(donnees) ? donnees : []);
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    chargerTop5();
  }, [chargerTop5]);
  // Le token JWT expire (24h). Passe ce delai, le token stocke reste dans localStorage :
  // l'app croyait donc l'utilisateur connecte ("Bonjour X", bouton Deconnexion), alors que
  // chaque action echouait avec "Token invalide". On purge la session des qu'une route
  // protegee repond 401.
  const sessionExpiree = useCallback(() => {
    // deja deconnecte : on ne re-affiche pas le message a chaque appel
    if (!localStorage.getItem("token")) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    toast.info("Ta session a expiré, reconnecte-toi.");
  }, []);

  // Branche l'interception des 401 : desormais N'IMPORTE quel appel via apiFetch qui recoit
  // un 401 (une action isolee comme un like, pas seulement le chargement initial) purge la
  // session automatiquement.
  useEffect(() => {
    definirSurSessionExpiree(sessionExpiree);
  }, [sessionExpiree]);

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
    apiFetch("/api/users/likes")
      .then(({ donnees }) => {
        setMusiquesLikee(Array.isArray(donnees) ? donnees : []);
      })
      .catch((error) => console.error(error));
  }, [token]);

  useEffect(() => {
    if (!token) {
      setPlaylists([]);
      return;
    }
    apiFetch("/api/playlists")
      .then(({ donnees }) => {
        setPlaylists(Array.isArray(donnees) ? donnees : []);
      })
      .catch((error) => console.error(error));
  }, [token]);

  // Les genres reellement presents dans le catalogue, tries par nombre de morceaux.
  //
  // La liste est DEDUITE des donnees, jamais ecrite en dur : le catalogue est genere par
  // `scripts/importer-jamendo.mjs`, et un depôt approuve peut en apporter un nouveau. Une liste
  // figee ici afficherait un jour un genre vide, ou en oublierait un.
  //
  // Les morceaux sans genre (9 sur 100 aujourd'hui) n'ont pas de pastille : ils restent
  // accessibles via « Tous ». Une pastille « Sans genre » n'aiderait personne a trouver de la
  // musique.
  const genresDisponibles = useMemo(() => {
    const compte = new Map();
    for (const musique of musiques) {
      if (!musique.genre) continue;
      compte.set(musique.genre, (compte.get(musique.genre) ?? 0) + 1);
    }
    return [...compte]
      .sort((a, b) => b[1] - a[1])
      .map(([genre, nombre]) => ({ genre, nombre }));
  }, [musiques]);

  let musiquesFiltre = musiques.filter((musique) => {
    const correspondTexte =
      musique.title.toLowerCase().includes(valueInput.toLowerCase()) ||
      musique.artist.toLowerCase().includes(valueInput.toLowerCase());

    // Les deux filtres se CUMULENT : chercher "love" dans le genre Pop ne doit pas rendre les
    // "love" du rock. Un filtre qui s'annule au premier caractere tape n'en est pas un.
    const correspondGenre = genreFiltre === null || musique.genre === genreFiltre;

    return correspondTexte && correspondGenre;
  });

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

  return (
    // `minmax(0,1fr)` et non `1fr` : en CSS Grid, `1fr` vaut `minmax(auto, 1fr)`, et ce `auto`
    // interdit a la ligne de descendre sous la taille de son contenu. Resultat : une longue
    // liste de playlists faisait grandir l'Aside, donc la grille, donc toute l'app au-dela de
    // l'ecran — et l'`overflow-y-auto` de la liste ne s'activait jamais, faute de contrainte.
    //
    // La DEUXIEME ligne (104px) est la hauteur du lecteur. Elle est fixe : son contenu ne peut
    // donc pas la faire grandir, il DEBORDE. Elle valait 88px, taille au pixel pres du contenu
    // d'alors — y ajouter la ligne d'attribution (« CC BY-SA 3.0 · original », que la licence
    // EXIGE) l'a fait deborder de 11 px : la barre de progression sortait sous la carte, posee
    // sur le fond de la page. Ni une capture d'ecran ni le test « l'app tient dans l'ecran » ne
    // l'ont vu — le debordement restait DANS la fenetre, il ne sortait que du panneau.
    //
    // Si le contenu du lecteur grandit encore, c'est CE NOMBRE qu'il faut revoir, pas
    // l'attribution. Le test e2e « le contenu ne deborde pas de la carte » le dira.
    <section className="box-border h-screen overflow-hidden flex flex-col bg-background md:grid md:grid-cols-[260px_1fr] md:grid-rows-[minmax(0,1fr)_104px] md:gap-3 md:p-3">
      <div className="md:hidden">
        <HeaderMobile user={user} isPlaying={isPlaying} />
      </div>
      <Aside
        className="hidden md:flex md:row-start-1 md:col-start-1"
        user={user}
        playlists={playlists}
        setPlaylists={setPlaylists}
        isPlaying={isPlaying}
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
                  top5={top5}
                  user={user}
                  setCurrentMusic={setCurrentMusic}
                  setCurrentQueue={setCurrentQueue}
                  musiquesLikee={musiquesLikee}
                  setMusiquesLikee={setMusiquesLikee}
                  setUser={setUser}
                  token={token}
                  setToken={setToken}
                  currentMusic={currentMusic}
                  genresDisponibles={genresDisponibles}
                  setGenreFiltre={setGenreFiltre}
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
                  genresDisponibles={genresDisponibles}
                  genreFiltre={genreFiltre}
                  setGenreFiltre={setGenreFiltre}
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
            <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
            <Route
              path="/reinitialiser-mot-de-passe"
              element={<ReinitialiserMotDePasse />}
            />
            <Route path="/deposer" element={<Deposer user={user} />} />
            <Route path="/mes-depots" element={<MesDepots user={user} />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute user={user}>
                  <AdminDashboard user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/utilisateurs"
              element={
                <ProtectedRoute user={user}>
                  <AdminUtilisateurs user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/musiques"
              element={
                <ProtectedRoute user={user}>
                  <AdminMusiques user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/depots"
              element={
                <ProtectedRoute user={user}>
                  <AdminDepots user={user} />
                </ProtectedRoute>
              }
            />
            <Route path="/a-propos" element={<Apropos />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />

            <Route
              path="/playlists"
              element={
                <Playlists
                  playlists={playlists}
                  setPlaylists={setPlaylists}
                  user={user}
                />
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
        onEcouteComptee={chargerTop5}
        currentIndex={currentIndex}
        queue={currentQueue}
        setCurrentMusic={setCurrentMusic}
        setCurrentIndex={setCurrentIndex}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
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
