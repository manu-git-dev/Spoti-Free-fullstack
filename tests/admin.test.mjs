// Tests de l'espace d'administration : statistiques, gestion des utilisateurs, catalogue.
//
// Le fil rouge : un admin a les droits que son role EXIGE, pas tous ceux qui sont techniquement
// possibles. On verifie donc autant ce qui est permis que ce qui est INTERDIT.
//
// Lancer : cd tests && npm run test:admin

import jwt from "jsonwebtoken";

import {
  API,
  creerCompte,
  apiAuth,
  verifier,
  etape,
  rapport,
  nettoyerComptesDeTest,
} from "./utils.mjs";

const tokenAdmin = () =>
  jwt.sign({ id_user: 10, email: "admin@admin.fr" }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });

const ID_ADMIN = 10;

// ---------------------------------------------------------------------------
// 1. Tout l'espace admin est ferme aux utilisateurs normaux
// ---------------------------------------------------------------------------
await etape("acces reserve", async () => {
  const { token } = await creerCompte("AdminAcces");
  const utilisateur = apiAuth(token);

  for (const chemin of ["/api/admin/stats", "/api/admin/utilisateurs"]) {
    const { reponse } = await utilisateur(chemin);
    verifier(
      `acces : ${chemin} refuse a un utilisateur normal (403)`,
      reponse.status === 403,
      `recu ${reponse.status}`,
    );
  }

  const sansToken = await fetch(`${API}/api/admin/stats`);
  verifier(
    "acces : /api/admin/stats refuse sans token (401)",
    sansToken.status === 401,
    `recu ${sansToken.status}`,
  );
});

