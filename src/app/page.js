import BoutonPrincipal from "@/composants/Boutons/BoutonPrincipal";
import BoutonSecondaire from "@/composants/Boutons/BoutonSecondaire";
import styles from "./page.module.css";
import BoutonCardAccueil from "@/composants/Boutons/BoutonCardAccueil";
import CardArticle from "@/composants/Cards/CardArticle";
import CardAccueil from "@/composants/Cards/CardAccueil";
import BoutonPanier from "@/composants/Boutons/BoutonPanier";
import Logo from "@/composants/Logo/Logo";
import Header from "@/composants/Layout/Header";
import Footer from "@/composants/Layout/Footer";

export default function Home() {
  return (
    <>

        <BoutonPrincipal texte="Ajouter au panier" />
        <BoutonPrincipal texte="Indisponible" etat="indisponible" />
        <BoutonSecondaire texte="Poursuivre mes achats" />
        <BoutonCardAccueil texte="Voir nos leurres souples" />
        <CardArticle/>
        <CardAccueil/>
        <BoutonPanier/>
        <Logo/>

    </>
  );
}
