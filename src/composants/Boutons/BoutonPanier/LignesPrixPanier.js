import BoutonPrincipal from "../BoutonPrincipal/BoutonPrincipal";
import styles from "./LignesPrixPanier.module.css"
export default function LignesPrixPanier() {
  return (
    <>
      <div className={styles["bloc-frais-livraison"]}>
        <div>
          <span> + Frais de livraison : </span>
          <span>9,00 €</span>
        </div>
      </div>
      <div className={styles["bloc-prix-total"]}>
        <div>
          <span>Total à régler : </span>
          <span>15,90 €</span>
        </div>
      </div>
      <div className={styles["div-btn"]}>
        <BoutonPrincipal texte="Valider le panier - 15,90 €" />
      </div>
    </>
  );
}
