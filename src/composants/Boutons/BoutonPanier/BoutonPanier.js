import styles from "./BoutonPanier.module.css"

export default function BoutonPanier ({}) {
    return (
        <button type="button" className={styles["bouton-panier"]}>
            <img src="/icons/icon-panier.png"/>
            <span>Panier</span>
        </button>
    );
}