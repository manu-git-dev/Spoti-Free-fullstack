import { Link } from "react-router-dom";

export default function Header() {
  return (
    <>
      <div>
        <Link to={"/"}>
          <h1 className="text-6xl text-blue-700 font-extrabold ml-2">Spoti-Free</h1>
        </Link>
      </div>
      <div>
        <input
          type="text"
          name="recherche"
          id=""
          placeholder="Recherchez un titre ou un artiste"
          className="input rounded-2xl w-3xl h-12 placeholder:text-xl text-white"
        />
      </div>
      <div>
        <Link to={"/inscription"}>
          <button className="btn btn-success mx-2">INSCRIPTION</button>
        </Link>
        <Link to={"/connexion"}>
          <button className="btn btn-primary">CONNEXION</button>
        </Link>
      </div>
    </>
  );
}
