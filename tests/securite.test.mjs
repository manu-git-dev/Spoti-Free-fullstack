// Tests de securite de l'API : ils verrouillent les failles trouvees lors de l'audit du
// 2026-07-13, pour qu'elles ne puissent pas revenir sans etre detectees.
//
// Ils tapent directement sur l'API (pas de navigateur) : c'est le point de vue d'un attaquant,
// qui n'utilise pas l'interface.
//
// Lancer : cd tests && npm run test:securite

import {
  API,
  limitesDesactivees,
  creerCompte,
  apiAuth,
  verifier,
  etape,
  rapport,
  nettoyerComptesDeTest,
} from "./utils.mjs";

const JSON_HEADERS = { "Content-Type": "application/json" };

const musiqueBidon = {
  title: "INTRUSION",
  artist: "Attaquant",
  genre: "test",
  srcImage: "images/1.jpg",
  srcAudio: "musiques/1.mp3",
  duration: 1,
};

// ---------------------------------------------------------------------------
// 1. Le catalogue n'est pas modifiable sans etre admin
//
// Ces trois routes n'avaient AUCUN middleware : n'importe qui pouvait creer, modifier et
// supprimer les musiques sans le moindre token.
// ---------------------------------------------------------------------------
await etape("catalogue : routes d'administration", async () => {
  // --- sans aucun token ---
  const sansToken = await fetch(`${API}/api/musics/ajouter`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(musiqueBidon),
  });
  verifier(
    "catalogue : ajouter une musique sans token => 401",
    sansToken.status === 401,
    `recu ${sansToken.status}`,
  );

  const suppressionSansToken = await fetch(`${API}/api/musics/delete/1`, {
    method: "DELETE",
  });
  verifier(
    "catalogue : supprimer une musique sans token => 401",
    suppressionSansToken.status === 401,
    `recu ${suppressionSansToken.status}`,
  );

  // --- avec un token d'utilisateur normal (authentifie, mais pas admin) ---
  const compte = await creerCompte("UtilisateurNormal");
  const api = apiAuth(compte.token);

  const ajout = await api("/api/musics/ajouter", {
    method: "POST",
    body: musiqueBidon,
  });
  verifier(
    "catalogue : ajouter une musique en tant qu'utilisateur normal => 403",
    ajout.reponse.status === 403,
    `recu ${ajout.reponse.status}`,
  );

  const suppression = await api("/api/musics/delete/1", { method: "DELETE" });
  verifier(
    "catalogue : supprimer une musique en tant qu'utilisateur normal => 403",
    suppression.reponse.status === 403,
    `recu ${suppression.reponse.status}`,
  );

  const listeUtilisateurs = await api("/api/users");
  verifier(
    "utilisateurs : lister les comptes en tant qu'utilisateur normal => 403",
    listeUtilisateurs.reponse.status === 403,
    `recu ${listeUtilisateurs.reponse.status}`,
  );

  // --- le catalogue est reste intact ---
  const musiques = await (await fetch(`${API}/api/musics`)).json();
  verifier(
    "catalogue : aucune musique intruse n'a ete creee",
    !musiques.some((m) => m.title === "INTRUSION"),
  );
});

// ---------------------------------------------------------------------------
// 2. Validation cote serveur
//
// Le `type="email"` du formulaire et les verifications React ne protegent que le navigateur :
// un appel direct a l'API les contourne. L'API acceptait `password: "a"` et un email invalide.
// ---------------------------------------------------------------------------
await etape("validation de l'inscription", async () => {
  const inscrire = (corps) =>
    fetch(`${API}/api/users/inscription`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(corps),
    });

  const base = { pseudo: "V", prenom: "V", nom: "V" };

  const mdpCourt = await inscrire({
    ...base,
    email: `e2e-test+court${Date.now()}@example.com`,
    password: "a",
  });
  verifier(
    "inscription : un mot de passe trop court est refuse (400)",
    mdpCourt.status === 400,
    `recu ${mdpCourt.status}`,
  );

  const emailInvalide = await inscrire({
    ...base,
    email: "pas-un-email",
    password: "MotDePasse123!",
  });
  verifier(
    "inscription : un email invalide est refuse (400)",
    emailInvalide.status === 400,
    `recu ${emailInvalide.status}`,
  );
});

