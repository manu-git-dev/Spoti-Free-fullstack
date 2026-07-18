// Tests de bout en bout des parcours utilisateur, joues dans un vrai navigateur (Playwright)
// contre l'application reellement demarree.
//
// Prerequis : MAMP (MySQL) demarre, backend sur :3000, frontend sur :5173.
// Lancer :   cd tests && npm install && npm run test:e2e

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

import { chromium } from "playwright";
import {
  APP,
  creerCompte,
  creerAdmin,
  apiAuth,
  pageConnectee,
  verifier,
  etape,
  rapport,
  nettoyerComptesDeTest,
} from "./utils.mjs";

const ICI = path.dirname(url.fileURLToPath(import.meta.url));
const BUREAU = { width: 1440, height: 900 };

const navigateur = await chromium.launch();
const erreursJS = [];

/**
 * Efface les fichiers deposes par un compte de test, dans `backend/uploads/`.
 *
 * A appeler AVANT `nettoyerComptesDeTest` : la suppression du compte fait disparaitre la ligne
 * `submissions` (cle etrangere ON DELETE CASCADE), donc le nom du fichier avec elle.
 */
async function supprimerFichiersDeposes(idUser) {
  const { default: mysql } = await import("mysql2/promise");
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  const [depots] = await db.query(
    `SELECT fichier_audio, fichier_image FROM submissions
      WHERE id_user = ? AND statut = 'en_attente'`,
    [idUser],
  );
  await db.end();

  const dossier = path.join(ICI, "..", "backend", "uploads");
  for (const depot of depots) {
    for (const nom of [depot.fichier_audio, depot.fichier_image]) {
      if (!nom) continue;
      try {
        fs.unlinkSync(path.join(dossier, nom));
      } catch (erreur) {
        // On n'ignore QUE "le fichier n'existe pas" (ENOENT) : tout autre echec (chemin
        // faux, permission...) doit remonter plutot que d'etre avale en silence.
        if (erreur.code !== "ENOENT") throw erreur;
      }
    }
  }
}

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

    // --- Non-regression : la modale « Ajouter a une playlist » (bugs signales le 2026-07-17) ---
    //
    // Ces deux verifications vivent ICI, au milieu du parcours, parce que le decor y est deja.
    // Et surtout : ce test PASSAIT alors que les deux bugs etaient la. Il ouvrait la modale,
    // choisissait l'option et validait — il exercait tout le chemin sans jamais regarder ce que
    // l'ECRAN montrait. Une modale qui marche n'est pas une modale qui s'affiche.

    // 1. Le popup ne doit pas RECOUVRIR le champ. Par defaut, Base UI aligne l'option
    //    selectionnee sur le declencheur : la liste venait se poser dessus et on ne voyait plus
    //    du tout le champ qu'on remplissait.
    const chevauchement = await page.evaluate(() => {
      const champ = document
        .querySelector('[data-slot="select-trigger"]')
        .getBoundingClientRect();
      const popup = document
        .querySelector('[data-slot="select-content"]')
        .getBoundingClientRect();
      return Math.round(
        Math.max(0, Math.min(champ.bottom, popup.bottom) - Math.max(champ.top, popup.top)),
      );
    });
    verifier(
      "playlist : la liste deroulante ne recouvre pas le champ",
      chevauchement === 0,
      `${chevauchement} px de recouvrement`,
    );

    await page.getByRole("option", { name: "Playlist de test" }).click();
    await page.waitForTimeout(400);

    // 2. Le champ doit afficher le NOM, pas l'identifiant. `<Select.Value>` rend la valeur brute
    //    tant qu'on ne lui donne pas la table `items` — et la valeur, c'est `id_playlist`. On
    //    choisissait « Playlist de test » et le champ affichait « 1332 ».
    const affiche = (await page.getByRole("combobox").innerText()).trim();
    verifier(
      "playlist : le champ affiche le NOM choisi, pas son identifiant",
      affiche === "Playlist de test",
      `affiche ${JSON.stringify(affiche)}`,
    );

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

  // On clique le PREMIER morceau de la liste, quel qu'il soit.
  //
  // Ce test cliquait sur « Believer » — un titre du catalogue de demonstration. Le jour ou ce
  // catalogue a ete remplace par de vraies oeuvres libres, le test s'est mis a chercher pendant
  // 30 secondes un texte qui n'existait plus, puis a echouer sur un timeout illisible qui ne
  // disait rien de la vraie cause.
  //
  // C'est la meme lecon que la note 55 : un test ne doit RIEN supposer du contenu de la base. Le
  // lecteur se teste avec n'importe quel morceau — le titre du premier n'a aucune importance.
  // On vise la pochette : son `alt` suit un motif stable ("Pochette album <titre>"), et elle vit
  // DANS la zone cliquable de la ligne — le clic remonte donc au bon gestionnaire.
  await page
    .getByAltText(/^Pochette album /)
    .first()
    .click({ timeout: 5000 });
  await page.waitForTimeout(1800);

  verifier(
    "lecteur : un seul element <audio> dans le DOM",
    (await page.locator("audio").count()) === 1,
  );
  verifier(
    "lecteur : la lecture demarre",
    await page.locator("audio").evaluate((a) => !a.paused),
  );

  // Nom EXACT (`^...$`) : depuis l'ajout du shuffle, le bouton « Lecture aléatoire » contient
  // « lecture » et matchait un motif non ancre — `.first()` cliquait le shuffle au lieu du
  // play/pause. On ne veut que le bouton dont le nom accessible est exactement "Pause"/"Lecture".
  await page
    .getByRole("button", { name: /^(pause|lecture)$/i })
    .first()
    .click();
  await page.waitForTimeout(600);
  verifier(
    "lecteur : le bouton pause fonctionne",
    await page.locator("audio").evaluate((a) => a.paused),
  );

  // -------------------------------------------------------------------------
  // LES CURSEURS — la partie qui manquait, et qui a laisse passer trois bugs.
  //
  // Ce test ne verifiait que Play/Pause. Or volume et progression etaient MORTS :
  //
  //   1. `onValueChange={([x]) => ...}` destructurait un tableau, alors que Base UI rend un
  //      NOMBRE pour une valeur unique. « number 18 is not iterable » a chaque mouvement : le
  //      gestionnaire mourait avant d'agir, sans que l'utilisateur voie autre chose qu'un
  //      curseur qui ne bouge pas.
  //   2. `<audio volume={...}>` posait un ATTRIBUT HTML, alors que le volume est une PROPRIETE
  //      du DOM. Le curseur affichait 50 %, le son sortait a 100 %.
  //   3. Le wrapper `slider.jsx` dessinait DEUX poignees pour une valeur unique : la navigation
  //      au clavier donnait le focus a une poignee fantome bloquee sur `min`.
  //
  // La verification « aucune erreur JS » de fin de fichier ne les a pas vus non plus : elle ne
  // peut attraper que les erreurs de ce qu'on EXERCE. Un test qui ne touche pas a un curseur ne
  // prouve rien sur ce curseur.
  //
  // On passe par le clavier, pas par le glisser : c'est deterministe, et c'est aussi la seule
  // facon d'utiliser le lecteur sans souris. La poignee est un <div> NON focusable qui contient
  // un <input type="range"> — c'est lui qu'il faut viser.
  // -------------------------------------------------------------------------
  const poignees = page.locator('[data-slot="slider-thumb"]');
  verifier(
    "lecteur : une seule poignee par curseur (volume + progression = 2)",
    (await poignees.count()) === 2,
    `${await poignees.count()} poignees`,
  );

  const entrees = page.locator('[data-slot="slider-thumb"] input[type="range"]');

  const volumeAvant = await page.locator("audio").evaluate((a) => a.volume);
  await entrees.first().focus();
  for (let i = 0; i < 10; i += 1) await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(500);
  const volumeApres = await page.locator("audio").evaluate((a) => a.volume);

  verifier(
    "lecteur : le curseur de volume change REELLEMENT le volume de l'audio",
    volumeApres < volumeAvant,
    `${volumeAvant} -> ${volumeApres}`,
  );

  // On repart de zero : la piste peut avoir avance, voire s'etre terminee.
  await page.locator("audio").evaluate((a) => {
    a.currentTime = 0;
  });
  await page.waitForTimeout(200);

  await entrees.nth(1).focus();
  for (let i = 0; i < 5; i += 1) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(500);
  const tempsApres = await page.locator("audio").evaluate((a) => a.currentTime);

  // La lecture est en pause : seul le curseur peut avoir fait bouger le temps.
  //
  // On verifie un DEPLACEMENT, pas un nombre de secondes : en CI, les morceaux sont les mp3 de
  // test de `preparer-medias.mjs` — 2 SECONDES de silence. Un `> tempsAvant + 5` passerait ici
  // (le vrai catalogue fait des morceaux de 2 a 8 minutes) et echouerait la-bas, faute de
  // secondes a parcourir. C'est exactement le piege de la note 55.
  verifier(
    "lecteur : la barre de progression deplace REELLEMENT la lecture",
    tempsApres > 0,
    `0s -> ${tempsApres.toFixed(2)}s`,
  );

  // -------------------------------------------------------------------------
  // Cliquer SUR LE RAIL, a cote du centre.
  //
  // Le geste le plus naturel avec une barre de progression — cliquer la ou on veut aller — ne
  // marchait qu'une fois sur trois. Le `Control` (l'element qui capte les clics) n'avait aucune
  // hauteur propre : il se reduisait a celle du trait, soit QUATRE pixels. Mesure faite a
  // l'epoque : a 3 px du centre, le clic etait deja perdu.
  //
  // On clique donc volontairement DE TRAVERS (6 px sous le milieu) : au centre, le test aurait
  // passe meme avec la bande de 4 px, et n'aurait donc rien prouve.
  // -------------------------------------------------------------------------
  const barre = page.locator('[data-slot="slider"]').nth(1);
  const boite = await barre.boundingBox();

  verifier(
    "lecteur : le rail offre une zone cliquable visable (>= 16 px)",
    boite.height >= 16,
    `${Math.round(boite.height)} px de haut`,
  );

  await page.locator("audio").evaluate((a) => {
    a.currentTime = 0;
  });
  await page.waitForTimeout(300);
  await page.mouse.click(
    boite.x + boite.width * 0.6,
    boite.y + boite.height / 2 + 6,
  );
  await page.waitForTimeout(500);

  // On mesure une PROPORTION, pas des secondes : cliquer a 60 % de la barre doit poser la lecture
  // vers 60 % du morceau, qu'il dure 2 secondes (les mp3 de test de la CI) ou 8 minutes (le vrai
  // catalogue). Une assertion en secondes ne vaudrait que sur la machine qui l'a vue passer.
  //
  // La fenetre est LARGE, et volontairement : le pas du curseur est d'une seconde. Sur un morceau
  // de 2 secondes, il n'a donc que trois positions possibles — un clic a 60 % arrondit a 1 s,
  // soit 48 %. La precision proportionnelle est physiquement impossible sur un morceau court, et
  // ce n'est pas ce qu'on teste : on teste que le clic est PRIS EN COMPTE hors du centre du rail.
  // La zone cliquable, elle, est verifiee juste au-dessus, en pixels et sans dependre de la duree.
  const positionRelative = await page
    .locator("audio")
    .evaluate((a) => (a.duration ? a.currentTime / a.duration : 0));
  verifier(
    "lecteur : un clic HORS du centre du rail deplace la lecture (~60 %)",
    positionRelative > 0.3 && positionRelative < 0.85,
    `${Math.round(positionRelative * 100)} % du morceau apres un clic a 60 %`,
  );

  // -------------------------------------------------------------------------
  // Le contenu du lecteur tient DANS sa carte.
  //
  // La carte a une hauteur imposee par la grille de l'app (`grid-rows-[...104px]`) : son contenu
  // ne peut donc pas la faire grandir, il DEBORDE. C'est arrive deux fois dans la meme journee —
  // en ajoutant la ligne d'attribution, puis en agrandissant la zone cliquable du rail : la barre
  // de progression sortait sous la carte, posee sur le fond de la page.
  //
  // Le test « l'app tient dans l'ecran » ne le voyait pas : le debordement restait DANS la
  // fenetre, il sortait seulement du panneau. Une capture d'ecran non plus — il faut savoir ou
  // regarder. `scrollHeight > clientHeight` le dit, lui, sans ambiguite.
  // -------------------------------------------------------------------------
  const debordement = await page.evaluate(() => {
    const hauteur = (el) => el.getBoundingClientRect().height;
    // Le lecteur a deux blocs (mobile et bureau) ; seul l'un des deux est affiche.
    const carte = [
      ...document.querySelector("audio").closest("section").querySelectorAll(".bg-card"),
    ].find((c) => hauteur(c) > 0);

    return carte.scrollHeight - carte.clientHeight;
  });

  verifier(
    "lecteur : le contenu ne deborde pas de la carte",
    debordement <= 0,
    `deborde de ${debordement} px`,
  );

  await page.context().close();
});

