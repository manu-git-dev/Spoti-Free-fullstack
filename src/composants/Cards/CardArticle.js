import BoutonPrincipal from "../Boutons/BoutonPrincipal";
import styles from "./CardArticle.module.css";
import Image from "next/image";

export default function CardArticle() {
  return (
    <article className={styles["card-article"]}>
      <span className={styles["reduction-article"]}>-10%</span>
      <p className={styles["rupture-de-stock"]}>Rupture de stock</p>
      <Image
        src="/images/Image-Produit.png"
        alt="Leurre poisson nageur Hardcore Minnow"
        width={300}
        height={300}
        className={styles["image-article"]}
      />
      <p className={styles["categorie-article"]}>Poissons Nageurs</p>
      <h3 className={styles["nom-article"]}>Hardcore Minnow</h3>
      <p className={styles["avis-article"]}>Aucun Avis</p>
      <div className={styles["bloc-prix"]}>
        <s className={styles["prix-article-avant-reduction"]}>6,90€</s>
        <span className={styles["prix-article-apres-reduction"]}>6,21€</span>
      </div>
      <p className={styles["stock-article"]}>Plus que 2 exemplaires en stock</p>
      <BoutonPrincipal />
    </article>
  );
}
