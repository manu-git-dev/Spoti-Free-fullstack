// Utilitaires partages par les tests.
//
// Pas de framework (Jest, Vitest...) : ces tests s'executent contre l'application REELLE
// (backend + frontend + MySQL demarres), un simple script Node suffit et evite d'ajouter une
// dependance de plus. `assert` fait office de moteur d'assertions.

import path from "node:path";
import url from "node:url";
import dotenv from "dotenv";

const ICI = path.dirname(url.fileURLToPath(import.meta.url));
const CHEMIN_ENV_BACKEND = path.join(ICI, "..", "backend", ".env");

// Les tests lisent la meme configuration que le backend : ils s'executent contre l'application
// reelle, donc contre la meme base.
dotenv.config({ path: CHEMIN_ENV_BACKEND });

export const API = process.env.API_URL ?? "http://localhost:3000";
export const APP = process.env.APP_URL ?? "http://localhost:5173";

// Les limites (anti brute-force, anti-spam) sont-elles coupees pour les tests ?
// Voir backend/src/routes/userRoute.js : la desactivation est impossible en production.
export const limitesDesactivees = process.env.RATE_LIMIT_DISABLED === "1";

// Tous les comptes crees par les tests portent ce prefixe : c'est ce qui permet de les
// retrouver et de les supprimer a la fin, sans jamais toucher aux vrais comptes.
export const PREFIXE_TEST = "e2e-test+";

const JSON_HEADERS = { "Content-Type": "application/json" };

// ---------------------------------------------------------------------------
// Mini-runner : collecte les resultats, affiche un rapport, et sort en code 1
// si un test echoue (indispensable pour un jour brancher une CI).
// ---------------------------------------------------------------------------
const resultats = [];

export function verifier(nom, condition, details = "") {
  resultats.push({ nom, ok: Boolean(condition), details });
}

export async function etape(nom, fn) {
  try {
    await fn();
  } catch (erreur) {
    verifier(nom, false, `EXCEPTION: ${erreur.message.split("\n")[0]}`);
  }
}

export function rapport(titre) {
  const ok = resultats.filter((r) => r.ok);
  const ko = resultats.filter((r) => !r.ok);

  console.log(`\n${"=".repeat(60)}\n${titre}\n${"=".repeat(60)}`);
  for (const r of resultats) {
    const icone = r.ok ? "  ✓" : "  ✗";
    console.log(`${icone} ${r.nom}${r.details ? ` — ${r.details}` : ""}`);
  }
  console.log(`\n${ok.length} reussi(s), ${ko.length} echec(s).`);

  if (ko.length > 0) {
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------
// Comptes de test
// ---------------------------------------------------------------------------

/** Cree un compte de test unique et renvoie { cred, token, user }. */
export async function creerCompte(pseudo = "TestUser") {
  const cred = {
    pseudo,
    prenom: "Test",
    nom: "Auto",
    email: `${PREFIXE_TEST}${Date.now()}${Math.random().toString(36).slice(2, 7)}@example.com`,
    password: "MotDePasse123!",
  };

  const inscription = await fetch(`${API}/api/users/inscription`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(cred),
  });
  if (inscription.status !== 201) {
    throw new Error(
      `inscription impossible (${inscription.status}) : ${JSON.stringify(await inscription.json())}`,
    );
  }

  const connexion = await fetch(`${API}/api/users/connexion`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email: cred.email, password: cred.password }),
  });
  const donnees = await connexion.json();

  return { cred, token: donnees.token, user: donnees.user };
}

/**
 * Cree un compte de test, le promeut ADMIN en base, et renvoie { cred, token, user }.
 *
 * Avant, les tests d'administration forgeaient un jeton pour `id_user: 10` / `admin@admin.fr` —
 * un compte qui n'existait QUE dans la base de developpement de cette machine. Les tests etaient
 * donc injouables ailleurs : sur une base neuve (la CI), `adminMiddleware` ne trouvait aucun
 * utilisateur et repondait 403. C'est la CI qui a revele cette dependance cachee.
 *
 * Ironie : `admin@admin.fr` est precisement le compte que `DEPLOIEMENT.md` demande de PURGER
 * avant la mise en production. Des tests qui en dependent auraient casse le jour de la purge.
 *
 * Ici, le compte est cree par l'API (donc avec un vrai mot de passe hache), promu par une seule
 * requete SQL, et le jeton renvoye est un VRAI jeton de connexion — pas un jeton fabrique a la
 * main. Le nettoyage le supprime comme les autres comptes de test.
 */
export async function creerAdmin(pseudo = "AdminTest") {
  const compte = await creerCompte(pseudo);

  const { default: mysql } = await import("mysql2/promise");
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
  });
  await db.query("UPDATE users SET role = 'admin' WHERE email = ?", [
    compte.cred.email,
  ]);
  await db.end();

  // On se reconnecte : le role est relu en base a chaque requete par `adminMiddleware`, mais on
  // veut un jeton emis APRES la promotion, comme le ferait un vrai admin qui se connecte.
  const connexion = await fetch(`${API}/api/users/connexion`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      email: compte.cred.email,
      password: compte.cred.password,
    }),
  });
  const donnees = await connexion.json();

  return { cred: compte.cred, token: donnees.token, user: donnees.user };
}

/** Appelle l'API en tant qu'utilisateur connecte. */
export function apiAuth(token) {
  return async (chemin, options = {}) => {
    const { body, ...reste } = options;
    const reponse = await fetch(`${API}${chemin}`, {
      ...reste,
      headers: {
        ...JSON_HEADERS,
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    let donnees = null;
    try {
      donnees = await reponse.json();
    } catch {
      /* pas de corps JSON */
    }
    return { reponse, donnees };
  };
}

/** Ouvre une page deja authentifiee (le token est pose dans localStorage). */
export async function pageConnectee(navigateur, { token, user }, viewport) {
  const contexte = await navigateur.newContext({ viewport });
  const page = await contexte.newPage();
  await page.goto(APP);
  await page.evaluate(
    ([t, u]) => {
      localStorage.setItem("token", t);
      localStorage.setItem("user", JSON.stringify(u));
    },
    [token, user],
  );
  return page;
}

/**
 * Supprime les comptes crees par les tests, ainsi que leurs playlists et leurs likes.
 *
 * Le nettoyage se fait directement en base (l'API n'expose pas de suppression de compte).
 * Les tests s'executent en local, ils lisent donc la meme configuration que le backend :
 * `backend/.env`. Le filtre `LIKE 'e2e-test+%'` garantit qu'on ne touche JAMAIS a un vrai
 * compte — sans ce garde-fou, une erreur ici viderait la table `users`.
 */
export async function nettoyerComptesDeTest() {
  const { default: mysql } = await import("mysql2/promise");

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  const filtre = `${PREFIXE_TEST}%`;

  await db.query(
    `DELETE pm FROM playlists_musics pm
       JOIN playlists p ON p.id_playlist = pm.id_playlist
       JOIN users u ON u.id_user = p.id_user
      WHERE u.email LIKE ?`,
    [filtre],
  );
  await db.query(
    `DELETE l FROM likes l JOIN users u ON u.id_user = l.id_user WHERE u.email LIKE ?`,
    [filtre],
  );
  await db.query(
    `DELETE p FROM playlists p JOIN users u ON u.id_user = p.id_user WHERE u.email LIKE ?`,
    [filtre],
  );
  const [resultat] = await db.query(`DELETE FROM users WHERE email LIKE ?`, [
    filtre,
  ]);

  await db.end();
  console.log(`\n(nettoyage : ${resultat.affectedRows} compte(s) de test supprime(s))`);
}