// ---------------------------------------------------------------------------
// 5 ter. Shuffle et repeat (verrouille #17)
//
// Le piege du hasard : on ne teste PAS une sequence precise (elle change a chaque tirage), mais
// l'INVARIANT — « les N titres passent tous une fois avant repetition ». La taille de la file
// vient de l'API (/api/musics/top), pas du DOM : on lance depuis le Top de l'accueil, dont la file
// EST ce classement.
// ---------------------------------------------------------------------------
await etape("lecteur : shuffle et repeat", async () => {
  const compte = await creerCompte("ShuffleTest");
  const page = await pageConnectee(navigateur, compte, BUREAU);
  page.on("pageerror", (e) => erreursJS.push(e.message));

  // `/api/musics/top` renvoie le tableau DIRECTEMENT (res.json(top)), pas enveloppe dans `{donnees}`.
  const { donnees: top } = await apiAuth(compte.token)("/api/musics/top");
  const tailleFile = top.length;

  await page.goto(`${APP}/`);
  await page.waitForTimeout(1500);
  await page.getByAltText(/^Pochette album /).first().click({ timeout: 5000 });
  await page.waitForTimeout(1500);

  const srcAudio = () => page.locator("audio").getAttribute("src");
  const srcAvant = await srcAudio();

  // Activer l'aleatoire ne doit pas COUPER le titre en cours : il reste en tete de sequence.
  await page.getByRole("button", { name: /aléatoire/i }).first().click();
  await page.waitForTimeout(400);
  verifier(
    "shuffle : activer l'aleatoire ne coupe pas le titre en cours",
    (await srcAudio()) === srcAvant,
  );

  // Les `tailleFile` premiers titres doivent etre TOUS DIFFERENTS (chacun une fois). Le clic
  // suivant remelange — c'est seulement la qu'un doublon serait permis, donc on ne va pas jusque-la.
  const vus = [srcAvant];
  for (let i = 0; i < tailleFile - 1; i += 1) {
    await page.getByRole("button", { name: /^titre suivant$/i }).first().click();
    await page.waitForTimeout(500);
    vus.push(await srcAudio());
  }
  verifier(
    "shuffle : les N titres passent tous une fois avant repetition",
    new Set(vus).size === tailleFile && vus.length === tailleFile,
    `${new Set(vus).size} titres distincts sur ${tailleFile}`,
  );

  // --- REPEAT : la machine a trois etats off -> all -> one -> off ---
  // Les trois libelles commencent par « Répét… » : c'est le seul bouton du transport qui matche,
  // et son nom accessible change a chaque etat — on le relit apres chaque clic.
  const boutonRepeat = page.getByRole("button", { name: /Répét/i }).first();
  const etatRepeat = () => boutonRepeat.getAttribute("aria-label");

  verifier(
    "repeat : etat initial = desactive",
    /désactiv/i.test(await etatRepeat()),
    await etatRepeat(),
  );
  await boutonRepeat.click();
  await page.waitForTimeout(150);
  verifier(
    "repeat : 1er clic = repeter la file",
    /répéter la file/i.test(await etatRepeat()),
    await etatRepeat(),
  );
  await boutonRepeat.click();
  await page.waitForTimeout(150);
  verifier(
    "repeat : 2e clic = repeter le titre courant",
    /titre courant/i.test(await etatRepeat()),
    await etatRepeat(),
  );
  await boutonRepeat.click();
  await page.waitForTimeout(150);
  verifier(
    "repeat : 3e clic = retour a desactive",
    /désactiv/i.test(await etatRepeat()),
    await etatRepeat(),
  );

  await page.context().close();
});

