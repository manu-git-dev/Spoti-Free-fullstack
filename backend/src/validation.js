// Regles de saisie communes a toutes les routes qui acceptent un email, un mot de passe ou une
// licence.
//
// Elles vivent dans UN SEUL module parce que plusieurs routes les appliquent. Le mot de passe est
// valide a l'inscription ET a la reinitialisation : une regle durcie a l'inscription mais oubliee
// sur la reinitialisation se contournerait en passant par "mot de passe oublie" — le formulaire le
// plus strict ne sert alors plus a rien. Meme logique pour la licence, exigee a l'ajout admin, a
// l'approbation d'un depot et par le script d'import : trois portes vers la meme table `musics`,
// une seule definition de ce qui est acceptable.
//
// Le frontend affiche les memes regles (`frontend/src/lib/validation.js`), mais ce n'est qu'un
// confort : la validation qui protege vraiment est celle-ci, car un appel direct a l'API ne passe
// jamais par le formulaire React.

export const MESSAGE_MOT_DE_PASSE =
  "Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.";

export function emailValide(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function motDePasseValide(motDePasse) {
  if (typeof motDePasse !== "string") return false;

  return (
    motDePasse.length >= 8 &&
    /[A-Z]/.test(motDePasse) &&
    /[0-9]/.test(motDePasse)
  );
}

// ---------------------------------------------------------------------------
// Licences acceptees
//
// Le catalogue et les depots n'admettent que des oeuvres redistribuables. On s'en tient
// volontairement a CC BY et CC BY-SA, en excluant les variantes NC (non commercial) et ND
// (pas de modification).
//
// Ce n'est pas parce que NC ou ND nous interdiraient quoi que ce soit : l'app est gratuite et
// ne modifie aucun morceau, un CC BY-NC-ND serait donc diffusable ici. C'est parce que la
// question se reposerait a chaque evolution ("et si on ajoutait un mixage ? et si on affichait
// une pub ?"), alors que BY et BY-SA autorisent la redistribution sans condition a verifier.
// On coupe court en filtrant a la source.
//
// L'URL du deed est DERIVEE du code, jamais recue du client. Meme raisonnement que pour
// `src_audio` dans musicRoute.js : une URL fournie par l'appelant est une valeur qu'on ne
// controle pas. Rien n'empecherait d'afficher "CC BY 4.0" en pointant vers n'importe quoi —
// l'attribution deviendrait un mensonge signe de notre main.
// ---------------------------------------------------------------------------
export const LICENCES_ACCEPTEES = Object.freeze({
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
  "CC BY 2.5": "https://creativecommons.org/licenses/by/2.5/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
  "CC BY-SA 2.5": "https://creativecommons.org/licenses/by-sa/2.5/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
});

export const MESSAGE_LICENCE =
  "La licence doit être une licence Creative Commons BY ou BY-SA.";

export function licenceValide(licence) {
  return (
    typeof licence === "string" &&
    Object.hasOwn(LICENCES_ACCEPTEES, licence)
  );
}

export function urlDeLicence(licence) {
  return LICENCES_ACCEPTEES[licence] ?? null;
}

// Traduit l'URL de licence renvoyee par une API tierce (Jamendo expose `license_ccurl`) vers
// notre code lisible. Renvoie null si la licence n'est pas dans le perimetre accepte — c'est
// ce qui permet au script d'import d'ecarter un morceau sans avoir a connaitre nos regles.
//
// La comparaison ignore le protocole et le slash final : les APIs servent indifferemment
// `http://creativecommons.org/licenses/by/3.0/` et sa variante https, ou sans slash.
export function licenceDepuisUrlCC(url) {
  if (typeof url !== "string") return null;

  const normalise = (valeur) =>
    valeur.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();

  const cible = normalise(url);

  for (const [code, deed] of Object.entries(LICENCES_ACCEPTEES)) {
    if (normalise(deed) === cible) return code;
  }

  return null;
}

// ---------------------------------------------------------------------------
// URL de source
//
// Cette valeur finit dans un `href` affiche a tous les visiteurs. Se contenter de verifier
// qu'elle "ressemble a une URL" laisserait passer `javascript:...`, qui s'executerait au clic
// dans le navigateur de n'importe quel utilisateur : une faille XSS livree par un formulaire
// public. On n'autorise donc QUE http et https, en s'appuyant sur le parseur natif plutot que
// sur une expression reguliere maison — c'est lui qui fait autorite sur ce qu'est une URL.
// ---------------------------------------------------------------------------
export const MESSAGE_SOURCE_URL =
  "Le lien vers la source doit être une adresse http:// ou https:// valide.";

export function sourceUrlValide(url) {
  if (url === null || url === undefined || url === "") return true; // facultatif
  if (typeof url !== "string") return false;

  let analysee;
  try {
    analysee = new URL(url);
  } catch {
    return false;
  }

  return analysee.protocol === "http:" || analysee.protocol === "https:";
}
