import { Container } from "react-bootstrap";
import BoutonPanier from "@/composants/Boutons/BoutonPanier/BoutonPanier";
import Logo from "@/composants/Logo/Logo";
import MenuEspaceClient from "@/composants/Menus/MenuEspaceClient/MenuEspaceClient";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <>
      <header className={styles["header"]}>
        <Container className={styles["container-header"]}>
          <Logo />
          <nav className={styles["nav-header"]}>
            <a>Accueil</a>
            <a>Catalogue</a>
            <a>A propos</a>
          </nav>
          <div className={styles["bloc-espace-client-panier"]}>
            <MenuEspaceClient />
            <BoutonPanier />
          </div>
        </Container>
      </header>
    </>
  );
}
