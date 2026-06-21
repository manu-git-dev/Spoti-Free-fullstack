import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <button className="btn btn-success mx-2" onClick={handleDeconnexion}>
      Deconnexion
    </button>
  );
}