// ---------------------------------------------------------------------------
// 5 quater. Le lecteur plein ecran sur mobile (verrouille le flux mini -> plein ecran)
//
// Le mini-lecteur (barre compacte) doit rester minimal : taper la pochette/titre OUVRE l'ecran
// « Lecture en cours », mais taper play/pause met seulement en pause — c'est pourquoi les deux
// sont des boutons FRERES et non un <div> cliquable englobant. Le chevron referme. Le chevron
// (« Réduire le lecteur ») n'existe QUE dans le plein ecran : sa visibilite = l'ecran est ouvert.
// ---------------------------------------------------------------------------
await etape("lecteur : plein ecran mobile", async () => {
  const compte = await creerCompte("MobileTest");
  const page = await pageConnectee(navigateur, compte, { width: 390, height: 844 });
  page.on("pageerror", (e) => erreursJS.push(e.message));

  await page.goto(`${APP}/bibliotheque`);
  await page.waitForTimeout(1500);
  await page.getByAltText(/^Pochette album /).first().click({ timeout: 5000 });
  await page.waitForTimeout(1500);

  const chevron = page.getByRole("button", { name: /réduire le lecteur/i });

  // 1) Taper play/pause dans la mini-barre : met en pause SANS ouvrir le plein ecran.
  await page.getByRole("button", { name: /^(pause|lecture)$/i }).first().click();
  await page.waitForTimeout(400);
  verifier(
    "mobile : taper play/pause met en pause",
    await page.locator("audio").evaluate((a) => a.paused),
  );
  verifier(
    "mobile : taper play/pause n'ouvre PAS le plein ecran",
    (await chevron.isVisible()) === false,
  );

  // 2) Taper la pochette/titre (« Ouvrir le lecteur ») ouvre le plein ecran, transport complet.
  await page.getByRole("button", { name: /ouvrir le lecteur/i }).click();
  await page.waitForTimeout(600);
  verifier("mobile : taper la barre ouvre le plein ecran", await chevron.isVisible());

  const precedentVisible = await page
    .getByRole("button", { name: /^titre précédent$/i })
    .evaluateAll((els) =>
      els.some((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }),
    );
  verifier(
    "mobile : le plein ecran offre le transport complet (titre precedent visible)",
    precedentVisible,
  );

  // 3) Le chevron referme et revient a la mini-barre.
  await chevron.click();
  await page.waitForTimeout(600);
  verifier(
    "mobile : le chevron referme le plein ecran",
    (await chevron.isVisible()) === false,
  );

  await page.context().close();
});

