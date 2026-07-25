// La session stockee dans le navigateur : les DEUX cles de `localStorage`, lues et ecrites au
// meme endroit.
//
// Avant, quatre fichiers faisaient chacun leur `removeItem("token")` + `removeItem("user")` a la
// main (App, Login, Deconnexion, SupprimerCompte). Quatre copies d'une meme regle, c'est trois
// occasions d'en oublier une moitie — et une session a moitie effacee est pire qu'une session
// ouverte : l'interface croit personne connectee pendant que `apiFetch` continue d'envoyer le
// jeton.
//
// Ce module ne connait ni React ni l'API : il ne fait que traduire `localStorage` en un objet
// `{ user, token }`, et l'inverse. C'est ce qui permet a `api.js` de s'en servir aussi sans
// creer de dependance circulaire.

const CLE_TOKEN = "token";
const CLE_USER = "user";

/** L'absence de session. Gele pour qu'un `session.user = ...` distrait ne le corrompe pas. */
export const SESSION_VIDE = Object.freeze({ user: null, token: null });

/**
 * Relit la session au demarrage de l'app.
 *
 * `JSON.parse` LEVE sur une entree illisible (stockage edite a la main, extension du navigateur,
 * format laisse par une version precedente du site). Cet appel vit dans l'initialiseur d'un
 * `useState`, donc il s'execute PENDANT LE RENDU : sans ce `try`, l'exception ne remonte nulle
 * part, React abandonne l'arbre, et l'ecran reste blanc. Le pire de ce symptome, c'est qu'il ne
 * se repare pas tout seul — sans interface, la personne ne peut meme pas se deconnecter pour en
 * sortir.
 *
 * Une session incomplete (un jeton sans utilisateur, ou l'inverse) est traitee comme une absence
 * de session, et effacee. C'est la meme decision que pour l'entree illisible : une session est
 * une PAIRE, sa moitie ne vaut rien. Mieux vaut redemander une connexion — dix secondes — qu'un
 * etat que rien dans le code ne sait decrire.
 */
export function lireSession() {
  const token = localStorage.getItem(CLE_TOKEN);
  const brut = localStorage.getItem(CLE_USER);

  if (!token || !brut) {
    // Rien du tout : cas normal d'une premiere visite, on ne touche a rien.
    if (!token && !brut) return SESSION_VIDE;

    effacerSession();
    return SESSION_VIDE;
  }

  try {
    return { user: JSON.parse(brut), token };
  } catch {
    effacerSession();
    return SESSION_VIDE;
  }
}

/**
 * Le jeton seul, pour `api.js` qui n'a besoin que de lui a chaque requete.
 *
 * Passer par `lireSession()` marcherait, mais parserait le JSON de l'utilisateur a chaque appel
 * d'API pour le jeter aussitot.
 */
export function lireToken() {
  return localStorage.getItem(CLE_TOKEN);
}

/** Ecrit la session apres une connexion. Les deux cles partent ensemble, toujours. */
export function ecrireSession({ user, token }) {
  localStorage.setItem(CLE_TOKEN, token);
  // `localStorage` ne stocke que des chaines : sans `stringify`, on ecrirait "[object Object]".
  localStorage.setItem(CLE_USER, JSON.stringify(user));
}

export function effacerSession() {
  localStorage.removeItem(CLE_TOKEN);
  localStorage.removeItem(CLE_USER);
}
