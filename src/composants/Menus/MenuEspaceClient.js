"use client"
import { Dropdown } from "react-bootstrap"
import styles from "./MenuEspaceClient.module.css"
import BoutonPrincipal from "../Boutons/BoutonPrincipal";
import BoutonSecondaire from "../Boutons/BoutonSecondaire";

export default function MenuEspaceClient() {
  return (
    <Dropdown>
      <Dropdown.Toggle variant="" id="dropdown-basic">
        Espace Client
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <BoutonPrincipal texte="Connexion"/>
        <BoutonSecondaire texte={"S'inscrire"}/>
      </Dropdown.Menu>
    </Dropdown>
  );
}