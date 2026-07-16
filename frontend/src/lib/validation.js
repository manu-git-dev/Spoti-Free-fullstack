// Miroir des regles appliquees par le serveur (`backend/src/validation.js`).
//
// Ce fichier ne "protege" rien : un appel direct a l'API ne passe jamais par React. Il sert a
// dire a l'utilisateur ce qu'on attend de lui PENDANT qu'il tape, plutot que de le laisser
// decouvrir la regle en se prenant une erreur au moment de valider.
//
// Les deux fichiers doivent donc rester d'accord. S'ils divergent, le symptome est desagreable :
// le formulaire affiche un joli check vert, et le serveur refuse quand meme.

export const REGLES_MOT_DE_PASSE = [
  {
    id: "longueur",
    libelle: "Au moins 8 caractères",
    test: (motDePasse) => motDePasse.length >= 8,
  },
  {
    id: "majuscule",
    libelle: "Une majuscule",
    test: (motDePasse) => /[A-Z]/.test(motDePasse),
  },
  {
    id: "chiffre",
    libelle: "Un chiffre",
    test: (motDePasse) => /[0-9]/.test(motDePasse),
  },
];

export function emailValide(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function motDePasseValide(motDePasse) {
  return REGLES_MOT_DE_PASSE.every((regle) => regle.test(motDePasse));
}

// Les licences proposees au depot. Miroir de LICENCES_ACCEPTEES dans backend/src/validation.js :
// le serveur refuse tout ce qui n'y figure pas, cette liste ne fait que remplir le menu.
//
// On n'y met QUE les versions 4.0 : les versions 2.x et 3.0 restent acceptees par le serveur
// (le catalogue importe depuis Jamendo en contient beaucoup, ce sont des morceaux anciens), mais
// il n'y a aucune raison de proposer a quelqu'un qui publie AUJOURD'HUI une licence obsolete.
// Accepter large, proposer etroit.
export const LICENCES_DEPOT = [
  {
    code: "CC BY 4.0",
    libelle: "CC BY 4.0 — réutilisable avec attribution",
  },
  {
    code: "CC BY-SA 4.0",
    libelle: "CC BY-SA 4.0 — attribution + partage à l'identique",
  },
];

// Les licences que le CATALOGUE peut contenir. Miroir de LICENCES_ACCEPTEES (backend).
//
// A ne pas confondre avec LICENCES_DEPOT ci-dessus, qui est plus court : un déposant publie
// AUJOURD'HUI, il n'a aucune raison de choisir une licence obsolète. Le catalogue, lui, contient
// des œuvres publiées il y a quinze ans — 98 % du catalogue Jamendo est en 3.0.
//
// L'administration doit donc pouvoir afficher (et donc proposer) ces anciennes versions. Ne lui
// offrir que la 4.0 forcerait à « corriger » la licence d'un morceau en 3.0 pour pouvoir
// enregistrer une modification de titre — c'est-à-dire à RELICENCIER l'œuvre de quelqu'un
// d'autre. On ne relicencie pas une œuvre : la licence est le choix de son auteur.
export const LICENCES_CATALOGUE = [
  "CC BY 2.0",
  "CC BY 2.5",
  "CC BY 3.0",
  "CC BY 4.0",
  "CC BY-SA 2.0",
  "CC BY-SA 2.5",
  "CC BY-SA 3.0",
  "CC BY-SA 4.0",
];

// Les genres du catalogue. Miroir de GENRES (backend/src/validation.js).
//
// Une liste FERMÉE : le filtre de la Bibliothèque déduit ses pastilles des genres présents, donc
// chaque valeur nouvelle crée une pastille. Un genre libre produirait des pastilles menant à un
// seul morceau — et « rock » / « Rock » en feraient deux, distinctes.
export const GENRES = [
  "Pop",
  "Rock",
  "Electro",
  "Hip-hop",
  "Jazz",
  "Folk",
  "Soul",
  "Reggae",
  "Chill",
  "World",
];
