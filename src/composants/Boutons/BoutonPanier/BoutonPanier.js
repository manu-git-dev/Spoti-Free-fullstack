"use client"
import { Dropdown } from "react-bootstrap";
import styles from "./BoutonPanier.module.css";
import LignesPanier from "./ArticlesPanier";
import LignesPrixPanier from "./LignesPrixPanier";
import { usePanier } from "@/context/PanierContext";



export default function BoutonPanier({}) {
    const {panier} = usePanier();
  return (
    <>
      <Dropdown>
        <Dropdown.Toggle variant="" className={styles["bouton-panier"]}>
            <img src="/icons/icon-panier.png" alt="test"/>
            <span>Panier</span>
        </Dropdown.Toggle>
        <Dropdown.Menu className={styles["espace-client-menu"]}>
            {panier.length === 0 ? <span>Votre panier est vide</span> : <span>pas vide</span>}
            <LignesPanier/>
            <LignesPrixPanier/>
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
}
