import { Container } from "react-bootstrap";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles["footer"]}>
      <Container className={styles["container-footer"]}>
        <img src="/icons/icon-livraison.png" />
        <span>Livraison offerte dès 50 € d'achat // Aucun réel achat</span>
      </Container>
    </footer>
  );
}