// ---------------------------------------------------------------------------
// 3. Codes HTTP : le bon code pour la bonne situation
// ---------------------------------------------------------------------------
await etape("codes HTTP", async () => {
  const compte = await creerCompte("CodesHttpTest");
  const api = apiAuth(compte.token);

  // Un like en doublon violait la cle primaire (id_user, id_music) et remontait un 500
  // ("erreur serveur") au lieu d'un 409 ("ca existe deja"). C'est ce mauvais code qui rendait
  // le bug des likes si difficile a diagnostiquer.
  const premier = await api("/api/users/like/1", { method: "POST" });
  verifier(
    "like : le premier like renvoie 201",
    premier.reponse.status === 201,
    `recu ${premier.reponse.status}`,
  );

  const doublon = await api("/api/users/like/1", { method: "POST" });
  verifier(
    "like : un doublon renvoie 409 (et non 500)",
    doublon.reponse.status === 409,
    `recu ${doublon.reponse.status}`,
  );

  // Une liste vide est un resultat valide, pas une ressource introuvable.
  const nouveau = await creerCompte("ListeVideTest");
  const apiVide = apiAuth(nouveau.token);

  const likes = await apiVide("/api/users/likes");
  verifier(
    "listes : aucun like => 200 avec un tableau vide (et non 404)",
    likes.reponse.status === 200 && Array.isArray(likes.donnees) && likes.donnees.length === 0,
    `recu ${likes.reponse.status}`,
  );

  const playlists = await apiVide("/api/playlists");
  verifier(
    "listes : aucune playlist => 200 avec un tableau vide (et non 404)",
    playlists.reponse.status === 200 && Array.isArray(playlists.donnees),
    `recu ${playlists.reponse.status}`,
  );

  // Une requete malformee est une erreur du client (400), pas du serveur (500).
  const nomVide = await api("/api/playlists/ajouter", {
    method: "POST",
    body: { nom: "   " },
  });
  verifier(
    "playlist : un nom vide renvoie 400",
    nomVide.reponse.status === 400,
    `recu ${nomVide.reponse.status}`,
  );

  // Sans Content-Type, `req.body` est undefined avec Express 5 : les routes levaient une
  // TypeError et repondaient 500 au lieu de 400.
  const sansContentType = await fetch(`${API}/api/playlists/ajouter`, {
    method: "POST",
    headers: { Authorization: `Bearer ${compte.token}` },
    body: "peu importe",
  });
  verifier(
    "requete sans Content-Type : 400 et non 500 (pas de crash)",
    sansContentType.status === 400,
    `recu ${sansContentType.status}`,
  );

  // Une route inexistante doit renvoyer du JSON, pas la page HTML par defaut d'Express.
  const inexistante = await fetch(`${API}/api/route-qui-nexiste-pas`);
  const typeContenu = inexistante.headers.get("content-type") ?? "";
  verifier(
    "route inexistante : 404 en JSON (et non du HTML)",
    inexistante.status === 404 && typeContenu.includes("application/json"),
    `${inexistante.status}, ${typeContenu}`,
  );
});

// ---------------------------------------------------------------------------
// 4. CORS : l'API n'est appelable que depuis le front autorise
// ---------------------------------------------------------------------------
await etape("CORS", async () => {
  const autorisee = await fetch(`${API}/api/musics`, {
    headers: { Origin: "http://localhost:5173" },
  });
  verifier(
    "CORS : l'origine du frontend est autorisee",
    autorisee.headers.get("access-control-allow-origin") === "http://localhost:5173",
  );

  const interdite = await fetch(`${API}/api/musics`, {
    headers: { Origin: "https://site-malveillant.example" },
  });
  verifier(
    "CORS : une origine inconnue n'obtient pas d'en-tete d'autorisation",
    interdite.headers.get("access-control-allow-origin") === null,
  );
});

