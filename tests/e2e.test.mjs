// Tests de bout en bout des parcours utilisateur, joues dans un vrai navigateur (Playwright)
// contre l'application reellement demarree.
//
// Prerequis : MAMP (MySQL) demarre, backend sur :3000, frontend sur :5173.
// Lancer :   cd tests && npm install && npm run test:e2e

import { chromium } from "playwright";
import {
  APP,
  creerCompte,
  apiAuth,
  pageConnectee,
  verifier,
  etape,
  rapport,
  nettoyerComptesDeTest,
} from "./utils.mjs";

const BUREAU = { width: 1440, height: 900 };

const navigateur = await chromium.launch();
const erreursJS = [];

// ---------------------------------------------------------------------------
// 1. Inscription — dont la confirmation du mot de passe
// ---------------------------------------------------------------------------
await etape("inscription", async () => {
  const contexte = await navigateur.newContext({ viewport: BUREAU });
  const page = await contexte.newPage();
  page.on("pageerror", (e) => erreursJS.push(e.message));

  const email = `e2e-test+${Date.now()}@example.com`;
  const motDePasse = "MotDePasse123!";

  await page.goto(`${APP}/inscription`);
  await page.waitForTimeout(800);

  await page.fill('input[name="pseudo"]', "InscriptionTest");
  await page.fill('input[name="prenom"]', "Test");
  await page.fill('input[name="nom"]', "Auto");
  await page.fill('input[name="email"]', email);

  const champsMdp = page.locator('input[type="password"]');
  verifier(
    "inscription : un champ de confirmation du mot de passe existe",
    (await champsMdp.count()) === 2,
  );

  // Deux mots de passe differents : le compte ne doit PAS etre cree.
  await champsMdp.nth(0).fill(motDePasse);
  await champsMdp.nth(1).fill("PasLeMemeMotDePasse");
  await page.getByRole("button", { name: /inscri/i }).last().click();
  await page.waitForTimeout(1200);

  const { reponse } = await apiAuth("")(`/api/users/connexion`, {
    method: "POST",
    body: { email, password: motDePasse },
  });
  verifier(
    "inscription : deux mots de passe differents => compte non cree",
    reponse.status !== 200,
  );

  // Cette fois, les deux correspondent.
  await champsMdp.nth(1).fill(motDePasse);
  await page.getByRole("button", { name: /inscri/i }).last().click();
  await page.waitForTimeout(1500);

  const apres = await apiAuth("")(`/api/users/connexion`, {
    method: "POST",
    body: { email, password: motDePasse },
  });
  verifier("inscription : le compte est cree", apres.reponse.status === 200);

  await contexte.close();
});

// ---------------------------------------------------------------------------
// 2. Connexion, likes, favoris
// ---------------------------------------------------------------------------
await etape("likes et favoris", async () => {
  const compte = await creerCompte("LikesTest");
  const page = await pageConnectee(navigateur, compte, BUREAU);
  page.on("pageerror", (e) => erreursJS.push(e.message));

  await page.goto(`${APP}/bibliotheque`);
  await page.waitForTimeout(1300);

  await page.getByRole("button", { name: "Ajouter aux favoris" }).first().click();
  await page.waitForTimeout(1000);

  const toasts = await page.locator("[data-sonner-toast]").allInnerTexts();
  verifier(
    "like : un toast de succes s'affiche",
    toasts.some((t) => /succ/i.test(t)),
    JSON.stringify(toasts),
  );
  verifier(
    "like : le coeur devient plein",
    (await page.getByRole("button", { name: "Retirer des favoris" }).count()) === 1,
  );

  await page.getByRole("link", { name: "Favoris" }).click();
  await page.waitForTimeout(1300);
  verifier(
    "favoris : le titre like y apparait",
    (await page.locator('img[alt^="Pochette"]').count()) === 1,
  );

  await page.getByRole("button", { name: "Retirer des favoris" }).first().click();
  await page.waitForTimeout(1000);
  verifier(
    "unlike : le titre disparait des favoris",
    (await page.locator('img[alt^="Pochette"]').count()) === 0,
  );

  await page.context().close();
});

// ---------------------------------------------------------------------------
// 3. Non-regression : le bug des likes apres reconnexion
//
// Historique : les effets d'App.jsx lisaient localStorage avec `[]` en dependances. Ils ne se
// relancaient donc jamais apres une connexion, `musiquesLikee` restait vide, les coeurs des
// musiques deja likees s'affichaient vides, et recliquer dessus renvoyait une erreur.
// ---------------------------------------------------------------------------
await etape("non-regression : likes apres reconnexion (sans rechargement)", async () => {
  const compte = await creerCompte("ReconnexionTest");
  const api = apiAuth(compte.token);

  // L'utilisateur a deja like un titre lors d'une session precedente.
  const { donnees: musiques } = await api("/api/musics");
  const titre = musiques[0];
  await api(`/api/users/like/${titre.id_music}`, { method: "POST" });

  const contexte = await navigateur.newContext({ viewport: BUREAU });
  const page = await contexte.newPage();
  page.on("pageerror", (e) => erreursJS.push(e.message));

  // Parcours reel : on arrive deconnecte, on se connecte via le FORMULAIRE (navigation SPA,
  // aucun rechargement de page).
  await page.goto(`${APP}/connexion`);
  await page.waitForTimeout(900);
  await page.fill('input[name="email"]', compte.cred.email);
  await page.fill('input[type="password"]', compte.cred.password);
  await page.getByRole("button", { name: /^connexion$/i }).click();
  await page.waitForTimeout(1600);

  await page.getByRole("link", { name: "Bibliothèque" }).click();
  await page.waitForTimeout(1400);

  const pleins = await page.getByRole("button", { name: "Retirer des favoris" }).count();
  verifier(
    "reconnexion : les coeurs des titres deja likes sont pleins",
    pleins === 1,
    `${pleins} coeur(s) plein(s), 1 attendu`,
  );

  await contexte.close();
});

