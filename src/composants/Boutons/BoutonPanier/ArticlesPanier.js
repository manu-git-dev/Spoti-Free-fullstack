import Image from "next/image";
import styles from "./ArticlesPanier.module.css";
import BoutonPrincipal from "../BoutonPrincipal/BoutonPrincipal";

export default function LignesPanier() {
  return (
    <>
      <div className={styles["lignes-panier"]}>
        <Image src={"/images/produits/bobine-fil.png"} width={50} height={50} />
        <span className={styles["nom-article"]}>Nylon Transparent</span>
        <span className={styles["prix-article"]}>6,90 €</span>
        <button className={styles["boutons"]}>
          <Image
            src={"/icons/minus.png"}
            width={20}
            height={20}
            alt="icon moins"
          />
        </button>
        <span className={styles["quantite-article"]}>1</span>
        <button className={styles["boutons"]}>
          <Image
            src={"/icons/add.png"}
            width={20}
            height={20}
            alt="icon moins"
          />
        </button>
        <button className={styles["bouton-suppr"]}>
          <Image
            src={"/icons/corbeille.png"}
            width={35}
            height={35}
            alt="icon moins"
          />
        </button>
      </div>
      {/* <span>Votre panier est vide.</span> */}
    </>
  );
}
