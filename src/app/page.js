import BoutonPrincipal from "@/composants/Boutons/BoutonPrincipal/BoutonPrincipal";
import styles from "./page.module.css";
import { Container } from "react-bootstrap";
import CardAccueil from "@/composants/Cards/CardAccueil/CardAccueil";

export default function Home() {
  return (
    <>
      <Container className={styles["container-page-accueil"]}>
        <section className={styles["section-page-accueil"]}>
          <div className={styles["bloc-hero-accueil"]}>
            <h1>Bienvenue sur Poiss'Caille, vente d'articles de pêche !</h1>
            <BoutonPrincipal texte="Découvrir le catalogue" />
          </div>
        </section>
        <div className={styles["bloc-cards-accueil"]}>
          <CardAccueil titre = "Pêche au coup ?" paragraphe="Venez découvrir nos cannes à pêche téléscopique" urlImage="\images\produits\canne-telescopique.png" texteBouton="Voir nos cannes téléscopique"/>
          <CardAccueil titre = "Pêche aux leurres ?" paragraphe="Venez découvrir nos leurres souples" urlImage="\images\produits\leurre-souple.png" texteBouton="Voir nos leurres souples"/>
        </div>
      </Container>
    </>
  );
}
