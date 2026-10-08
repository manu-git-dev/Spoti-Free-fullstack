import styles from "./BoutonCardAccueil.module.css";

export default function BoutonCardAccueil({ texte, type = "button" }) {
  return (
    <>
      <button type={type} className={styles["bouton-card-accueil"]}>
        {texte}
        <img src="/icons/fleche-haut.png"/>
      </button>
      
    </>
  );
}
