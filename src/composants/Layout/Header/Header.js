import { Container } from "react-bootstrap";
import BoutonPanier from "@/composants/Boutons/BoutonPanier/BoutonPanier";
import Logo from "@/composants/Logo/Logo";
import MenuEspaceClient from "@/composants/Menus/MenuEspaceClient/MenuEspaceClient";
import styles from "./Header.module.css";
import Link from "next/link";

export default function Header() {
  return (
    <>
      <header className={styles["header"]}>
        <Container className={styles["container-header"]}>
          <Logo />
          <nav className={styles["nav-header"]}>
            <Link href="/">
            Accueil
            </Link>
            <Link href="/catalogue">
              Catalogue
            </Link>
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
