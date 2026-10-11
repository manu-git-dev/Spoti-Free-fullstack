import { Container } from "react-bootstrap";
import pool from "@/lib/db";
import CardArticle from "@/composants/Cards/CardArticle/CardArticle";

export default async function Catalogue() {

  const [articles] = await pool.query("SELECT id_article, image_article,nom_article,prix_article,promotion_article,caracteristique_article,description_article,stock_article,categoriesarticle.nom_categorie FROM Articles INNER JOIN categoriesarticle ON categoriesarticle.id_categorie=articles.id_categorie");

  return (
    <Container>
      <h1>Catalogue</h1>
        {articles.map((article) => (
          <CardArticle key={article.id_article} article={article}/>
        ))}
    </Container>
  );
}