// ---------------------------------------------------------------------------
// 5 quinquies. Historique d'ecoute — « Écoutés récemment » (verrouille l'upsert par-compte)
//
// Modele UPSERT (option B, tranche le 2026-07-18) : une ligne par (utilisateur, titre), remise en
// tete a chaque re-ecoute. On verrouille : titres DISTINCTS, le plus recent en tete, re-ecouter ne
// cree pas de doublon. Le tri est en secondes (colonne `datetime`) -> on espace les ecoutes de
// +1s pour un ordre deterministe.
// ---------------------------------------------------------------------------
await etape("historique : ecoutes recemment", async () => {
  // --- Backend : l'upsert (distinct, plus recent en tete, pas de doublon) ---
  const compte = await creerCompte("HistoTest");
  const api = apiAuth(compte.token);
  const pause = () => new Promise((r) => setTimeout(r, 1100));

  const { donnees: catalogue } = await api("/api/musics");
  const [id1, id2] = [catalogue[0].id_music, catalogue[1].id_music];

  const { donnees: initial } = await api("/api/users/historique");
  verifier(
    "historique : un compte neuf a un historique vide",
    initial.length === 0,
    `${initial.length} entree(s)`,
  );

  await api(`/api/users/historique/${id1}`, { method: "POST" });
  await pause();
  await api(`/api/users/historique/${id2}`, { method: "POST" });
  const { donnees: apres2 } = await api("/api/users/historique");
  verifier(
    "historique : le plus recemment ecoute est en tete",
    apres2.length === 2 && apres2[0].id_music === id2 && apres2[1].id_music === id1,
    apres2.map((m) => m.id_music).join(", "),
  );

  // Re-ecouter id1 : il repasse en tete, SANS creer de doublon (c'est l'upsert, pas un journal).
  await pause();
  await api(`/api/users/historique/${id1}`, { method: "POST" });
  const { donnees: apresReecoute } = await api("/api/users/historique");
  verifier(
    "historique : re-ecouter un titre le remet en tete sans doublon",
    apresReecoute.length === 2 && apresReecoute[0].id_music === id1,
    apresReecoute.map((m) => m.id_music).join(", "),
  );

  // --- Front : jouer un titre (compte NEUF) fait apparaitre la rangee sur l'accueil ---
  // Compte neuf a dessein : la rangee qui apparait PROUVE que le front enregistre l'ecoute (effet
  // de App), pas seulement que l'API l'avait peuplee ci-dessus.
  const compteUI = await creerCompte("HistoUITest");
  const page = await pageConnectee(navigateur, compteUI, BUREAU);
  page.on("pageerror", (e) => erreursJS.push(e.message));

  await page.goto(`${APP}/`);
  await page.waitForTimeout(1200);
  verifier(
    "historique : absente de l'accueil tant qu'on n'a rien ecoute",
    (await page.getByText(/écoutés récemment/i).isVisible()) === false,
  );

  await page.goto(`${APP}/bibliotheque`);
  await page.waitForTimeout(1300);
  await page.getByAltText(/^Pochette album /).first().click({ timeout: 5000 });
  await page.waitForTimeout(1800);
  await page.goto(`${APP}/`);
  await page.waitForTimeout(1500);
  verifier(
    "historique : « Écoutés récemment » apparait sur l'accueil apres une ecoute",
    await page.getByText(/écoutés récemment/i).isVisible(),
  );

  await page.context().close();
});

