import { Link } from "react-router-dom";
import { Info, Code2, Mail, Play, NotebookPen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Page from "../composants/Page";
import TitreSection from "../composants/TitreSection";

const DEPOT = "https://github.com/manu-git-dev/Spoti-Free-fullstack";

// Met en valeur sans crier : la GRAISSE seule. Le `text-foreground` d'avant n'avait de sens que
// tant que le corps du texte etait en `text-muted-foreground` — il ressortait alors par l'encre.
// Depuis que la prose est a pleine encre (2026-07-27), la couleur ne distinguait plus rien.
function Fort({ children }) {
  return <span className="font-semibold">{children}</span>;
}

export default function Apropos() {
  return (
    <Page
      icone={Info}
      titre="À propos"
      sousTitre="Un clone de Spotify full-stack — et l'histoire, sincère, de comment je l'ai construit."
    >
      {/* PAS d'enveloppe grise autour de la prose (retiree le 2026-07-27).
          Elle etait en `bg-background/50` POSEE SUR `bg-background` : la meme couleur a 50 %
          d'opacite sur elle-meme reste la meme couleur. Il n'en restait qu'une bordure, qui
          courait a droite du texte et se lisait comme un cadre vide — « une card qui prend toute
          la largeur mais pas le texte ». Un panneau qu'on ne voit pas n'est pas un panneau.

          C'est le cas prevu par la regle des surfaces : une page dont le contenu contient DEJA un
          panneau (ici « Comment ce projet a ete construit ») ne peut pas en recevoir un autre
          par-dessus — il n'y a pas de troisieme niveau. En retirant l'enveloppe, ce panneau
          interne se detache enfin du fond, ce qui etait tout son but.

          `max-w-5xl` : la ligne de texte garde une longueur lisible (45-75 caracteres). L'en-tete
          et la prose restent cales a gauche, sur le meme axe que les autres pages. */}
      <div className="flex w-full max-w-5xl flex-col gap-6">
        {/* La salutation tient sa propre ligne. L'espace apres le 👋 EXISTE bien dans le texte :
            c'est le glyphe emoji qui l'avale visuellement, donc ce n'etait pas un bug de code.
            Une espace insecable fine ou une marge sur un <span> auraient corrige l'affichage
            CHEZ Manuel, mais dependent de la police emoji du systeme du visiteur — le retour a
            la ligne, lui, ne depend de rien. Tranche par Manuel le 2026-07-28.
            `gap-3` et non `gap-6` : c'est le rythme INTERNE d'une section (celui d'un
            TitreSection et de son paragraphe), pas une nouvelle section — la salutation
            introduit le recit, elle ne s'en detache pas. */}
        <div className="flex flex-col gap-3">
          <p className="leading-relaxed">
            Salut, moi c'est{" "}
            <span className="text-link font-bold">Manuel</span> 👋
          </p>
          <p className="leading-relaxed">
            Pendant dix ans, j'ai été{" "}
            <Fort>mécanicien aéronautique dans l'armée</Fort> : un métier où on
            ne bricole pas, où l'on suit des procédures, où l'on diagnostique —
            et où une erreur ne pardonne pas. J'y ai appris la rigueur. Mais au
            bout de dix ans, la routine avait pris toute la place. J'ai décidé
            de repartir de zéro, et je suis aujourd'hui en formation{" "}
            <Fort>Développeur Web et Web Mobile&nbsp;(DWWM)</Fort>.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <TitreSection>D'où vient Spoti-Free</TitreSection>
          <p className="leading-relaxed">
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
          <TitreSection>Comment ce projet a été construit</TitreSection>
          <p className="leading-relaxed">
            Ce projet a eu deux vies. La première, je l'ai codée moi-même. En
            formation, j'avais envie de sortir des exercices et de construire un
            vrai full-stack de bout en bout : j'ai dessiné la base de données,
            écrit les routes de l'API, testé chaque endpoint sur Postman, puis
            branché un front React par-dessus — squelette, Tailwind, daisyUI. À
            la fin, ça tournait : on pouvait s'inscrire, se connecter, ajouter un
            favori, créer une playlist. C'était brut — pas responsive, pas très
            joli, loin d'être complet — mais ça marchait, et j'avais compris
            comment les morceaux tenaient ensemble. C'est la partie dont je suis
            le plus fier.
          </p>
          <p className="leading-relaxed">
            Puis j'ai décroché mon stage, et le projet aurait pu s'arrêter là.
            J'ai eu envie de continuer, autrement : m'en servir pour apprendre ce
            qui fait aujourd'hui partie du métier — travailler avec l'IA. J'ai
            repris l'app avec Claude Code, en essayant de ne pas juste « lui
            demander de coder », mais d'apprendre à le diriger : proposer une
            architecture, relire ce qu'il écrit, poser des questions quand je ne
            comprends pas, refuser une solution bancale. C'est comme ça que l'app
            est devenue ce que vous voyez : plus finie, responsive, plus sûre,
            avec une centaine de tests.
          </p>
          <p className="leading-relaxed">
            Je préfère être franc plutôt que de faire semblant : je suis un{" "}
            <Fort>développeur junior, encore en apprentissage</Fort>, et une
            bonne partie de cette version a été écrite avec l'IA. Je ne cherche
            pas à le cacher — j'essaie plutôt de m'en servir bien. Les
            fondations, elles, sont de moi. Et c'est ce que j'ai le plus envie de
            continuer : <Fort>comprendre ce que je code</Fort>, avec ou sans
            assistant.
          </p>
          <p className="leading-relaxed">
            J'ai aussi gardé une trace écrite au fil du projet : à chaque
            difficulté, une note — le problème, la cause, et comment je l'ai
            comprise. Elles sont versionnées avec le code.
          </p>
          <a
            href={`${DEPOT}/blob/main/NOTES-APPRENTISSAGE.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start text-link hover:underline underline-offset-4"
          >
            <NotebookPen className="w-4 h-4 shrink-0" />
            Lire mon journal d'apprentissage
          </a>
        </div>

        <div className="flex flex-col gap-3">
          <TitreSection>Ce que contient l'application</TitreSection>
          <ul className="flex flex-col gap-2">
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
          <TitreSection>Et maintenant</TitreSection>
          <p className="leading-relaxed">
            Je suis en formation{" "}
            <Fort>Développeur Web et Web Mobile</Fort> jusqu'au{" "}
            <Fort>21 novembre 2026</Fort>, et je cherche déjà la suite : une
            équipe où continuer à apprendre, sur des projets réels. Alternance,
            premier poste — l'étiquette compte moins que de progresser au contact
            de gens qui savent.
          </p>
          <p className="leading-relaxed">
            L'application est fonctionnelle : essayez-la. Le code est ouvert à
            qui veut le lire. Et si vous avez une remarque, une critique ou une
            idée, écrivez-moi — c'est comme ça qu'on avance.
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
    </Page>
  );
}
