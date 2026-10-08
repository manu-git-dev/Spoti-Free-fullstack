import styles from "./BoutonPrincipal.module.css";

export default function BoutonPrincipal ({ texte = "Ajouter au panier", type = "button", etat="normal"}) {
    return (
        <button type={type} className={etat==="normal" ? styles["bouton-principal"] : styles["bouton-principal-desactive"]} disabled={etat !== "normal"}>
            {texte}
        </button>
    );
}