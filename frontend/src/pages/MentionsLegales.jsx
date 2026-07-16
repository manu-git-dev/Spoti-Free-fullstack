import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import Page from "../composants/Page";
import TitreSection from "../composants/TitreSection";

// ATTENTION — trois valeurs sont a completer avant la mise en ligne, elles sont marquees
// A_COMPLETER ci-dessous. Elles n'ont pas ete devinees volontairement : des mentions legales
// qui affichent une raison sociale ou un hebergeur approximatifs sont pires que pas de mentions
// legales du tout, puisqu'elles affirment quelque chose de faux.

// La taille du corps de texte (`leading-relaxed`, sans `text-sm`) est celle des paragraphes de
// la page A propos. Les deux pages sont de la prose : rien ne justifiait qu'on lise l'une plus
// petit que l'autre — c'etait un accident, pas une decision.
function Bloc({ titre, children }) {
  return (
    <section className="flex flex-col gap-2">
      <TitreSection>{titre}</TitreSection>
      <div className="leading-relaxed text-muted-foreground flex flex-col gap-2">
        {children}
      </div>
    </section>
  );
}

export default function MentionsLegales() {
  return (
    <Page
      icone={Scale}
      titre="Mentions légales"
      sousTitre="Qui édite ce site, ce qu'on y diffuse, et comment signaler un contenu."
    >
      <div className="flex flex-col gap-8">
        <Bloc titre="Éditeur">
          <p>
            Spotifree est un projet personnel et non commercial, réalisé dans le
            cadre d'une formation de développeur web.
          </p>
          <p>
            Directeur de la publication : <strong>A_COMPLETER</strong> — contact
            : <strong>A_COMPLETER</strong>.
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
            et un mot de passe chiffré. Les statistiques de visite ne conservent
            pas les adresses IP en clair : elles sont hachées avec un sel, et ne
            permettent pas de remonter à une personne.
          </p>
          <p>
            Vous pouvez <strong>supprimer votre compte à tout moment</strong>,
            depuis votre{" "}
            <Link
              to="/profil"
              className="text-primary underline-offset-2 hover:underline"
            >
              profil
            </Link>
            , sans avoir à le demander à qui que ce soit. La suppression est
            immédiate et définitive : elle emporte vos playlists, vos favoris et
            vos dépôts en attente. Les morceaux que vous avez déposés et qui ont
            été publiés restent au catalogue, sous la licence libre que vous
            leur avez donnée.
          </p>
          <p>
            Pour toute autre demande concernant vos données (accès,
            rectification), écrivez-nous via la{" "}
            <Link
              to="/contact"
              className="text-primary underline-offset-2 hover:underline"
            >
              page de contact
            </Link>
            .
          </p>
        </Bloc>
      </div>
    </Page>
  );
}
