import BoutonPrincipal from "../Boutons/BoutonPrincipal";
import styles from "./CardArticle.module.css";

export default function CardArticle () {
    return (
        <article className={styles["card-article"]}>
            <p className={styles["reduction-article"]}>-10%</p>
            <p className={styles["rupture-de-stock"]}>Rupture de stock</p>
            <img src="/images/Image-Produit.png" className={styles["image-article"]}/>
            <p className={styles["categorie-article"]}>Poissons Nageurs</p>
            <p className={styles["nom-article"]}>Hardcore Minnow</p>
            <p className={styles["avis-article"]}>Aucun Avis</p>
            <div className={styles["bloc-prix"]}>
                <p className={styles["prix-article-avant-reduction"]}>6,90€</p>
                <p className={styles["prix-article-apres-reduction"]}>6,21€</p>
            </div>
            <p className={styles["stock-article"]}>Plus que 2 exemplaires en stock</p>
            <BoutonPrincipal/>
        </article>
    );
}