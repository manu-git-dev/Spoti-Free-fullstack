import { Link } from "react-router-dom";
import Deconnexion from "./Deconnexion";

export default function Header({ user, setUser, token, setToken,setMessageDeconnexion }) {
  return (
    <>
      <div>
        <Link to={"/"}>
          <h1 className="text-6xl text-blue-700 font-extrabold ml-2">
            Spoti-Free
          </h1>
        </Link>
      </div>
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
    </>
  );
}
