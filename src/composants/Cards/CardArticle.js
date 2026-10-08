import BoutonPrincipal from "../Boutons/BoutonPrincipal";
import styles from "./CardArticle.module.css";

export default function CardArticle () {
    return (
        <article className={styles["card-article"]}>
            <p className={styles["reduction-article"]}>-20%</p>
            <p className={styles["rupture-de-stock"]}>Rupture de stock</p>
            <img src="/images/Image-Produit.png" className={styles["image-article"]}/>
            <p className={styles["categorie-article"]}>Poissons Nageurs</p>
            <p className={styles["nom-article"]}>Hardcore Minnow</p>
            <p className={styles["avis-article"]}>Aucun Avis</p>
            <p className={styles["prix-article"]}>6,90€</p>
            <p className={styles["stock-article"]}>Plus que 2 exemplaires en stock</p>
            <BoutonPrincipal/>
        </article>
    );
}