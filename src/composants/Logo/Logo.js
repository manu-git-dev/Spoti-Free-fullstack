import styles from "./Logo.module.css"

export default function Logo({}) {
  return (
    <>
    <div className={styles["bloc-logo"]}>
      <img className={styles["image-logo"]} src="/images/logo.png" />
      <p className={styles["texte-logo"]}>Poiss'Caille</p>
    </div>
    </>
  );
}
