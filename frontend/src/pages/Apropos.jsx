import { Link } from "react-router-dom";
import { Info, Code2, Mail, Play } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import EnTetePage from "../composants/EnTetePage";

// Intitule de section : meme role que les <h2> de la version precedente, mais ecrit une fois.
function Titre({ children }) {
  return (
    <h2 className="text-2xl font-serif font-bold text-primary">{children}</h2>
  );
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
          <span className="text-primary font-bold">Manuel</span> 👋
        </p>

        <p className="text-lg leading-relaxed text-muted-foreground">
          Pendant dix ans, j'ai été{" "}
          <span className="font-semibold text-foreground">
            mécanicien aéronautique dans l'armée
          </span>
          . Un métier où on ne bricole pas : on suit des procédures, on
          diagnostique, et une erreur ne pardonne pas. J'y ai appris la rigueur
          — mais au bout de dix ans, la routine avait pris toute la place. J'ai
          décidé de repartir de zéro, et je suis aujourd'hui en formation{" "}
          <span className="font-semibold text-foreground">
            Développeur Web et Web Mobile (DWWM)
          </span>
          .
        </p>

        <div className="flex flex-col gap-3">
          <Titre>D'où vient Spoti-Free</Titre>
          <p className="leading-relaxed text-muted-foreground">
            En tout début de formation, notre formateur nous a mis au défi de
            reproduire un lecteur audio dans l'esprit de Spotify. Le projet ne
            m'a plus quitté.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Je sais très bien qu'il existe des dizaines de clones de Spotify. Ce
            n'était pas le sujet. Le sujet, c'était de prendre ce que
            j'apprenais en cours et de le{" "}
            <span className="font-semibold text-foreground">
              transformer en quelque chose qui marche vraiment
            </span>{" "}
            — pas un exercice, une application. Avec de vrais comptes, une vraie
            base de données, un vrai lecteur, et de vrais problèmes à régler
            quand ça casse.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Titre>Ce que j'y ai appris</Titre>
          <ul className="flex flex-col gap-2 text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">React</span> —
              c'est là que j'ai le plus progressé. Aujourd'hui, je saurais poser
              les bases d'une application seul.
            </li>
            <li>
              <span className="font-semibold text-foreground">SQL</span> —
              écrire mes requêtes, penser mes tables, et comprendre ce que la
              base me renvoie.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Faire dialoguer le front et le back
              </span>{" "}
              — celui-là, on ne le comprend qu'en le faisant.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                L'authentification, la sécurité, la modération
              </span>{" "}
              — parce qu'une app ouverte au public, ça s'attaque.
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-6">
          <Titre>Le vrai apprentissage</Titre>
          <p className="leading-relaxed text-muted-foreground">
            Je vais être honnête :{" "}
            <span className="font-semibold text-foreground">
              je ne suis jamais resté bloqué très longtemps
            </span>
            . Avec les outils d'IA d'aujourd'hui, une erreur trouve sa réponse
            en quelques minutes. J'ai d'ailleurs travaillé avec un assistant IA
            sur certaines parties du projet — notamment une passe d'audit et de
            durcissement de la sécurité.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            La vraie difficulté est ailleurs, et elle est bien plus intéressante
            :{" "}
            <span className="font-semibold text-foreground">
              comprendre ce qui se passe réellement derrière
            </span>
            . Pourquoi ce <code className="text-primary">useEffect</code> se
            relance-t-il ? Pourquoi <code className="text-primary">fetch</code>{" "}
            plutôt qu'
            <code className="text-primary">axios</code> ? Pourquoi cet état
            doit-il remonter chez le parent pour être partagé entre deux
            composants ?
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Obtenir du code qui fonctionne, c'est facile.{" "}
            <span className="font-semibold text-foreground">
              Savoir pourquoi il fonctionne, c'est le métier.
            </span>{" "}
            C'est ce que j'ai cherché à faire sur ce projet : ne jamais laisser
            passer une ligne que je ne saurais pas réexpliquer.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Titre>Ce que contient l'application</Titre>
          <ul className="flex flex-col gap-2 text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">Frontend :</span>{" "}
              React, React Router, Tailwind CSS, shadcn/ui
            </li>
            <li>
              <span className="font-semibold text-foreground">Backend :</span>{" "}
              Node.js, Express, authentification JWT, mots de passe hachés
              (bcrypt)
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Base de données :
              </span>{" "}
              MySQL
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Fonctionnalités :
              </span>{" "}
              lecteur avec file d'attente, playlists, favoris, classement des
              titres les plus écoutés, dépôt de musique par les utilisateurs
              avec modération, et un espace d'administration complet
            </li>
            <li>
              <span className="font-semibold text-foreground">Qualité :</span>{" "}
              106 tests automatisés, dont une suite de sécurité qui attaque
              l'API comme le ferait un attaquant
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Titre>Et maintenant</Titre>
          <p className="leading-relaxed text-muted-foreground">
            Je suis{" "}
            <span className="font-semibold text-foreground">
              ouvert à toute opportunité dans le développement web
            </span>
            . Continuer à me former en{" "}
            <span className="font-semibold text-foreground">alternance</span>{" "}
            m'intéresse autant qu'un poste où je pourrai apprendre au contact
            d'une équipe, sur du code réel.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            L'application est fonctionnelle : essayez-la. Le code est sur
            GitHub, ouvert à qui veut le lire. Et si vous avez une question, une
            remarque ou une idée pour l'améliorer, écrivez-moi — les critiques
            sont les bienvenues, c'est comme ça qu'on progresse.
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
            href="https://www.github.com/manu-git-dev"
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