// ---------------------------------------------------------------------------
// 4. Playlists : creation, ajout, refus du doublon, duree affichee
// ---------------------------------------------------------------------------
await etape("playlists", async () => {
  const compte = await creerCompte("PlaylistTest");
  const page = await pageConnectee(navigateur, compte, BUREAU);
  page.on("pageerror", (e) => erreursJS.push(e.message));

  await page.goto(`${APP}/playlists`);
  await page.waitForTimeout(1300);

  await page.getByRole("button", { name: "Ajouter une playlist" }).click();
  await page.waitForTimeout(800);
  await page.fill('input[name="nom"]', "Playlist de test");
  await page.getByRole("button", { name: /^ajouter$/i }).click();
  await page.waitForTimeout(1400);

  verifier(
    "playlist : elle est creee",
    (await page.locator("main").innerText()).includes("Playlist de test"),
  );
  verifier(
    "playlist : elle apparait dans la sidebar",
    (await page.locator("aside").innerText()).includes("Playlist de test"),
  );

  // Ajout d'une musique
  await page.getByRole("link", { name: "Bibliothèque" }).click();
  await page.waitForTimeout(1300);
  const ajouter = async () => {
    await page.getByRole("button", { name: "Ajouter à une playlist" }).first().click();
    await page.waitForTimeout(900);
    await page.getByRole("combobox").click();
    await page.waitForTimeout(600);
    await page.getByRole("option", { name: "Playlist de test" }).click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: /^ajouter$/i }).click();
    await page.waitForTimeout(1400);
  };

  await ajouter();
  let toasts = await page.locator("[data-sonner-toast]").allInnerTexts();
  verifier(
    "playlist : la musique est ajoutee",
    toasts.some((t) => /succ/i.test(t)),
    JSON.stringify(toasts),
  );

  // Le meme titre une seconde fois : doit etre refuse avec un message clair (409 cote API).
  await ajouter();
  toasts = await page.locator("[data-sonner-toast]").allInnerTexts();
  verifier(
    "playlist : le doublon est refuse avec un message clair",
    toasts.some((t) => /déjà/i.test(t)),
    JSON.stringify(toasts),
  );
  await page.keyboard.press("Escape"); // la modale reste ouverte en cas d'erreur (voulu)
  await page.waitForTimeout(600);

  // Contenu de la playlist : la duree doit s'afficher (le SELECT du backend oubliait
  // `duration`, ce qui affichait "--:--").
  await page.locator("aside").getByText("Playlist de test").click();
  await page.waitForTimeout(1500);
  const contenu = await page.locator("main").innerText();
  verifier(
    "playlist : la duree des titres s'affiche",
    !contenu.includes("--:--"),
    contenu.includes("--:--") ? 'affiche "--:--"' : "",
  );

  await page.context().close();
});

// ---------------------------------------------------------------------------
// 5. Lecteur audio
// ---------------------------------------------------------------------------
await etape("lecteur", async () => {
  const compte = await creerCompte("LecteurTest");
  const page = await pageConnectee(navigateur, compte, BUREAU);
  page.on("pageerror", (e) => erreursJS.push(e.message));

  await page.goto(`${APP}/bibliotheque`);
  await page.waitForTimeout(1300);
  await page.getByText("Believer").first().click();
  await page.waitForTimeout(1800);

  verifier(
    "lecteur : un seul element <audio> dans le DOM",
    (await page.locator("audio").count()) === 1,
  );
  verifier(
    "lecteur : la lecture demarre",
    await page.locator("audio").evaluate((a) => !a.paused),
  );

  await page.getByRole("button", { name: /pause|lecture/i }).first().click();
  await page.waitForTimeout(600);
  verifier(
    "lecteur : le bouton pause fonctionne",
    await page.locator("audio").evaluate((a) => a.paused),
  );

  await page.context().close();
});

