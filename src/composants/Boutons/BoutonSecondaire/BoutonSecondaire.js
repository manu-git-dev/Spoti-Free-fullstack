import styles from "./BoutonSecondaire.module.css"

export default function BoutonSecondaire ({ texte, type = "button"}) {
    return (
        <button type={type} className={styles["bouton-secondaire"]}>
           <span>{texte}</span> 
        </button>
    );
}