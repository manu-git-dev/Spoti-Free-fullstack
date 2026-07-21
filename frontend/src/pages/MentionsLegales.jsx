import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import Page from "../composants/Page";
import TitreSection from "../composants/TitreSection";

// Les coordonnees de l'HEBERGEUR (bloc « Hebergement ») sont celles de la FACTURE Hostinger
// HCY-27587200 du 21/07/2026 — la seule source qui dise quelle entite a reellement vendu le
// service : les CGU d'Hostinger listent plusieurs entites selon le pays (Chypre, Luxembourg, UK,
// Singapour, Indonesie), et la facture tranche. Ne pas la « mettre a jour » depuis un annuaire
// tiers : des mentions legales qui affichent un hebergeur approximatif sont pires que pas de
// mentions du tout, puisqu'elles affirment quelque chose de faux.
//
// Le TELEPHONE de l'hebergeur, demande par l'article 6-III de la LCEN, n'est pas publie par
// Hostinger (assistance en chat et par ticket uniquement). On l'ecrit explicitement plutot que
// de recopier un numero trouve sur un annuaire tiers et invérifiable.

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
      {/* Meme agencement qu'A propos — panneau pleine largeur, prose calee a gauche dedans.
          Le raisonnement est detaille dans `Apropos.jsx`. */}
      <div className="rounded-2xl border border-border bg-background/50 p-6 md:p-8">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <Bloc titre="Éditeur">
          <p>
            Spotifree est un projet personnel et non commercial, réalisé dans le
            cadre d'une formation de développeur web.
          </p>
          <p>
            Directeur de la publication : <strong>Manuel Mattana</strong>. Pour
            nous contacter, écrivez-nous via la{" "}
            <Link
              to="/contact"
              className="text-primary underline-offset-2 hover:underline"
            >
              page de contact
            </Link>
            .
          </p>
        </Bloc>

        <Bloc titre="Hébergement">
          <p>
            Ce site est hébergé par <strong>Hostinger International Ltd.</strong>
            , 61 Lordou Vironos Street, 6023 Larnaca, Chypre — TVA
            CY&nbsp;10301365E.
          </p>
          <p>
            L'hébergeur ne publie pas de numéro de téléphone : son assistance
            s'effectue par messagerie et par ticket, depuis{" "}
            <a
              href="https://www.hostinger.com/fr/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              hostinger.com
            </a>
            .
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
      </div>
    </Page>
  );
}
