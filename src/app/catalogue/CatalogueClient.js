"use client";
import { Form } from "react-bootstrap";
import styles from "./page-catalogue.module.css";
import BoutonPrincipal from "@/composants/Boutons/BoutonPrincipal/BoutonPrincipal";
import { useState } from "react";
import CardArticle from "@/composants/Cards/CardArticle/CardArticle";

export default function CatalogueClient({ articles }) {
  const [inputRecherche, setInputRecherche] = useState("");

  const articlesFiltres = articles.filter((article) =>
    article.nom_article.toLowerCase().includes(inputRecherche.toLowerCase()),
  );

  return (
    <>
      <section className={styles["bloc-input-bouton"]}>
        <h1>Catalogue</h1>
        <div className="row col-12">
          <div className="col-8">
            <Form.Control
              type="search"
              value={inputRecherche}
              onChange={(event) => setInputRecherche(event.target.value)}
              placeholder="Rechercher un article"
            />
          </div>
          <div className="col-4">
            <BoutonPrincipal texte="Rechercher" />
          </div>
        </div>
      </section>
      <div className="row g-3">
        {articlesFiltres.map((article) => (
          <div key={article.id_article} className="col-3">
            <CardArticle article={article} />
          </div>
        ))}
      </div>
    </>
  );
}
