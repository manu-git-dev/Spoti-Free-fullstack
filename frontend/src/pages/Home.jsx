import { Link } from "react-router-dom";
import Deconnexion from "../composants/Deconnexion";
import TrackRow from "../composants/TrackRow";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home({
  musiques,
  setCurrentMusic,
  setCurrentQueue,
  user,
  messageDeconnexion,
  musiquesLikee,
  setMusiquesLikee,
  setUser,
  token,
  setToken,
  setMessageDeconnexion,
  currentMusic,
}) {
  const topCinq = musiques.slice(0, 5);

  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      {messageDeconnexion ? (
        <Alert variant="success" className="mb-4">
          <AlertDescription>{messageDeconnexion}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">
            {user === null ? "Bonjour" : `Bonjour ${user.pseudo}`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prêt à écouter quelque chose ?
          </p>
        </div>

        {user === null ? (
          <div className="flex items-center justify-end gap-4 shrink-0">
            <Link
              to={"/inscription"}
              className="text-primary underline-offset-4 hover:underline"
            >
              S'inscrire
            </Link>
            <Button
              nativeButton={false}
              render={<Link to={"/connexion"} />}
              className="rounded-full px-6"
            >
              Connexion
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 shrink-0">
            <Deconnexion
              user={user}
              setUser={setUser}
              token={token}
              setToken={setToken}
              setMessageDeconnexion={setMessageDeconnexion}
            />
            <Link
              to={"/profil"}
              className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white ring-2 ring-primary/30 hover:ring-primary transition"
            >
              {user.pseudo?.charAt(0).toUpperCase()}
            </Link>
          </div>
        )}
      </div>

      <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
        <span className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-accent" />
        Top 5 des titres les plus écoutés
      </h2>
      <div className="flex flex-col gap-1">
        {topCinq.map((musique, index) => (
          <TrackRow
            key={musique.id_music}
            musique={musique}
            index={index}
            setCurrentMusic={setCurrentMusic}
            setCurrentQueue={setCurrentQueue}
            queue={topCinq}
            musiquesLikee={musiquesLikee}
            setMusiquesLikee={setMusiquesLikee}
            user={user}
            currentMusic={currentMusic}
          />
        ))}
      </div>
    </section>
  );
}
