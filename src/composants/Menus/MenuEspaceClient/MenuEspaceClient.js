"use client"
import { Dropdown } from "react-bootstrap"
import styles from "./MenuEspaceClient.module.css"
import BoutonPrincipal from "@/composants/Boutons/BoutonPrincipal/BoutonPrincipal";
import BoutonSecondaire from "@/composants/Boutons/BoutonSecondaire/BoutonSecondaire";
import Link from "next/link";

export default function MenuEspaceClient() {
  return (
    <Dropdown>
      <Dropdown.Toggle variant="" id="dropdown-basic"  >
        Espace Client
      </Dropdown.Toggle>

      <Dropdown.Menu className={styles["espace-client-menu"]}>
        <Link href="connexion">
        <BoutonPrincipal texte="Connexion"/>
        </Link>
        <BoutonSecondaire texte={"S'inscrire"}/>
      </Dropdown.Menu>
    </Dropdown>
  );
}