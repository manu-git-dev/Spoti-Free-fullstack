import BoutonPrincipal from "@/composants/Boutons/BoutonPrincipal";
import BoutonSecondaire from "@/composants/Boutons/BoutonSecondaire";
import styles from "./page.module.css";
import BoutonCardAccueil from "@/composants/Boutons/BoutonCardAccueil";
import CardArticle from "@/composants/Cards/CardArticle";

export default function Home() {
  return (
    <>
      <header></header>
      <main className={styles.main}>
        <BoutonPrincipal texte="Ajouter au panier" />
        <BoutonPrincipal texte="Indisponible" etat="indisponible" />
        <BoutonSecondaire texte="Poursuivre mes achats" />
        <BoutonCardAccueil texte="Voir nos leurres souples" />
        <CardArticle />
      </main>
    </>
  );
}
