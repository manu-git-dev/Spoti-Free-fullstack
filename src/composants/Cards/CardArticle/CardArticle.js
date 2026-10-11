import BoutonPrincipal from "@/composants/Boutons/BoutonPrincipal/BoutonPrincipal";
import styles from "./CardArticle.module.css";
import Image from "next/image";

export default function CardArticle({ article }) {
  const prixPromo =
    article.prix_article -
    (article.prix_article * article.promotion_article) / 100;

  return (
    <article className={styles["card-article"]}>
      {article.promotion_article > 0 ? (
        <span className={styles["reduction-article"]}>
          -{article.promotion_article}%
        </span>
      ) : null}
      {article.stock_article === 0 ? (
        <p className={styles["rupture-de-stock"]}>Rupture de stock</p>
      ) : null}

      <Image
        src={article.image_article}
        alt={article.nom_article}
        width={300}
        height={300}
        className={styles["image-article"]}
      />
      <p className={styles["categorie-article"]}>{article.nom_categorie}</p>
      <h3 className={styles["nom-article"]}>{article.nom_article}</h3>
      <p className={styles["avis-article"]}>Aucun Avis</p>
      <div className={styles["bloc-prix"]}>
        {article.promotion_article === 0 ? (
          <span className={styles["prix-article-apres-reduction"]}>
            {article.prix_article} €
          </span>
        ) : (
          <>
            <s className={styles["prix-article-avant-reduction"]}>
              {article.prix_article} €
            </s>{" "}
            <span className={styles["prix-article-apres-reduction"]}>
              {prixPromo.toFixed(2)} €
            </span>
          </>
        )}
      </div>
      {article.stock_article >= 1 && article.stock_article <= 5 ? (
        <p className={styles["stock-article"]}>
          Plus que {article.stock_article} exemplaires en stock
        </p>
      ) : null}
      {article.stock_article === 0 ? <BoutonPrincipal texte="Victime de son succès.." etat="indisponible"/> : <BoutonPrincipal />}
      
    </article>
  );
}
