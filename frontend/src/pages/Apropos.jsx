import { Link } from "react-router-dom";

export default function Apropos() {
  return (
    <section className="h-full overflow-y-auto p-8 text-white">
      <h1 className="text-5xl font-extrabold mb-8">À propos</h1>

      <div className="max-w-3xl flex flex-col gap-6 text-lg leading-relaxed">
        <p>
          Salut, moi c'est <span className="text-blue-500 font-bold">Manuel</span> 👋
          Je suis en reconversion professionnelle vers le développement web,
          formé au métier de Développeur Web et Web Mobile (DWWM). Après des
          mois à enchaîner exercices, tutoriels et projets perso, j'avais
          besoin de quelque chose de plus ambitieux pour vraiment mettre les
          mains dans le cambouis — c'est comme ça qu'est né Spoti-Free.
        </p>

        <p>
          Ce que j'aime dans le développement, c'est ce moment où un bug
          insaisissable finit par avoir un sens, où toutes les pièces
          s'emboîtent enfin. Spoti-Free m'a fait passer par toutes les
          étapes d'une vraie application : authentification, base de
          données relationnelle, gestion d'état côté front, et une bonne
          dose de debug le soir après le travail.
        </p>

        <div className="bg-zinc-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-3 text-blue-500">
            Le projet Spoti-Free
          </h2>
          <p className="mb-3">
            Un clone de Spotify en full-stack, pensé comme un terrain de jeu
            pour appliquer et consolider mes compétences :
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-200">
            <li>
              <span className="font-semibold">Frontend :</span> React, React
              Router, Tailwind CSS, daisyUI
            </li>
            <li>
              <span className="font-semibold">Backend :</span> Node.js,
              Express, authentification JWT
            </li>
            <li>
              <span className="font-semibold">Base de données :</span> MySQL
            </li>
          </ul>
        </div>

        <p>
          Aujourd'hui, je suis activement à la recherche d'un{" "}
          <span className="font-bold">stage en développement web</span> pour
          continuer à apprendre au contact d'une équipe, sur du code réel et
          des enjeux concrets. Si mon profil ou ce projet vous parle,
          n'hésitez pas à me contacter.
        </p>

        <Link to="/contact" className="btn btn-primary w-fit mt-2">
          Me contacter
        </Link>
      </div>
    </section>
  );
}
