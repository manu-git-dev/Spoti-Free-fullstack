import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import EnTetePage from "../composants/EnTetePage";

// ATTENTION — trois valeurs sont a completer avant la mise en ligne, elles sont marquees
// A_COMPLETER ci-dessous. Elles n'ont pas ete devinees volontairement : des mentions legales
// qui affichent une raison sociale ou un hebergeur approximatifs sont pires que pas de mentions
// legales du tout, puisqu'elles affirment quelque chose de faux.

function Titre({ children }) {
  return (
    <h2 className="text-xl font-serif font-bold text-primary">{children}</h2>
  );
}

function Bloc({ titre, children }) {
  return (
    <section className="flex flex-col gap-2">
      <Titre>{titre}</Titre>
      <div className="text-sm leading-relaxed text-muted-foreground flex flex-col gap-2">
        {children}
      </div>
    </section>
  );
}

export default function MentionsLegales() {
  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <EnTetePage
          icone={Scale}
          titre="Mentions légales"
          sousTitre="Qui édite ce site, ce qu'on y diffuse, et comment signaler un contenu."
        />

        <Bloc titre="Éditeur">
          <p>
            Spotifree est un projet personnel et non commercial, réalisé dans le
            cadre d'une formation de développeur web.
          </p>
          <p>
            Directeur de la publication : <strong>A_COMPLETER</strong> —
            contact : <strong>A_COMPLETER</strong>.
          </p>
        </Bloc>

        <Bloc titre="Hébergement">
          <p>
            <strong>A_COMPLETER</strong> (nom, adresse et téléphone de
            l'hébergeur).
          </p>
        </Bloc>

        <Bloc titre="Les musiques diffusées">
          <p>
            Spotifree ne diffuse que des œuvres placées par leurs auteurs sous
            licence <strong>Creative Commons BY</strong> ou{" "}
            <strong>CC BY-SA</strong>. Ces licences autorisent la
            redistribution, à condition de créditer l'auteur — c'est pourquoi
            chaque morceau affiche sa licence et un lien vers son original dans
            le lecteur.
          </p>
          <p>
            Aucune œuvre sous droits exclusifs n'est diffusée ici. Les morceaux
            déposés par les utilisateurs sont examinés avant publication, et
            leur auteur doit certifier qu'il en détient les droits.
          </p>
        </Bloc>

        <Bloc titre="Signaler un contenu">
          <p>
            Si vous êtes l'ayant droit d'une œuvre diffusée ici et que sa
            présence vous semble abusive, écrivez-nous via la{" "}
            <Link
              to="/contact"
              className="text-primary underline-offset-2 hover:underline"
            >
              page de contact
            </Link>{" "}
            en indiquant le titre concerné et le motif. Le contenu signalé sera
            retiré sans délai le temps de la vérification.
          </p>
        </Bloc>

        <Bloc titre="Données personnelles">
          <p>
            Les comptes stockent un pseudo, un nom, un prénom, une adresse email
            et un mot de passe chiffré. Les statistiques de visite ne
            conservent pas les adresses IP en clair : elles sont hachées avec un
            sel, et ne permettent pas de remonter à une personne.
          </p>
          <p>
            Pour demander l'accès, la rectification ou la suppression de vos
            données, écrivez-nous via la{" "}
            <Link
              to="/contact"
              className="text-primary underline-offset-2 hover:underline"
            >
              page de contact
            </Link>
            . La suppression d'un compte entraîne celle de ses playlists et de
            ses favoris.
          </p>
        </Bloc>
      </div>
    </section>
  );
}