// ---------------------------------------------------------------------------
// 6. Mot de passe oublie
//
// Cette fonctionnalite est un nid a failles. Les quatre pieges verrouilles ici :
//   a) l'enumeration de comptes (la reponse doit etre identique, compte existant ou non) ;
//   b) le jeton stocke en clair (il vaut un mot de passe : on garde son empreinte) ;
//   c) le jeton reutilisable (le mail reste dans la boite de reception) ;
//   d) le jeton sans expiration (un lien qui traine est un risque permanent).
// ---------------------------------------------------------------------------
await etape("mot de passe oublie", async () => {
  const crypto = await import("node:crypto");
  const { default: mysql } = await import("mysql2/promise");
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  const { cred } = await creerCompte("MotDePasseOublie");

  const demander = (email) =>
    fetch(`${API}/api/users/mot-de-passe-oublie`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ email }),
    });

  // --- a) enumeration de comptes ---
  const existant = await demander(cred.email);
  const corpsExistant = await existant.json();
  const inconnu = await demander("personne@nulle-part.invalid");
  const corpsInconnu = await inconnu.json();

  verifier(
    "mdp oublie : reponse IDENTIQUE que le compte existe ou non (anti-enumeration)",
    existant.status === inconnu.status &&
      corpsExistant.message === corpsInconnu.message,
    `${existant.status} vs ${inconnu.status}`,
  );

  // --- b) le jeton n'est pas stocke en clair ---
  const [[demande]] = await db.query(
    `SELECT r.token_hash FROM password_resets r
       JOIN users u ON u.id_user = r.id_user
      WHERE u.email = ? ORDER BY r.id_reset DESC LIMIT 1`,
    [cred.email],
  );
  verifier(
    "mdp oublie : le jeton est stocke sous forme d'empreinte, jamais en clair",
    /^[0-9a-f]{64}$/.test(demande.token_hash),
    demande.token_hash.slice(0, 16) + "…",
  );

  // On se donne un jeton connu (comme si on avait recu le mail).
  const jeton = crypto.randomBytes(32).toString("base64url");
  const empreinte = crypto.createHash("sha256").update(jeton).digest("hex");
  await db.query(
    "UPDATE password_resets SET token_hash = ? WHERE token_hash = ?",
    [empreinte, demande.token_hash],
  );

  const reinitialiser = (token, password) =>
    fetch(`${API}/api/users/reinitialiser-mot-de-passe`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ token, password }),
    });

  const jetonBidon = await reinitialiser("jeton-invente", "NouveauMdp2026");
  verifier(
    "mdp oublie : un jeton inconnu est refuse (400)",
    jetonBidon.status === 400,
    `recu ${jetonBidon.status}`,
  );

  const trop_court = await reinitialiser(jeton, "court");
  verifier(
    "mdp oublie : un mot de passe trop court est refuse cote serveur (400)",
    trop_court.status === 400,
    `recu ${trop_court.status}`,
  );

  const valide = await reinitialiser(jeton, "NouveauMdp2026");
  verifier(
    "mdp oublie : un jeton valide change le mot de passe (200)",
    valide.status === 200,
    `recu ${valide.status}`,
  );

  const ancien = await fetch(`${API}/api/users/connexion`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email: cred.email, password: cred.password }),
  });
  verifier(
    "mdp oublie : l'ancien mot de passe ne fonctionne plus",
    ancien.status !== 200,
    `recu ${ancien.status}`,
  );

  const nouveau = await fetch(`${API}/api/users/connexion`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email: cred.email, password: "NouveauMdp2026" }),
  });
  verifier(
    "mdp oublie : le nouveau mot de passe fonctionne (200)",
    nouveau.status === 200,
    `recu ${nouveau.status}`,
  );

  // --- c) usage unique ---
  const rejoue = await reinitialiser(jeton, "EncoreUnAutre2026");
  verifier(
    "mdp oublie : le jeton ne peut PAS resservir (400)",
    rejoue.status === 400,
    `recu ${rejoue.status}`,
  );

  const apresRejeu = await fetch(`${API}/api/users/connexion`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email: cred.email, password: "EncoreUnAutre2026" }),
  });
  verifier(
    "mdp oublie : le rejeu n'a pas change le mot de passe",
    apresRejeu.status !== 200,
    `recu ${apresRejeu.status}`,
  );

  // --- d) expiration ---
  await demander(cred.email);
  const jetonExpire = crypto.randomBytes(32).toString("base64url");
  const empreinteExpiree = crypto
    .createHash("sha256")
    .update(jetonExpire)
    .digest("hex");
  await db.query(
    `UPDATE password_resets
        SET token_hash = ?, expire_at = DATE_SUB(NOW(), INTERVAL 1 MINUTE)
      WHERE id_user = (SELECT id_user FROM users WHERE email = ?)
        AND used_at IS NULL`,
    [empreinteExpiree, cred.email],
  );

  const expire = await reinitialiser(jetonExpire, "ApresExpiration2026");
  verifier(
    "mdp oublie : un jeton expire est refuse (400)",
    expire.status === 400,
    `recu ${expire.status}`,
  );

  await db.end();
});

// ---------------------------------------------------------------------------
// 7. Brute-force : les tentatives de connexion sont limitees
//
// bcrypt protege les mots de passe SI la base fuite, mais n'empeche pas un script de tester
// des milliers de combinaisons via l'API.
//
// Ce test a besoin des limites ACTIVES. Or la suite e2e, qui cree plusieurs comptes, a besoin
// qu'elles soient desactivees (`RATE_LIMIT_DISABLED=1` dans backend/.env) pour ne pas se faire
// bloquer par ses propres protections. Les deux besoins sont incompatibles : on detecte donc
// la configuration et on ignore ce test si les limites sont coupees, plutot que de le faire
// echouer pour une raison qui n'est pas un bug.
// ---------------------------------------------------------------------------
if (limitesDesactivees) {
  console.log(
    "\n⚠️  Test anti brute-force IGNORE : les limites sont desactivees\n" +
      "   (RATE_LIMIT_DISABLED=1 dans backend/.env).\n" +
      "   Pour le jouer : retirer cette variable, redemarrer le backend, puis relancer.",
  );
} else {
  await etape("anti brute-force", async () => {
    const compte = await creerCompte("BruteForceTest");
    let bloque = false;

    for (let i = 0; i < 15; i++) {
      const reponse = await fetch(`${API}/api/users/connexion`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          email: compte.cred.email,
          password: `MauvaisMotDePasse${i}`,
        }),
      });
      if (reponse.status === 429) {
        bloque = true;
        break;
      }
    }

    verifier(
      "connexion : les tentatives repetees finissent bloquees (429)",
      bloque,
      bloque ? "" : "aucun 429 apres 15 tentatives ratees",
    );
  });
}

await nettoyerComptesDeTest();
rapport("TESTS DE SECURITE — API");