// ---------------------------------------------------------------------------
// 2. Comptage des visites (route publique : les visiteurs non connectes comptent aussi)
// ---------------------------------------------------------------------------
await etape("comptage des visites", async () => {
  const admin = apiAuth(tokenAdmin());
  const { donnees: avant } = await admin("/api/admin/stats");

  const reponse = await fetch(`${API}/api/admin/visite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chemin: "/page-de-test" }),
  });
  verifier(
    "visite : la route est publique et repond 204",
    reponse.status === 204,
    `recu ${reponse.status}`,
  );

  const { donnees: apres } = await admin("/api/admin/stats");
  verifier(
    "visite : le compteur de pages vues augmente",
    apres.totaux.pagesVues30j > avant.totaux.pagesVues30j,
    `${avant.totaux.pagesVues30j} -> ${apres.totaux.pagesVues30j}`,
  );
});

// ---------------------------------------------------------------------------
// 3. Statistiques
// ---------------------------------------------------------------------------
await etape("statistiques", async () => {
  const admin = apiAuth(tokenAdmin());
  const { reponse, donnees } = await admin("/api/admin/stats");

  verifier("stats : l'admin y accede (200)", reponse.status === 200);

  const attendus = [
    "utilisateurs",
    "musiques",
    "playlists",
    "likes",
    "ecoutes",
    "depotsEnAttente",
    "visiteurs30j",
    "pagesVues30j",
  ];
  verifier(
    "stats : tous les totaux sont presents",
    attendus.every((cle) => typeof donnees.totaux[cle] === "number"),
    JSON.stringify(donnees.totaux),
  );

  verifier(
    "stats : les series temporelles et classements sont des tableaux",
    ["inscriptionsParJour", "visitesParJour", "topEcoutes", "topLikes", "pagesVues"].every(
      (cle) => Array.isArray(donnees[cle]),
    ),
  );
});

// ---------------------------------------------------------------------------
// 4. Utilisateurs : ce qu'on peut faire, et surtout ce qu'on NE PEUT PAS
// ---------------------------------------------------------------------------
await etape("gestion des utilisateurs", async () => {
  const admin = apiAuth(tokenAdmin());
  const { cred } = await creerCompte("AdminCible");

  const { donnees: utilisateurs } = await admin("/api/admin/utilisateurs");
  const cible = utilisateurs.find((u) => u.email === cred.email);

  // Le hash du mot de passe n'a aucune raison de sortir de la base.
  verifier(
    "utilisateurs : aucun mot de passe n'est expose",
    !JSON.stringify(utilisateurs).toLowerCase().includes("password"),
  );

  verifier(
    "utilisateurs : chaque compte remonte son activite",
    typeof cible.nb_playlists === "number" &&
      typeof cible.nb_likes === "number" &&
      typeof cible.nb_depots === "number",
  );

  // --- garde-fous : un admin ne doit pas pouvoir s'enfermer dehors ---
  const autoRetrogradation = await admin(
    `/api/admin/utilisateurs/${ID_ADMIN}/role`,
    { method: "PATCH", body: { role: "user" } },
  );
  verifier(
    "garde-fou : un admin ne peut pas retirer son propre role (409)",
    autoRetrogradation.reponse.status === 409,
    `recu ${autoRetrogradation.reponse.status}`,
  );

  const autoSuppression = await admin(`/api/admin/utilisateurs/${ID_ADMIN}`, {
    method: "DELETE",
  });
  verifier(
    "garde-fou : un admin ne peut pas supprimer son propre compte (409)",
    autoSuppression.reponse.status === 409,
    `recu ${autoSuppression.reponse.status}`,
  );

  // --- promotion / retrogradation ---
  const promotion = await admin(`/api/admin/utilisateurs/${cible.id_user}/role`, {
    method: "PATCH",
    body: { role: "admin" },
  });
  verifier(
    "utilisateurs : promotion en admin (200)",
    promotion.reponse.status === 200,
    `recu ${promotion.reponse.status}`,
  );

  const roleInvalide = await admin(
    `/api/admin/utilisateurs/${cible.id_user}/role`,
    { method: "PATCH", body: { role: "super-admin" } },
  );
  verifier(
    "utilisateurs : un role inconnu est refuse (400)",
    roleInvalide.reponse.status === 400,
    `recu ${roleInvalide.reponse.status}`,
  );

  const retrogradation = await admin(
    `/api/admin/utilisateurs/${cible.id_user}/role`,
    { method: "PATCH", body: { role: "user" } },
  );
  verifier(
    "utilisateurs : retrogradation possible tant qu'il reste un admin (200)",
    retrogradation.reponse.status === 200,
    `recu ${retrogradation.reponse.status}`,
  );

  // --- suppression ---
  const suppression = await admin(`/api/admin/utilisateurs/${cible.id_user}`, {
    method: "DELETE",
  });
  verifier(
    "utilisateurs : suppression d'un compte (200)",
    suppression.reponse.status === 200,
    `recu ${suppression.reponse.status}`,
  );

  const inexistant = await admin("/api/admin/utilisateurs/999999", {
    method: "DELETE",
  });
  verifier(
    "utilisateurs : supprimer un compte inexistant renvoie 404",
    inexistant.reponse.status === 404,
    `recu ${inexistant.reponse.status}`,
  );

  // Il n'existe AUCUNE route pour changer le pseudo, le nom ou l'email de quelqu'un : l'email
  // est l'identifiant de connexion, pouvoir le modifier reviendrait a pouvoir s'approprier un
  // compte.
  const editionIdentite = await fetch(
    `${API}/api/admin/utilisateurs/${ID_ADMIN}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenAdmin()}`,
      },
      body: JSON.stringify({ email: "pirate@example.com" }),
    },
  );
  verifier(
    "utilisateurs : aucune route ne permet de modifier l'email d'autrui (404)",
    editionIdentite.status === 404,
    `recu ${editionIdentite.status}`,
  );
});

// ---------------------------------------------------------------------------
// 5. Catalogue : modifier les metadonnees, sans jamais toucher aux fichiers
// ---------------------------------------------------------------------------
await etape("gestion du catalogue", async () => {
  const admin = apiAuth(tokenAdmin());
  const { donnees: musiques } = await admin("/api/musics");
  const cible = musiques[0];

  const modification = await admin(`/api/musics/update/${cible.id_music}`, {
    method: "PUT",
    body: { title: cible.title, artist: cible.artist, genre: "Genre de test" },
  });
  verifier(
    "catalogue : modification des metadonnees (200)",
    modification.reponse.status === 200,
    `recu ${modification.reponse.status}`,
  );

  // Le point critique : l'ancienne version faisait un UPDATE de TOUTES les colonnes. Un appel
  // qui n'envoie que le titre mettait donc `src_audio` et `src_image` a NULL — le morceau
  // devenait injouable, sa pochette cassee, en silence.
  const { donnees: apres } = await admin("/api/musics");
  const modifiee = apres.find((m) => m.id_music === cible.id_music);

  verifier(
    "catalogue : les fichiers ne sont PAS ecrases par une modification partielle",
    modifiee.src_audio === cible.src_audio &&
      modifiee.src_image === cible.src_image &&
      modifiee.duration === cible.duration,
    `audio=${modifiee.src_audio}, image=${modifiee.src_image}`,
  );

  // On restaure le genre d'origine.
  await admin(`/api/musics/update/${cible.id_music}`, {
    method: "PUT",
    body: { title: cible.title, artist: cible.artist, genre: cible.genre ?? "" },
  });

  const sansTitre = await admin(`/api/musics/update/${cible.id_music}`, {
    method: "PUT",
    body: { title: "", artist: "X" },
  });
  verifier(
    "catalogue : un titre vide est refuse (400)",
    sansTitre.reponse.status === 400,
    `recu ${sansTitre.reponse.status}`,
  );

  // Un utilisateur normal n'a evidemment aucun droit sur le catalogue.
  const { token } = await creerCompte("CatalogueIntrus");
  const intrus = apiAuth(token);
  const { reponse } = await intrus(`/api/musics/update/${cible.id_music}`, {
    method: "PUT",
    body: { title: "Pirate", artist: "Pirate" },
  });
  verifier(
    "catalogue : un utilisateur normal ne peut pas modifier un morceau (403)",
    reponse.status === 403,
    `recu ${reponse.status}`,
  );
});

// ---------------------------------------------------------------------------
// 6. Suppression d'un morceau : ne jamais effacer un fichier PARTAGE
//
// Les pochettes sont mutualisees (une meme image sert a plusieurs titres, et le depot en
// attribue une au hasard quand l'utilisateur n'en fournit pas). Supprimer un morceau ne doit
// donc pas casser l'affichage des autres.
// ---------------------------------------------------------------------------
await etape("suppression sans casser les fichiers partages", async () => {
  const { default: mysql } = await import("mysql2/promise");
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  // On cree deux morceaux qui PARTAGENT la meme pochette.
  const [[modele]] = await db.query(
    "SELECT src_audio, src_image FROM musics LIMIT 1",
  );

  const [insertion] = await db.query(
    `INSERT INTO musics (title, artist, genre, src_image, src_audio, duration)
     VALUES ('__admin-test-a', '__admin-test', 'Test', ?, ?, 60),
            ('__admin-test-b', '__admin-test', 'Test', ?, ?, 60)`,
    [modele.src_image, modele.src_audio, modele.src_image, modele.src_audio],
  );

  const idA = insertion.insertId;

  const admin = apiAuth(tokenAdmin());
  const suppression = await admin(`/api/musics/delete/${idA}`, {
    method: "DELETE",
  });
  verifier(
    "suppression : le morceau est retire (200)",
    suppression.reponse.status === 200,
    `recu ${suppression.reponse.status}`,
  );

  // Le fichier est encore utilise par l'autre morceau (et par le catalogue d'origine) :
  // il doit toujours etre servi.
  const fichier = await fetch(`${API}/${modele.src_image}`);
  verifier(
    "suppression : la pochette PARTAGEE n'a pas ete effacee",
    fichier.status === 200,
    `recu ${fichier.status} pour ${modele.src_image}`,
  );

  const audio = await fetch(`${API}/${modele.src_audio}`);
  verifier(
    "suppression : le fichier audio PARTAGE n'a pas ete efface",
    audio.status === 200,
    `recu ${audio.status}`,
  );

  await db.query("DELETE FROM musics WHERE artist = '__admin-test'");
  await db.end();
});

await nettoyerComptesDeTest();
rapport("TESTS — espace d'administration");