// ---------------------------------------------------------------------------
// 5 bis. Le filtre par genre
//
// Les pastilles sont DEDUITES du catalogue (aucune liste en dur), donc ce test ne peut pas
// nommer un genre precis sans redevenir dependant du seed — c'est le piege de « Believer ».
// Il prend donc la premiere pastille venue et verifie le COMPORTEMENT : filtrer reduit, le
// texte se cumule avec le genre, et recliquer annule.
// ---------------------------------------------------------------------------
await etape("filtre par genre", async () => {
  const compte = await creerCompte("GenreTest");
  const page = await pageConnectee(navigateur, compte, BUREAU);

  await page.goto(`${APP}/bibliotheque`);
  await page.waitForTimeout(1500);

  const lignes = () => page.locator("img[alt^='Pochette album']").count();
  const total = await lignes();

  verifier("genre : le catalogue complet s'affiche", total > 0, `${total} morceaux`);

  // La premiere pastille apres « Tous ».
  const premierGenre = page
    .locator("button[aria-pressed]")
    .filter({ hasNotText: "Tous" })
    .first();
  const nomGenre = (await premierGenre.innerText()).split("\n")[0].trim();

  await premierGenre.click();
  await page.waitForTimeout(600);
  const filtre = await lignes();

  verifier(
    `genre : filtrer sur « ${nomGenre} » reduit la liste`,
    filtre > 0 && filtre < total,
    `${filtre} sur ${total}`,
  );
  verifier(
    "genre : la pastille active est signalee aux lecteurs d'ecran",
    (await premierGenre.getAttribute("aria-pressed")) === "true",
  );

  // Le cumul : le texte NE DOIT PAS annuler le genre.
  await page
    .getByPlaceholder("Recherchez un titre ou un artiste")
    .fill("zzzzzz-introuvable");
  await page.waitForTimeout(600);
  verifier(
    "genre : la recherche texte se cumule avec le genre (elle ne le remplace pas)",
    (await lignes()) === 0,
    `${await lignes()} morceau(x) alors qu'aucun ne correspond`,
  );

  await page.getByPlaceholder("Recherchez un titre ou un artiste").fill("");
  await page.waitForTimeout(500);

  // Recliquer sur le genre actif le desactive.
  await premierGenre.click();
  await page.waitForTimeout(600);
  verifier(
    "genre : recliquer la pastille active remet tout le catalogue",
    (await lignes()) === total,
    `${await lignes()} sur ${total}`,
  );

  await page.context().close();
});

