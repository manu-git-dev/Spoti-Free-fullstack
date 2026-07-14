import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import EnTetePage from "../composants/EnTetePage";

export default function Apropos() {
  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <EnTetePage
          icone={Info}
          titre="À propos"
          sousTitre="La musique, libre et gratuite."
        />

        <p className="text-lg leading-relaxed text-muted-foreground">
          Salut, moi c'est{" "}
          <span className="text-primary font-bold">Manuel</span> 👋 Je suis en
          reconversion professionnelle vers le développement web, formé au
          métier de Développeur Web et Web Mobile (DWWM). Après des mois à
          enchaîner exercices, tutoriels et projets perso, j'avais besoin de
          quelque chose de plus ambitieux pour vraiment mettre les mains dans le
          cambouis — c'est comme ça qu'est né Spoti-Free.
        </p>

        <p className="text-lg leading-relaxed text-muted-foreground">
          Ce que j'aime dans le développement, c'est ce moment où un bug
          insaisissable finit par avoir un sens, où toutes les pièces
          s'emboîtent enfin. Spoti-Free m'a fait passer par toutes les étapes
          d'une vraie application : authentification, base de données
          relationnelle, gestion d'état côté front, et une bonne dose de debug
          le soir après le travail.
        </p>

        <div className="bg-card rounded-2xl p-6">
          <h2 className="text-2xl font-serif mb-3 text-primary">
            Le projet Spoti-Free
          </h2>
          <p className="mb-3 text-muted-foreground">
            Un clone de Spotify en full-stack, pensé comme un terrain de jeu
            pour appliquer et consolider mes compétences :
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">Frontend :</span>{" "}
              React, React Router, Tailwind CSS, shadcn/ui
            </li>
            <li>
              <span className="font-semibold text-foreground">Backend :</span>{" "}
              Node.js, Express, authentification JWT
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Base de données :
              </span>{" "}
              MySQL
            </li>
          </ul>
        </div>

        <p className="text-lg leading-relaxed text-muted-foreground">
          Aujourd'hui, je suis activement à la recherche d'un{" "}
          <span className="font-bold text-foreground">
            stage en développement web
          </span>{" "}
          pour continuer à apprendre au contact d'une équipe, sur du code réel
          et des enjeux concrets. Si mon profil ou ce projet vous parle,
          n'hésitez pas à me contacter.
        </p>

        <Link
          to="/contact"
          className={cn(buttonVariants(), "rounded-full w-fit px-6 mt-2")}
        >
          Me contacter
        </Link>
      </div>
    </section>
  );
}
