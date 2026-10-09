import styles from "./CardAccueil.module.css"
import BoutonCardAccueil from "../Boutons/BoutonCardAccueil";

export default function CardAccueil ({}){

    return (
        <section className={styles["card-accueil"]}>
            <img className={styles["image-card-accueil"]} src="/images/Image-Produit.png"/>
            <div className={styles["partie-droite-card"]}>
                    <h3>Envie d'un nouveau leurre ?</h3>
                    <p>Venez découvrir les modèles Poiss'Caille</p>
                <BoutonCardAccueil texte = "Voir nos leurres"/>
            </div>
        </section>
    )
}