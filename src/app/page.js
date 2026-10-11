import styles from "./page.module.css";
import { Container } from "react-bootstrap";

export default function Home() {
  return (
    <>
      <Container className={styles["container-page-accueil"]}></Container>
    </>
  );
}
