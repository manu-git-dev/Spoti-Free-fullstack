import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ListMusic } from "lucide-react";
import TrackRow from "../composants/TrackRow";
import Page from "../composants/Page";
import { apiFetch } from "@/lib/api";
export default function MusicsInPlaylist({
  setCurrentMusic,
  setCurrentQueue,
  setMusiquesLikee,
  musiquesLikee,
  user,
  currentMusic,
}) {
  const [musicsPlaylist, setMusicsPlaylist] = useState([]);
  const { idPlaylist } = useParams();

  // Depend de `idPlaylist` : en passant d'une playlist a une autre, React Router reutilise
  // le meme composant (pas de remontage). Avec `[]`, l'effet ne se relancait pas et la page
  // continuait d'afficher le contenu de la playlist precedente.
  useEffect(() => {
    apiFetch(`/api/playlists/musics/${idPlaylist}`)
      .then(({ donnees }) => {
        setMusicsPlaylist(Array.isArray(donnees) ? donnees : []);
      })
      .catch((error) => console.error(error));
  }, [idPlaylist]);

  return (
    <Page
      icone={ListMusic}
      titre="Contenu de votre playlist"
      sousTitre={`${musicsPlaylist.length} ${
        musicsPlaylist.length > 1 ? "titres" : "titre"
      }`}
    >
      <div className="flex flex-col gap-1">
        {musicsPlaylist.length === 0 ? (
          <p className="text-muted-foreground">
            Aucune musique dans cette playlist
          </p>
        ) : (
          musicsPlaylist.map((playlistMusic, index) => (
            <TrackRow
              key={playlistMusic.id_music}
              musique={playlistMusic}
              index={index}
              setMusiquesLikee={setMusiquesLikee}
              setCurrentMusic={setCurrentMusic}
              setCurrentQueue={setCurrentQueue}
              queue={musicsPlaylist}
              idPlaylist={idPlaylist}
              setMusicsPlaylist={setMusicsPlaylist}
              musiquesLikee={musiquesLikee}
              user={user}
              currentMusic={currentMusic}
            />
          ))
        )}
      </div>
    </Page>
  );
}
