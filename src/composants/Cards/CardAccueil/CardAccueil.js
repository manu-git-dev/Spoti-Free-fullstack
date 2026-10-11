import styles from "./CardAccueil.module.css"
import BoutonCardAccueil from "@/composants/Boutons/BoutonCardAccueil/BoutonCardAccueil";

export default function CardAccueil ({titre, paragraphe, urlImage}){

    return (
        <section className={styles["card-accueil"]}>
            <img className={styles["image-card-accueil"]} src={urlImage}/>
            <div className={styles["partie-droite-card"]}>
                    <h3>{titre}</h3>
                    <p>{paragraphe}</p>
                <BoutonCardAccueil texte = "Voir nos leurres"/>
            </div>
        </section>
    )
}

