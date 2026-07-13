// Point de passage unique de tous les appels a l'API.
//
// Il resout trois problemes qui trainaient dans le projet :
//
// 1. L'URL "http://localhost:3000" etait ecrite en dur dans une quinzaine de composants :
//    impossible de deployer sans les editer un par un. Elle vient maintenant de
//    `VITE_API_URL` (voir `.env`), avec le localhost en valeur par defaut pour le dev.
//
// 2. Chaque composant relisait le token dans localStorage et reconstruisait son header
//    `Authorization` a la main. C'est fait ici, une fois.
//
// 3. Surtout : un token expire renvoyait un 401 que personne n'interceptait. L'app restait
//    dans une session morte ("Bonjour X" alors que toutes les actions echouaient). Desormais
//    *tout* 401 declenche `surSessionExpiree`, quel que soit l'appel qui l'a provoque.

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// App enregistre ici sa fonction de deconnexion au montage. On passe par un callback plutot
// que par un import direct : ce module n'a pas a connaitre React ni le state de l'app.
let surSessionExpiree = null;

export function definirSurSessionExpiree(callback) {
  surSessionExpiree = callback;
}

export function urlFichier(chemin) {
  return `${BASE_URL}/${chemin}`;
}

/**
 * URL absolue d'une route de l'API, pour les cas ou le navigateur va la chercher lui-meme
 * (attribut `src` d'un <audio> ou d'une <img>) plutot que de passer par `apiFetch`.
 */
export function urlApi(chemin) {
  return `${BASE_URL}${chemin}`;
}

/**
 * Message d'erreur a afficher a l'utilisateur, ou `null` s'il n'y a rien a dire.
 *
 * Sur un 401, la session vient d'etre purgee et un toast global ("Ta session a expiré")
 * est deja affiche : renvoyer le message brut de l'API en plus ("Token invalide") ferait
 * deux toasts, dont un jargon technique. On renvoie donc `null` dans ce cas.
 */
export function messageErreur(reponse, donnees) {
  if (reponse.status === 401) return null;
  return donnees?.message ?? "Une erreur est survenue.";
}

/**
 * Appelle l'API. Ajoute le token si l'utilisateur est connecte, serialise `body` en JSON,
 * et intercepte les 401 (session expiree).
 *
 * Renvoie { reponse, donnees } : `reponse` pour le statut (`reponse.ok`, `reponse.status`),
 * `donnees` pour le corps deja parse.
 */
export async function apiFetch(chemin, options = {}) {
  // `brut: true` : ne pas tenter de parser la reponse en JSON. Utile quand la route renvoie un
  // fichier (audio, image) et non des donnees — l'appelant recupere alors `reponse` et fait ce
  // qu'il veut du corps (`.blob()`, `.text()`...).
  const { body, headers, brut = false, ...reste } = options;
  const token = localStorage.getItem("token");

  // Un envoi de fichiers passe par FormData, pas par du JSON. Dans ce cas il ne faut SURTOUT
  // pas poser `Content-Type` soi-meme : le navigateur doit le generer lui-meme, car il doit y
  // inclure la "boundary" (le separateur entre les champs) qu'il vient de tirer au hasard.
  // Ecrire "multipart/form-data" a la main, sans cette boundary, rend le corps illisible pour
  // le serveur — et multer repond alors une erreur incomprehensible.
  const estFormData = body instanceof FormData;

  const reponse = await fetch(`${BASE_URL}${chemin}`, {
    ...reste,
    headers: {
      ...(body !== undefined && !estFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined
      ? { body: estFormData ? body : JSON.stringify(body) }
      : {}),
  });

  // 401 = "je ne sais pas qui tu es" : token absent, invalide ou expire. La session locale
  // ne vaut plus rien, on la purge. (403 = "je sais qui tu es mais tu n'as pas le droit" :
  // la session reste valide, on ne deconnecte donc pas.)
  if (reponse.status === 401) {
    surSessionExpiree?.();
  }

  // Reponse binaire (un fichier) : on rend la reponse telle quelle, sans la consommer — sinon
  // l'appelant ne pourrait plus lire le corps (un corps de reponse ne se lit qu'une fois).
  if (brut) {
    return { reponse, donnees: null };
  }

  let donnees = null;
  try {
    donnees = await reponse.json();
  } catch {
    // reponse sans corps JSON : on laisse `donnees` a null.
  }

  return { reponse, donnees };
}
