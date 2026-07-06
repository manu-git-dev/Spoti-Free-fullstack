import { Link } from "react-router-dom";
import Deconnexion from "../composants/Deconnexion";
import ListesCard from "../composants/ListesCard";

export default function Home({
  musiques,
  setCurrentMusic,
  user,
  messageDeconnexion,
  musiquesLikee,
  setMusiquesLikee,
  setUser,
  token,
  setToken,
  setMessageDeconnexion,
}) {
  const topCinq = musiques.slice(0, 5);

  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      {messageDeconnexion ? (
        <div role="alert" className="alert alert-success mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{messageDeconnexion}</span>
        </div>
      ) : null}
      {user === null ? (
        <div>
          <Link to={"/inscription"}>
            <button className="btn btn-success mx-2">INSCRIPTION</button>
          </Link>
          <Link to={"/connexion"}>
            <button className="btn btn-primary">CONNEXION</button>
          </Link>
        </div>
      ) : (
        <Deconnexion
          user={user}
          setUser={setUser}
          token={token}
          setToken={setToken}
          setMessageDeconnexion={setMessageDeconnexion}
        />
      )}

      <p className="text-2xl font-serif mb-6">
        {user === null ? "Bonjour" : `Bonjour ${user.pseudo}`}
      </p>

      <h2 className="text-lg font-semibold mb-4">
        Top 5 des titres les plus écoutés
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <ListesCard
          musiques={topCinq}
          setCurrentMusic={setCurrentMusic}
          musiquesLikee={musiquesLikee}
          setMusiquesLikee={setMusiquesLikee}
        />
      </div>
    </section>
  );
}
