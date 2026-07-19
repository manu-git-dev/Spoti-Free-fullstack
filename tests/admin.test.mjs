// Tests de l'espace d'administration : statistiques, gestion des utilisateurs, catalogue.
//
// Le fil rouge : un admin a les droits que son role EXIGE, pas tous ceux qui sont techniquement
// possibles. On verifie donc autant ce qui est permis que ce qui est INTERDIT.
//
// Lancer : cd tests && npm run test:admin

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

import {
  API,
  creerCompte,
  creerAdmin,
  apiAuth,
  verifier,
  etape,
  rapport,
  nettoyerComptesDeTest,
} from "./utils.mjs";

const ICI = path.dirname(url.fileURLToPath(import.meta.url));
const FIXTURES = path.join(ICI, "fixtures");
const DOSSIER_UPLOADS = path.join(ICI, "..", "backend", "uploads");

// Memes fixtures que la suite depot : un vrai MP3 silencieux et une vraie image, libres de droits
// et versionnes (pas de dependance a `backend/public/`, gitignore).
const VRAI_MP3 = fs.readFileSync(path.join(FIXTURES, "audio-test.mp3"));
const VRAIE_IMAGE = fs.readFileSync(path.join(FIXTURES, "pochette-test.jpg"));

// Un VRAI compte admin, cree pour ces tests puis supprime avec les autres.
//
// Avant, on forgeait un jeton pour `id_user: 10` / `admin@admin.fr` — un compte qui n'existait que
// dans la base de developpement de cette machine. Sur une base neuve (la CI), `adminMiddleware` ne
// trouvait personne et repondait 403 : les tests etaient injouables ailleurs.
//
// Ironie : `admin@admin.fr` est justement le compte que `DEPLOIEMENT.md` demande de PURGER avant
// la mise en production. Ces tests auraient donc casse le jour de la purge.
const { token: JETON_ADMIN, user: ADMIN } = await creerAdmin("AdminTest");

const tokenAdmin = () => JETON_ADMIN;
const ID_ADMIN = ADMIN.id_user;

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
    body: {
      title: cible.title,
      artist: cible.artist,
      genre: "Genre de test",
      licence: cible.licence,
      sourceUrl: cible.source_url ?? "",
    },
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
    body: {
      title: cible.title,
      artist: cible.artist,
      genre: cible.genre ?? "",
      licence: cible.licence,
      sourceUrl: cible.source_url ?? "",
    },
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

  // `licence` et `licence_url` sont en NOT NULL sans valeur par defaut : ce test ecrit en SQL
  // direct, donc il doit les fournir lui-meme (l'API, elle, derive l'URL du code de licence).
  // C'est le NOT NULL qui joue son role — il rend impossible de creer un morceau sans licence,
  // y compris depuis une fixture de test.
  const [insertion] = await db.query(
    `INSERT INTO musics (title, artist, genre, src_image, src_audio, duration, licence, licence_url)
     VALUES ('__admin-test-a', '__admin-test', 'Test', ?, ?, 60, 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/'),
            ('__admin-test-b', '__admin-test', 'Test', ?, ?, 60, 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/')`,
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

// ---------------------------------------------------------------------------
// 7. Supprimer un utilisateur nettoie ses fichiers de depot EN ATTENTE
//
// Test de NON-REGRESSION. Deux chemins suppriment un utilisateur et menent au meme etat (compte
// + `submissions` effaces en cascade) : l'auto-suppression (`DELETE /api/users/mon-compte`) et la
// suppression par un admin (`DELETE /api/admin/utilisateurs/:id`). La cascade SQL efface les
// LIGNES, jamais les fichiers sur le disque — il faut donc les nettoyer a la main.
//
// L'auto-suppression le faisait deja ; la suppression admin, elle, faisait un simple DELETE et
// laissait les fichiers orphelins dans uploads/. Le fix extrait ce nettoyage dans une fonction
// partagee (`nettoyerDepotsEnAttente`, src/depots.js) appelee par les DEUX routes. Avant le fix,
// la derniere assertion de ce test echouait (les fichiers survivaient a la suppression du compte).
// ---------------------------------------------------------------------------
await etape("suppression admin : nettoie les depots en attente du compte", async () => {
  const { token, user } = await creerCompte("AdminDeposant");

  // Le deposant depose un vrai morceau -> une submission `en_attente` avec 2 fichiers dans uploads/.
  const formulaire = new FormData();
  formulaire.append("title", "Depot a nettoyer");
  formulaire.append("artist", "Deposant");
  formulaire.append("licence", "CC BY 4.0");
  formulaire.append("droitsConfirmes", "true");
  formulaire.append("audio", new Blob([VRAI_MP3]), "morceau.mp3");
  formulaire.append("image", new Blob([VRAIE_IMAGE]), "cover.jpg");

  const depot = await fetch(`${API}/api/submissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formulaire,
  });
  verifier(
    "depot en attente : cree pour le test (201)",
    depot.status === 201,
    `recu ${depot.status}`,
  );

  // On lit les NOMS des fichiers en base (l'API ne les expose pas, c'est voulu), pour verifier
  // ensuite leur presence puis leur disparition sur le disque.
  const { default: mysql } = await import("mysql2/promise");
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });
  const [[ligne]] = await db.query(
    "SELECT fichier_audio, fichier_image FROM submissions WHERE id_user = ? AND statut = 'en_attente'",
    [user.id_user],
  );
  await db.end();

  const cheminAudio = path.join(DOSSIER_UPLOADS, ligne.fichier_audio);
  const cheminImage = path.join(DOSSIER_UPLOADS, ligne.fichier_image);

  verifier(
    "depot en attente : les 2 fichiers sont sur le disque avant suppression",
    fs.existsSync(cheminAudio) && fs.existsSync(cheminImage),
    `audio=${fs.existsSync(cheminAudio)}, image=${fs.existsSync(cheminImage)}`,
  );

  const admin = apiAuth(tokenAdmin());
  const suppression = await admin(`/api/admin/utilisateurs/${user.id_user}`, {
    method: "DELETE",
  });
  verifier(
    "suppression : l'admin supprime le compte du deposant (200)",
    suppression.reponse.status === 200,
    `recu ${suppression.reponse.status}`,
  );

  // LE point du test : les fichiers en attente ne survivent PAS a la suppression du compte.
  verifier(
    "suppression : les fichiers du depot en attente sont effaces du disque",
    !fs.existsSync(cheminAudio) && !fs.existsSync(cheminImage),
    `audio existe encore=${fs.existsSync(cheminAudio)}, image existe encore=${fs.existsSync(cheminImage)}`,
  );
});

await nettoyerComptesDeTest();
rapport("TESTS — espace d'administration");
