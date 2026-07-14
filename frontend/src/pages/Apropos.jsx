import { Link } from "react-router-dom";
import { Info, Code2, Mail, Play, NotebookPen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import EnTetePage from "../composants/EnTetePage";

const DEPOT = "https://github.com/manu-git-dev/Spoti-Free-fullstack";

function Titre({ children }) {
  return (
    <h2 className="text-2xl font-serif font-bold text-primary">{children}</h2>
  );
}

// Met en valeur sans crier : gras + encre normale, sur un fond attenue.
function Fort({ children }) {
  return <span className="font-semibold text-foreground">{children}</span>;
}

export default function Apropos() {
  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <EnTetePage
          icone={Info}
          titre="À propos"
          sousTitre="Un lecteur de musique, et dix ans de mécanique aéronautique derrière."
        />

        <p className="text-lg leading-relaxed text-muted-foreground">
          Salut, moi c'est{" "}
          <span className="text-primary font-bold">Manuel</span> 👋 Pendant dix
          ans, j'ai été <Fort>mécanicien aéronautique dans l'armée</Fort> : un
          métier où on ne bricole pas, où l'on suit des procédures, où l'on
          diagnostique — et où une erreur ne pardonne pas. J'y ai appris la
          rigueur. Mais au bout de dix ans, la routine avait pris toute la
          place. J'ai décidé de repartir de zéro, et je suis aujourd'hui en
          formation <Fort>Développeur Web et Web Mobile&nbsp;(DWWM)</Fort>.
        </p>

        <div className="flex flex-col gap-3">
          <Titre>D'où vient Spoti-Free</Titre>
          <p className="leading-relaxed text-muted-foreground">
            En tout début de formation, notre formateur nous a mis au défi de
            reproduire un lecteur audio dans l'esprit de Spotify. Le projet ne
            m'a plus quitté. Je sais qu'il existe des dizaines de clones de
            Spotify : ce n'était pas le sujet. Le sujet, c'était de prendre ce
            que j'apprenais en cours et de le{" "}
            <Fort>transformer en quelque chose qui marche vraiment</Fort> — pas
            un exercice, une application. Avec de vrais comptes, une vraie base
            de données, et de vrais problèmes à régler quand ça casse.
          </p>
        </div>

        {/* Le passage le plus important de la page : il est donc place tot, et encadre. Si un
            recruteur ne lit qu'une seule chose, c'est celle-ci qu'il doit lire. */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-6">
          <Titre>Comprendre, pas seulement faire marcher</Titre>
          <p className="leading-relaxed text-muted-foreground">
            Autant être honnête : avec les outils d'IA d'aujourd'hui, une erreur
            trouve rarement plus de quelques minutes de résistance. J'ai
            d'ailleurs travaillé avec un assistant IA sur certaines parties de
            ce projet — notamment une passe d'audit et de durcissement de la
            sécurité.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            La vraie difficulté est ailleurs, et elle est bien plus intéressante
            : <Fort>comprendre ce qui se passe réellement derrière</Fort>.
            Pourquoi ce <code className="text-primary">useEffect</code> se
            relance-t-il ? Pourquoi <code className="text-primary">fetch</code>{" "}
            plutôt qu'<code className="text-primary">axios</code> ? Pourquoi cet
            état doit-il remonter chez le parent pour être partagé entre deux
            composants&nbsp;?
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Obtenir du code qui fonctionne, c'est facile.{" "}
            <Fort>Savoir pourquoi il fonctionne, c'est le métier.</Fort> Ma
            règle sur ce projet : ne jamais laisser passer une ligne que je ne
            saurais pas réexpliquer.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Ce n'est pas qu'une intention. À chaque difficulté rencontrée, j'ai
            écrit une note : le problème, la cause, et le raisonnement qui m'a
            mené à la solution. Elles sont versionnées avec le code —{" "}
            <Fort>une cinquantaine à ce jour</Fort>.
          </p>
          <a
            href={`${DEPOT}/blob/main/NOTES-APPRENTISSAGE.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start text-primary hover:underline underline-offset-4"
          >
            <NotebookPen className="w-4 h-4 shrink-0" />
            Lire mon journal d'apprentissage
          </a>
        </div>

        <div className="flex flex-col gap-3">
          <Titre>Ce que contient l'application</Titre>
          <ul className="flex flex-col gap-2 text-muted-foreground">
            <li>
              <Fort>Frontend :</Fort> React, React Router, Tailwind CSS,
              shadcn/ui
            </li>
            <li>
              <Fort>Backend :</Fort> Node.js, Express, authentification JWT,
              mots de passe hachés (bcrypt)
            </li>
            <li>
              <Fort>Base de données :</Fort> MySQL
            </li>
            <li>
              <Fort>Fonctionnalités :</Fort> lecteur avec file d'attente,
              playlists, favoris, classement des titres les plus écoutés, dépôt
              de musique par les utilisateurs avec modération, et un espace
              d'administration complet
            </li>
            <li>
              <Fort>Qualité :</Fort> plus de 100 tests automatisés, dont une
              suite de sécurité qui attaque l'API comme le ferait un attaquant
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Titre>Et maintenant</Titre>
          <p className="leading-relaxed text-muted-foreground">
            Je suis{" "}
            <Fort>ouvert à toute opportunité dans le développement web</Fort>.
            Continuer à me former en <Fort>alternance</Fort> m'intéresse autant
            qu'un poste où je pourrai apprendre au contact d'une équipe, sur du
            code réel.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            L'application est fonctionnelle : essayez-la. Le code est ouvert à
            qui veut le lire. Et si vous avez une question, une remarque ou une
            idée pour l'améliorer, écrivez-moi — les critiques sont les
            bienvenues, c'est comme ça qu'on progresse.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/bibliotheque"
            className={cn(buttonVariants(), "rounded-full px-6")}
          >
            <Play className="w-4 h-4" />
            Tester l'app
          </Link>
          <a
            href={DEPOT}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full px-6",
            )}
          >
            <Code2 className="w-4 h-4" />
            Voir le code
          </a>
          <Link
            to="/contact"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full px-6",
            )}
          >
            <Mail className="w-4 h-4" />
            Me contacter
          </Link>
        </div>
      </div>
    </section>
  );
}
