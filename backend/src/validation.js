// Regles de saisie communes a toutes les routes qui acceptent un email ou un mot de passe.
//
// Elles vivent dans UN SEUL module parce que deux routes les appliquent : l'inscription et la
// reinitialisation du mot de passe. Une regle durcie a l'inscription mais oubliee sur la
// reinitialisation se contournerait en passant par "mot de passe oublie" — le formulaire le plus
// strict ne sert alors plus a rien.
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
