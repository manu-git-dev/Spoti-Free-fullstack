import ListesCard from "../../composants/ListesCard";

export default function Home({ musiques, onSelectMusique, onClickIndex }) {
  return (
    <section>
      <div>
        <p className="flex m-4 text-2xl">
          Bienvenue Utilisateur
        </p>
      </div>
      <section className="flex">
        <ListesCard musiques={musiques} onSelectMusique={onSelectMusique} />
      </section>
    </section>
  );
}
