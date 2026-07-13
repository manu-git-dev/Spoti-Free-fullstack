import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function Deconnexion({
  user,
  setUser,
  token,
  setToken,
  setMessageDeconnexion,
}) {
  const navigate = useNavigate();

  function handleDeconnexion() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setMessageDeconnexion("Déconnexion réussie");
    setTimeout(() => {
      setMessageDeconnexion("");
    }, 1500);
    navigate("/");
  }
  return (
    <button
      className="btn btn-outline btn-error rounded-full gap-2"
      onClick={handleDeconnexion}
    >
      <LogOut className="w-4 h-4" />
      Se déconnecter
    </button>
  );
}