// ---------------------------------------------------------------------------
// 6. Top 5 : le compteur d'ecoutes fait remonter un titre
// ---------------------------------------------------------------------------
await etape("top 5", async () => {
  const compte = await creerCompte("TopTest");
  const api = apiAuth(compte.token);

  const { donnees: avant } = await api("/api/musics/top");
  const { donnees: musiques } = await api("/api/musics");

  // Un titre absent du Top 5 actuel.
  const idsTop = avant.map((m) => m.id_music);
  const candidat = musiques.find((m) => !idsTop.includes(m.id_music));
  const ecoutesRequises = (avant[0]?.play_count ?? 0) + 1;

  for (let i = 0; i < ecoutesRequises; i++) {
    await api(`/api/musics/ecoute/${candidat.id_music}`, { method: "POST" });
  }

  const { donnees: apres } = await api("/api/musics/top");
  verifier(
    "top 5 : un titre suffisamment ecoute prend la premiere place",
    apres[0]?.id_music === candidat.id_music,
    `1er = ${apres[0]?.title} (${apres[0]?.play_count} ecoutes)`,
  );

  // On remet le compteur de ce titre a zero pour ne pas fausser le classement reel.
  const { default: mysql } = await import("mysql2/promise");
  const { default: dotenv } = await import("dotenv");
  const path = await import("node:path");
  const url = await import("node:url");
  const ici = path.dirname(url.fileURLToPath(import.meta.url));
  dotenv.config({ path: path.join(ici, "..", "backend", ".env") });
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });
  await db.query("UPDATE musics SET play_count = ? WHERE id_music = ?", [
    candidat.play_count,
    candidat.id_music,
  ]);
  await db.end();
});

// ---------------------------------------------------------------------------
// 7. Visiteur non connecte
// ---------------------------------------------------------------------------
await etape("visiteur non connecte", async () => {
  const contexte = await navigateur.newContext({ viewport: BUREAU });
  const page = await contexte.newPage();
  page.on("pageerror", (e) => erreursJS.push(e.message));

  await page.goto(`${APP}/favoris`);
  await page.waitForTimeout(1300);
  verifier(
    "visiteur : /favoris affiche l'etat invite",
    (await page.locator("main").innerText()).toLowerCase().includes("connecte-toi"),
  );

  await page.goto(`${APP}/playlists/1`);
  await page.waitForTimeout(1300);
  verifier(
    "visiteur : le contenu d'une playlist est protege (redirection)",
    new URL(page.url()).pathname !== "/playlists/1",
    page.url(),
  );

  await contexte.close();
});

// ---------------------------------------------------------------------------
// 8. Session expiree : un 401 sur une action isolee purge la session
// ---------------------------------------------------------------------------
await etape("session expiree", async () => {
  const compte = await creerCompte("SessionTest");
  const page = await pageConnectee(navigateur, compte, BUREAU);

  await page.goto(`${APP}/bibliotheque`);
  await page.waitForTimeout(1400);

  // On corrompt le token en cours de session, sans rechargement : l'app se croit connectee.
  await page.evaluate(() => localStorage.setItem("token", "token.invalide"));

  await page.getByRole("button", { name: "Ajouter aux favoris" }).first().click();
  await page.waitForTimeout(1500);

  verifier(
    "session expiree : la session est purgee automatiquement",
    (await page.evaluate(() => localStorage.getItem("token"))) === null,
  );

  const toasts = await page.locator("[data-sonner-toast]").allInnerTexts();
  verifier(
    "session expiree : un seul message, comprehensible (pas 'Token invalide')",
    toasts.length === 1 && /session/i.test(toasts[0]),
    JSON.stringify(toasts),
  );

  await page.context().close();
});

// ---------------------------------------------------------------------------
// 9. Mise en page : l'app ne doit jamais depasser la hauteur de l'ecran
// ---------------------------------------------------------------------------
await etape("mise en page : l'app tient dans l'ecran", async () => {
  const compte = await creerCompte("LayoutTest");
  const api = apiAuth(compte.token);

  // Beaucoup de playlists : c'est ce qui faisait grandir l'Aside (grid `1fr` = `minmax(auto,1fr)`).
  for (let i = 1; i <= 15; i++) {
    await api("/api/playlists/ajouter", { method: "POST", body: { nom: `Playlist ${i}` } });
  }

  for (const [nom, viewport] of [
    ["1440x900", { width: 1440, height: 900 }],
    ["1280x720", { width: 1280, height: 720 }],
  ]) {
    const page = await pageConnectee(navigateur, compte, viewport);
    await page.goto(APP);
    await page.waitForTimeout(1800);

    const mesures = await page.evaluate(() => ({
      deborde: document.documentElement.scrollHeight > window.innerHeight,
      listeScrolle: (() => {
        const ul = document.querySelector("aside ul");
        return ul ? ul.scrollHeight > ul.clientHeight + 2 : false;
      })(),
    }));

    verifier(
      `mise en page (${nom}) : la page ne depasse pas l'ecran`,
      !mesures.deborde,
    );
    verifier(
      `mise en page (${nom}) : la liste des playlists scrolle en interne`,
      mesures.listeScrolle,
    );

    await page.context().close();
  }
});

await navigateur.close();

verifier(
  "aucune erreur JavaScript dans la console",
  erreursJS.length === 0,
  erreursJS.length ? [...new Set(erreursJS)].join(" | ") : "",
);

await nettoyerComptesDeTest();
rapport("TESTS DE BOUT EN BOUT — parcours utilisateur");