// ---------------------------------------------------------------------------
// 5 ter. L'admin peut REELLEMENT modifier un morceau, depuis l'interface
//
// Ce test existe a cause d'un bug precis, et il ne doit pas etre supprime.
//
// En rendant la licence obligatoire sur `PUT /api/musics/update/:id`, on a mis a jour le test
// d'`admin.test.mjs` pour qu'il envoie une licence — sans verifier QUI D'AUTRE appelait cette
// route. `AdminMusiques.jsx` continuait d'envoyer `{title, artist, genre}` et se prenait un 400 :
// le bouton « Modifier » du catalogue ne marchait plus DU TOUT, et la suite restait verte.
//
// La lecon : un test d'API prouve que l'API repond, pas que l'application l'appelle
// correctement. Quand on durcit un contrat, ce sont les APPELANTS qu'il faut aller chercher —
// pas le test qui se plaint.
// ---------------------------------------------------------------------------
await etape("admin : modifier un morceau depuis l'interface", async () => {
  const admin = await creerAdmin("ModifUITest");
  const page = await pageConnectee(navigateur, admin, BUREAU);
  page.on("pageerror", (e) => erreursJS.push(e.message));

  await page.goto(`${APP}/admin/musiques`);
  await page.waitForTimeout(1500);

  await page
    .getByRole("button", { name: /^Modifier / })
    .first()
    .click();
  await page.waitForTimeout(600);

  // La modale doit arriver PRE-REMPLIE avec la licence du morceau. Si elle est vide, c'est que
  // le formulaire ne connait pas ce champ — et l'enregistrement partira sans, donc en 400.
  const licenceAffichee = await page.locator("#licence").inputValue();
  verifier(
    "admin : la modale de modification pre-remplit la licence",
    licenceAffichee !== "",
    `licence = ${JSON.stringify(licenceAffichee)}`,
  );

  // On n'a RIEN change : enregistrer doit fonctionner. C'est le scenario le plus banal — ouvrir,
  // valider — et c'etait exactement celui qui echouait.
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.waitForTimeout(1500);

  const toasts = await page.locator("[data-sonner-toast]").allInnerTexts();
  verifier(
    "admin : enregistrer une modification fonctionne (pas de 400)",
    toasts.some((t) => /modifiée/i.test(t)),
    JSON.stringify(toasts),
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
// 9. Suppression de compte depuis le profil (RGPD : droit a l'effacement)
//
// C'est la seule action IRREVERSIBLE de l'interface. Deux garde-fous la protegent, et ce test
// verifie qu'ils sont bien la : la modale (qui confirme l'intention) et le mot de passe (qui
// confirme l'identite — une session ouverte ne prouve pas qui est devant l'ecran).
// ---------------------------------------------------------------------------
await etape("suppression de compte", async () => {
  const compte = await creerCompte("SuppressionUI");
  const page = await pageConnectee(navigateur, compte, BUREAU);

  await page.goto(`${APP}/profil`);
  await page.waitForTimeout(1200);

  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  await page.waitForTimeout(500);

  // Rien ne doit pouvoir partir tant que le mot de passe n'est pas saisi : le bouton de
  // confirmation reste desactive. Sans ca, la modale ne serait qu'un clic de plus.
  const boutonConfirmer = page.getByRole("button", {
    name: "Supprimer définitivement",
  });
  verifier(
    "suppression : le bouton est desactive tant que le mot de passe est vide",
    await boutonConfirmer.isDisabled(),
  );

  // Mauvais mot de passe : l'API refuse, le compte survit, la session reste ouverte.
  await page.getByLabel("Saisis ton mot de passe pour confirmer :").fill("Faux1234");
  await boutonConfirmer.click();
  await page.waitForTimeout(1500);

  verifier(
    "suppression : un mauvais mot de passe ne deconnecte pas",
    (await page.evaluate(() => localStorage.getItem("token"))) !== null,
  );

  // Le bon mot de passe, cette fois.
  await page
    .getByLabel("Saisis ton mot de passe pour confirmer :")
    .fill(compte.cred.password);
  await boutonConfirmer.click();
  await page.waitForTimeout(2000);

  verifier(
    "suppression : la session est purgee apres la suppression",
    (await page.evaluate(() => localStorage.getItem("token"))) === null,
  );
  verifier(
    "suppression : l'utilisateur est renvoye a l'accueil",
    new URL(page.url()).pathname === "/",
    page.url(),
  );

  await page.context().close();
});

// ---------------------------------------------------------------------------
// 10. Mise en page : l'en-tete de page reste FIGE, seul le contenu defile
//
// C'est la structure commune a toutes les pages (voir `composants/Page.jsx`). Elle etait
// auparavant reinventee page par page, et trois comportements coexistaient — la plupart des
// pages faisaient defiler leur titre avec le contenu, si bien qu'on ne savait plus ou on etait
// des qu'on descendait un peu.
//
// Ce test verrouille les deux invariants : le titre ne bouge pas d'un pixel quand on defile, et
// la fenetre elle-meme ne defile jamais (c'est la zone de contenu qui a l'ascenseur).
// ---------------------------------------------------------------------------
await etape("mise en page : l'en-tete de page ne defile pas", async () => {
  const compte = await creerCompte("EnTeteTest");
  const page = await pageConnectee(navigateur, compte, BUREAU);

  const PAGES = [
    ["/", "Bonjour"],
    ["/bibliotheque", "Bibliothèque"],
    ["/favoris", "Vos musiques likées"],
    ["/playlists", "Vos playlists"],
    ["/deposer", "Déposer une musique"],
    ["/profil", "Mon profil"],
    ["/a-propos", "À propos"],
    ["/contact", "Contact"],
    ["/mentions-legales", "Mentions légales"],
  ];

  for (const [chemin, titreAttendu] of PAGES) {
    await page.goto(`${APP}${chemin}`);
    await page.waitForTimeout(700);

    const h1 = page.locator("h1").first();
    const avant = await h1.boundingBox();

    // On pousse la zone de contenu jusqu'en bas.
    await page.evaluate(() => {
      const zone = document.querySelector("main .overflow-y-auto");
      if (zone) zone.scrollTop = zone.scrollHeight;
    });
    await page.waitForTimeout(400);

    const apres = await h1.boundingBox();

    verifier(
      `en-tete : "${titreAttendu}" reste en place au defilement`,
      avant && apres && Math.abs(avant.y - apres.y) <= 1,
      `y ${avant?.y?.toFixed(0)} -> ${apres?.y?.toFixed(0)}`,
    );

    // Si la fenetre elle-meme defile, c'est que la page deborde : l'en-tete "fige" partirait
    // vers le haut avec le reste, et le lecteur en bas de l'ecran serait pousse hors de vue.
    const fenetreDefile = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight + 1,
    );
    verifier(
      `en-tete : ${chemin} ne fait pas defiler la fenetre entiere`,
      !fenetreDefile,
    );
  }

  await page.context().close();
});

// ---------------------------------------------------------------------------
// 10 bis. Mise en page : la prose et les formulaires ne s'etalent pas avec l'ecran
//
// Le 2026-07-16, les pages sont passees en pleine largeur — le bon choix pour les LISTES et les
// GRILLES (Bibliotheque, Catalogue), qui gagnent a s'etaler. Mais ca a emporte la prose et les
// formulaires avec : les paragraphes d'A propos atteignaient ~130 caracteres en 1440 px (la
// convention typographique tourne autour de 65-75), et sur un 27 pouces les champs de Deposer
// auraient fait ~2000 px de large.
//
// Ce test verifie l'INVARIANT, pas un nombre magique : la colonne ne doit pas grandir quand
// l'ecran grandit. Figer « 65 caracteres » dependrait de la police et casserait au premier
// changement de taille — l'invariant, lui, reste vrai.
//
// Il tourne en 2560 px : c'est le viewport que personne n'ouvre, et donc celui ou une regression
// passerait inapercue le plus longtemps.
// ---------------------------------------------------------------------------
await etape("mise en page : la prose et les formulaires restent bornes", async () => {
  const compte = await creerCompte("LargeurTest");

  // `document.fonts.ready` n'est pas une precaution decorative : `max-w-prose` vaut **65ch**, et
  // l'unite `ch` est la largeur du glyphe « 0 » de la police REELLEMENT chargee. Tant que
  // Montserrat n'est pas la, le navigateur calcule avec la police de repli et la colonne fait
  // 578 px ; une fois chargee, 689 px. Sans cette attente, le test mesure l'un ou l'autre selon
  // la vitesse du reseau — il passait seul et echouait dans la suite complete. Un test instable
  // est pire qu'un test absent : on finit par ignorer sa couleur.
  const largeur = async (page, url, sel) => {
    await page.goto(`${APP}${url}`);
    await page.waitForSelector(sel);
    await page.evaluate(() => document.fonts.ready);
    return page.$eval(sel, (el) => Math.round(el.getBoundingClientRect().width));
  };

  // `main .overflow-y-auto p` et non `main p` : le second attrape le SOUS-TITRE de l'en-tete, qui
  // n'est pas borne par `max-w-prose` (il vit dans `EnTetePage`) et dont la largeur est stable
  // pour une tout autre raison. Les trois assertions passaient donc sans rien prouver — decouvert
  // en retirant `max-w-prose` : le test restait vert.
  // 4e element optionnel = limite propre a la cible (defaut LIMITE). Profil est un empilement
  // pleine largeur (choix Manuel du 2026-07-18) : son plafond est plus large (1600px) pour remplir
  // un portable large, mais il reste BORNE (il ne suit pas l'ecran). On lui donne sa propre limite
  // plutot que de desserrer celle des pages de prose et de Deposer, qui doivent rester serrees.
  const cibles = [
    ["A propos : le paragraphe", "/a-propos", "main .overflow-y-auto p"],
    [
      "Mentions legales : le paragraphe",
      "/mentions-legales",
      "main .overflow-y-auto p",
    ],
    ["Deposer : les deux colonnes", "/deposer", "main .overflow-y-auto > div"],
    ["Profil : empile pleine largeur", "/profil", "main .overflow-y-auto > div", 1700],
  ];

  // On mesure en 2560 px et on compare a la ZONE DISPONIBLE (~2206 px), pas a la mesure en 1440.
  //
  // La premiere version comparait 1440 et 2560 en exigeant l'egalite. Elle etait FAUSSE pour les
  // pages a deux colonnes : leur bloc vaut `max-w-6xl` (1152 px), mais en 1440 la place disponible
  // n'est que de 1078 px — il est donc CONTRAINT en 1440 et atteint son maximum en 2560. Il grandit
  // legitimement (1078 -> 1152), et le test criait au loup.
  //
  // La vraie propriete a verrouiller n'est pas « il ne bouge pas », c'est **« il ne suit pas
  // l'ecran »** : borne, il reste tres en dessous de la zone ; non borne, il la remplit.
  const LIMITE = 1300;
  const page2560 = await pageConnectee(navigateur, compte, {
    width: 2560,
    height: 1440,
  });
  page2560.on("pageerror", (e) => erreursJS.push(e.message));

  for (const [nom, url, sel, limite = LIMITE] of cibles) {
    const mesure = await largeur(page2560, url, sel);
    const zone = await page2560.$eval("main .overflow-y-auto", (el) =>
      Math.round(el.getBoundingClientRect().width),
    );
    verifier(
      `largeur (${nom}) : borne en 2560 px, ne suit pas l'ecran`,
      mesure < limite,
      `${mesure} px dans une zone de ${zone} px`,
    );
  }
  await page2560.context().close();

  // Le pendant, et c'est LUI qui porte la nuance : on a borne le CONTENU, pas la PAGE. La zone
  // de defilement doit donc rester pleine largeur — seul le paragraphe qui vit dedans est borne.
  //
  // Sans cette assertion, les trois verifications ci-dessus passeraient tout aussi bien si on
  // avait borne la page entiere (`max-w` sur `Page.jsx`) : la prose serait bornee, mais l'en-tete
  // aurait retreci avec elle et la Bibliotheque aurait perdu sa pleine largeur. C'est exactement
  // l'etat d'avant le 2026-07-16, celui que Manuel a demande de quitter.
  //
  // `main .overflow-y-auto` est l'ancre qu'utilisent deja les tests « en-tete » : la zone de
  // defilement de `Page.jsx`.
  const page = await pageConnectee(navigateur, compte, { width: 2560, height: 1440 });
  await page.goto(`${APP}/a-propos`);
  await page.waitForSelector("main .overflow-y-auto p");
  const zone = await page.$eval("main .overflow-y-auto", (el) =>
    Math.round(el.getBoundingClientRect().width),
  );
  verifier(
    "largeur (A propos) : la zone de contenu reste pleine largeur (on borne le contenu, pas la page)",
    zone > 1800,
    `${zone} px`,
  );
  await page.context().close();
});

// ---------------------------------------------------------------------------
// 11. Mise en page : l'app ne doit jamais depasser la hauteur de l'ecran
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

// ---------------------------------------------------------------------------
// 12. Depot : la carte de suivi est le SEUL chemin vers « Mes demandes »
//
// « Mes demandes » a ete retire de l'Aside ET du menu mobile le 2026-07-17 : la page ne concerne
// que ceux qui ont deja depose, et `Deposer.jsx` y mene par une carte conditionnee a
// `nbDepots > 0`. Le raisonnement tient tant que cette carte marche — si elle casse, la page
// devient inatteignable sans taper l'URL a la main, et quelqu'un qui vient de deposer n'a plus
// aucun moyen de suivre sa demande.
//
// Ce test depose par le VRAI formulaire (et non par l'API) pour la raison apprise avec le bouton
// « Modifier » du catalogue : une route qui repond ne prouve pas que l'interface l'appelle bien.
// Il couvre donc au passage le <select> de genre pose le meme jour.
// ---------------------------------------------------------------------------
await etape("depot : la carte de suivi mene a « Mes demandes »", async () => {
  const compte = await creerCompte("CarteDepot");
  const page = await pageConnectee(navigateur, compte, BUREAU);
  page.on("pageerror", (e) => erreursJS.push(e.message));

  await page.goto(`${APP}/deposer`);
  await page.waitForSelector("#title");

  // Sans depot, pas de carte : c'est la justification meme du retrait de l'Aside. Si cette
  // assertion tombe, c'est que la carte s'affiche pour tout le monde — et le lien permanent
  // redevenait defendable.
  verifier(
    "depot : sans aucun depot, la carte de suivi est absente",
    (await page.getByRole("link", { name: /Mes demandes/ }).count()) === 0,
  );

  await page.fill("#title", "Morceau de test e2e");
  await page.fill("#artist", "Artiste de test e2e");
  await page.selectOption("#genre", "Pop");
  await page.selectOption("#licence", "CC BY 4.0");
  await page.setInputFiles(
    'input[type="file"][accept="audio/*"]',
    path.join(ICI, "fixtures", "audio-test.mp3"),
  );
  // La pochette est obligatoire depuis qu'on a retire le tirage au hasard a l'approbation : sans
  // elle, `Deposer.jsx` bloque l'envoi cote client (toast) et le depot ne part jamais.
  await page.setInputFiles(
    'input[type="file"][accept="image/*"]',
    path.join(ICI, "fixtures", "pochette-test.jpg"),
  );
  await page.check('input[name="droitsConfirmes"]');
  await page.getByRole("button", { name: /Envoyer/ }).click();

  // La carte doit apparaitre SANS rechargement : `Deposer.jsx` rafraichit `nbDepots` apres un
  // envoi reussi. Sans ca, celui qui vient de deposer reste bloque sur une page sans issue.
  const carte = page.getByRole("link", { name: /Mes demandes/ });
  await carte.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
  verifier(
    "depot : apres un envoi, la carte de suivi apparait sans rechargement",
    await carte.isVisible().catch(() => false),
  );

  await carte.click();
  await page.waitForTimeout(1200);
  verifier(
    "depot : la carte mene bien a /mes-depots",
    new URL(page.url()).pathname === "/mes-depots",
    page.url(),
  );
  verifier(
    "depot : le morceau depose y est liste",
    await page.getByText("Morceau de test e2e").first().isVisible().catch(() => false),
  );

  // Le fichier envoye vit dans `backend/uploads/`. Le nettoyage general supprime le COMPTE, et
  // `submissions` cascade — la ligne disparait donc, et avec elle le seul moyen de retrouver le
  // nom du fichier. Il faut l'effacer ICI, tant que la ligne existe, sinon `uploads/` accumule
  // un orphelin a chaque execution.
  await supprimerFichiersDeposes(compte.user.id_user);

  await page.context().close();
});

await navigateur.close();

verifier(
  "aucune erreur JavaScript dans la console",
  erreursJS.length === 0,
  erreursJS.length ? [...new Set(erreursJS)].join(" | ") : "",
);

await nettoyerComptesDeTest();
rapport("TESTS DE BOUT EN BOUT — parcours utilisateur");
