// Configuration partagee par les routes.

/**
 * Coupe les limites anti-abus (brute-force sur la connexion, spam du formulaire de contact).
 *
 * Necessaire pour la suite de tests, qui cree plusieurs comptes par execution et se ferait
 * bloquer par ses propres protections.
 *
 * La condition sur NODE_ENV est le point important : meme si `RATE_LIMIT_DISABLED=1` se
 * retrouvait par accident dans le `.env` de production (copier-coller, fichier oublie), les
 * limites resteraient actives. Une protection ne doit jamais pouvoir etre desactivee par une
 * simple variable laissee la par megarde.
 */
export const limitesDesactivees =
  process.env.NODE_ENV !== "production" &&
  process.env.RATE_LIMIT_DISABLED === "1";
