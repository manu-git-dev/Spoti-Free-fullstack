import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User as UserIcon } from "lucide-react";
import Deconnexion from "../composants/Deconnexion";

export default function Profil({
  user,
  messageDeconnexion,
  musiquesLikee,
  setUser,
  token,
  setToken,
  setMessageDeconnexion,
  playlists,
}) {
  const [infoUser, setInfoUser] = useState({});
 
  useEffect(() => {
    const url = `http://localhost:3000/api/users/profil`;
    if (!token){
        return;
    }
    fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setInfoUser(data);
      })
      .catch((error) => console.error(error));
  }, [token]);
if (user === null ){
    return (
      <section className="h-full overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
          <UserIcon className="w-7 h-7 text-base-content/40" />
        </div>
        <div>
          <p className="text-xl font-serif font-bold mb-1">
            Connecte-toi pour voir ton profil
          </p>
          <p className="text-sm text-base-content/60">
            Retrouve tes playlists, tes favoris et tes infos de compte.
          </p>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <Link to={"/inscription"} className="link">
            S'inscrire
          </Link>
          <Link to={"/connexion"}>
            <button className="btn btn-primary rounded-full px-6">
              Connexion
            </button>
          </Link>
        </div>
      </section>
    )
} else {
  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex flex-col items-center text-center gap-3 md:flex-row md:text-left md:items-center md:gap-6 md:bg-base-200 md:rounded-2xl md:p-6">
          <div className="w-18 h-18 shrink-0 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-white">
            {infoUser.pseudo?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-xl font-serif font-bold">
              {infoUser.first_name?.charAt(0).toUpperCase()}
              {infoUser.first_name?.slice(1).toLowerCase()}{" "}
              <span className="uppercase">{infoUser.last_name}</span>
            </p>
            <p className="text-sm text-base-content/70">{infoUser.pseudo}</p>
            <p className="text-sm text-base-content/60">{infoUser.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 bg-base-200 rounded-xl px-2 py-4">
          <div className="flex flex-col items-center gap-1">
            <p className="text-lg font-bold text-accent">{playlists.length}</p>
            <p className="text-xs text-base-content/50">playlists</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-lg font-bold text-accent">
              {musiquesLikee.length}
            </p>
            <p className="text-xs text-base-content/50">favoris</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-lg font-bold text-accent">
              {infoUser.created_at
                ? new Date(infoUser.created_at).toLocaleDateString("fr-FR", {
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </p>
            <p className="text-xs text-base-content/50">membre depuis</p>
          </div>
        </div>

        <div className="flex justify-center">
          <Deconnexion
            user={user}
            setUser={setUser}
            token={token}
            setToken={setToken}
            setMessageDeconnexion={setMessageDeconnexion}
          />
        </div>
      </div>
    </section>
  )};
}
