import BoutonPanier from "../Boutons/BoutonPanier";
import Logo from "../Logo/Logo";
import MenuEspaceClient from "../Menus/MenuEspaceClient";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <>
      <header className={styles["header"]}>
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
      </header>
    </>
  );
}
