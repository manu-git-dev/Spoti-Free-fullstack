# Notes d'apprentissage — Développement web

Ce document rassemble les points sur lesquels j'ai bloqué et demandé de l'aide à Claude, tous projets confondus, avec le contexte, l'explication du problème/concept et la/les solution(s). Mis à jour à chaque fois que je demande de l'aide ou une explication sur une méthode/pratique.

---

## 2026-07-04 — Spoti-Free

### 1. Boucle next/prev cassée (off-by-one dans une condition)

**Contexte** : `MediaPlayer.jsx`, fonction `handleNext`.

**Problème** : la logique testait 2 cas alors qu'il y en a 3 possibles :
```js
if (nextIndex > maxIndex) { /* boucle à 0 */ }
else if (nextIndex !== maxIndex) { /* avance normal */ }
// cas manquant : nextIndex === maxIndex → rien ne se passe
```
Résultat : impossible d'atteindre la dernière piste de la playlist en cliquant "next".

**Solution** : remplacer le `else if` restrictif par un simple `else` — il n'y a que 2 cas réels (dépasser le max → boucler, sinon → avancer, y compris quand on tombe pile sur le max).

---

### 2. `useEffect` appelé à l'intérieur d'un event handler (Rules of Hooks)

**Contexte** : `AddMusicPlaylist.jsx`, `handleClick`.

**Problème** :
```js
function handleClick() {
  useEffect(() => { /* fetch */ }, []);
}
```
Les hooks React (`useState`, `useEffect`, `useRef`...) ne peuvent être appelés qu'**au niveau racine d'un composant, pendant le rendu** — jamais dans une fonction imbriquée, un `if`, une boucle, ou un gestionnaire d'événement. React associe chaque hook à une position dans l'ordre d'appel ; si l'appel est conditionnel (ex: seulement au clic), cet ordre devient imprévisible et React ne peut plus faire le lien correctement.

**Solution** : `useEffect` sert à *synchroniser* un composant avec le cycle de vie (montage, changement de dépendance) — ce n'est pas fait pour "exécuter du code au moment d'un clic". Un simple event handler (fonction `async` classique, comme dans `ButtonLike.jsx`) suffit : on fait le `fetch` directement dedans, sans wrapper.

---

### 3. State asynchrone : lire une valeur juste après son `setState` (stale closure)

**Contexte** : `AddMusicPlaylist.jsx`, `handleClick`.

**Problème** :
```js
setIdPlaylist(selectRef.current.value);
const url = `.../${idPlaylist}/${idMusic}`; // idPlaylist = encore l'ANCIENNE valeur ici
```
Les mises à jour de state (`setXxx`) ne sont **pas immédiates** — elles planifient un re-render. Tant que le composant n'a pas refait un rendu, la variable garde sa valeur d'avant l'appel à `setXxx`.

**Solution** : si la valeur est disponible immédiatement autrement (ici via `selectRef.current.value`, une ref), pas besoin de passer par un state — utiliser directement la valeur lue depuis la ref (`const idPlaylist = selectRef.current.value;` puis s'en servir tout de suite dans la même fonction).

---

### 4. `useRef` vs `state` pour lire une valeur du DOM (input non contrôlé)

**Contexte** : `AddMusicPlaylist.jsx` (`<select>`), puis `Playlist.jsx` (`<input>` de renommage).

**Concept** : `useRef` permet de lire une valeur du DOM **à l'instant T, de façon synchrone**, sans attendre un cycle de rendu React. Utile quand on n'a pas besoin de réagir à chaque frappe/changement (pas de re-render nécessaire), juste de lire la valeur finale au moment de l'action (ex: au clic sur "Ajouter"/"Renommer").

**Deux approches possibles pour un input** :
- **Non contrôlé** (via `ref`) : `<input defaultValue={nom} ref={inputRef} />`, on lit `inputRef.current.value` quand on en a besoin.
- **Contrôlé** (via `state`) : `const [valeur, setValeur] = useState(nom)`, `<input value={valeur} onChange={(e) => setValeur(e.target.value)} />`.

---

### 5. Input "bloqué" : `value` sans `onChange` (input contrôlé cassé)

**Contexte** : `Playlist.jsx`, `<input type="text" value={nom} />` (sans `onChange`).

**Problème** : dès qu'un `<input>` reçoit une prop `value`, React considère qu'il **contrôle entièrement** l'affichage du champ. Sans `onChange` pour capturer la frappe et mettre à jour une variable, React réaffiche en boucle l'ancienne valeur (`nom`, qui ne change jamais) → impossible de taper quoi que ce soit. (React log un warning dans la console à ce sujet.)

**Solution** : soit ajouter le `onChange` manquant (approche contrôlée), soit passer en non contrôlé avec `defaultValue` + `ref` (voir point 4).

---

### 6. Id HTML dupliqué dans une liste + `document.getElementById`

**Contexte** : `AddMusicPlaylist.jsx`, un `<dialog id="my_modal_1">` rendu une fois par carte de musique (dans une boucle `.map()`).

**Problème** : `document.getElementById(...)` cherche dans **tout le document HTML**, pas dans le composant courant. Si plusieurs instances du même composant utilisent le même `id` fixe, l'id est dupliqué dans le DOM (invalide en HTML), et `getElementById` renvoie toujours le **premier élément trouvé** — donc toujours la modale de la première carte, peu importe sur quel bouton on clique.

**Solution** : fabriquer un id **unique par instance**, en s'appuyant sur une donnée déjà disponible et unique (ex: `id={`my_modal_${idMusic}`}`), et utiliser ce même id dynamique à la fois pour ouvrir (`document.getElementById(`my_modal_${idMusic}`)`) et pour le `<dialog>`.

---

### 7. Après une action réussie (DELETE/PUT), l'affichage ne se met pas à jour sans recharger la page

**Contexte** : vu 3 fois — `RemoveMusicPlaylist.jsx` (retirer une musique), `handleDelete` et `handleRename` dans `Playlist.jsx` (supprimer/renommer une playlist).

**Problème** : le fetch réussit bien côté backend (la donnée change en base), mais le `state` local qui alimente l'affichage (`musicsPlaylist`, `playlists`...) n'est rempli qu'une seule fois au montage du composant (dans un `useEffect` avec `[]` comme dépendances). Rien ne le met à jour après une action → il faut recharger la page pour relancer le fetch initial et revoir l'état à jour.

**Solution** : après une réponse `reponse.ok`, mettre à jour le state local directement, sans re-fetch :
- Pour **supprimer un élément d'une liste** → `setListe((prev) => prev.filter((item) => item.id !== idSupprime));`
- Pour **modifier un élément d'une liste** → `setListe((prev) => prev.map((item) => item.id === idModifie ? { ...item, champ: nouvelleValeur } : item));`

Dans les deux cas, il faut faire descendre le setter du state (`setPlaylists`, `setMusicsPlaylist`...) en prop jusqu'au composant qui déclenche l'action (même principe que pour n'importe quelle autre prop).

---

### 8. `event.stopPropagation()` vs `event.preventDefault()`

**Contexte** : boutons "Supprimer"/"Renommer" à l'intérieur d'un `<Link>` (React Router) dans `Playlists.jsx`.

**Concept** :
- **`stopPropagation()`** : empêche l'événement de remonter (bubbling) vers les listeners des éléments **parents**.
- **`preventDefault()`** : empêche le **comportement par défaut du navigateur** associé à l'événement (ex: suivre un `href` sur un clic de `<a>`). Complètement indépendant de la propagation.

**Piège rencontré** : `<Link>` de React Router génère un vrai `<a href>`. Il a son propre `onClick` interne qui fait `preventDefault()` (empêcher la navigation native) puis navigue lui-même en SPA. Si un bouton **enfant** du `<Link>` appelle `stopPropagation()` sans `preventDefault()`, l'event n'atteint jamais le `onClick` du `Link` → le `preventDefault()` du `Link` ne s'exécute jamais → le navigateur suit quand même le `href` nativement (rechargement complet de page), ce qui donne l'impression que "stopPropagation ne marche pas".

**Solution retenue ici** : plutôt que de patcher chaque bouton avec les deux appels, on a **restructuré le JSX** pour que le `<Link>` n'entoure plus que le texte cliquable (le nom de la playlist), et plus les boutons d'action — les boutons ne sont alors plus du tout des descendants du `<Link>`, donc plus aucun risque de bubbling/navigation parasite. (Alternative possible si on ne peut pas restructurer : appeler les deux méthodes, `stopPropagation()` ET `preventDefault()`, dans le handler du bouton enfant.)

---

### 9. `fetch` : le `body` doit être une chaîne (`JSON.stringify`), pas un objet brut

**Contexte** : `Playlist.jsx`, `handleRename`.

**Problème** :
```js
body: { name: `${name}` },
```
L'option `body` de `fetch` doit être une **chaîne de caractères** (ou `Blob`/`FormData`/etc.), jamais un objet JS brut. Un objet passé tel quel est converti automatiquement en la chaîne `"[object Object]"` (comportement par défaut de `toString()` sur un objet), ce qui n'est pas du JSON valide. Résultat côté serveur : le middleware `express.json()` échoue à parser ce texte → erreur "invalid json".

**Solution** :
```js
body: JSON.stringify({ name }),
```

---

### 10. `map` vs `filter` (et le pattern `setState(prev => ...)`)

**Contexte** : concept général JS/React, rencontré plusieurs fois aujourd'hui (`RemoveMusicPlaylist`, `handleDelete`/`handleRename` dans `Playlist.jsx`).

**Le concept de base (JS pur, rien à voir avec React)** : `map` et `filter` sont deux méthodes de tableau qui **retournent un nouveau tableau** sans modifier l'original (immutabilité).

```js
const nombres = [1, 2, 3, 4];

const doubles = nombres.map(n => n * 2);       // [2, 4, 6, 8]  → même nombre d'éléments, transformés
const pairs   = nombres.filter(n => n % 2 === 0); // [2, 4]     → moins d'éléments, on garde ceux qui matchent
```

- **`map`** : je veux **transformer** chaque élément → le tableau de sortie a **le même nombre d'éléments** que celui de départ.
- **`filter`** : je veux **garder seulement certains éléments** (ceux pour lesquels la fonction retourne `true`) → le tableau de sortie a **autant ou moins d'éléments**.

**Comment choisir entre les deux (règle simple)** :
| Je veux... | Méthode | Résultat |
|---|---|---|
| Supprimer un élément d'une liste | `filter` | même liste, sans l'élément visé |
| Modifier un élément dans une liste (garder tous les autres intacts) | `map` | même liste, un élément remplacé par sa version modifiée |
| Ajouter un élément | ni l'un ni l'autre → spread `[...liste, nouvelElement]` | liste + 1 élément |

**Exemples concrets vus aujourd'hui** :

Supprimer (retirer une musique likée/d'une playlist) → `filter` :
```js
setMusiquesLikee((prev) =>
  prev.filter((musique) => musique.id_music !== idMusic)
);
```
Traduction : "je reconstruis le tableau avec tous les éléments, SAUF celui dont l'id correspond à celui que je viens de supprimer côté serveur."

Modifier (renommer une playlist) → `map` :
```js
setPlaylists((prev) =>
  prev.map((playlist) =>
    playlist.id_playlist === id ? { ...playlist, name } : playlist
  )
);
```
Traduction : "je parcours tout le tableau ; pour CHAQUE élément, si son id correspond à celui que je viens de renommer, je retourne une COPIE de cet objet avec `name` mis à jour (`{ ...playlist, name }`) ; sinon, je retourne l'élément tel quel, inchangé."

Le `{ ...playlist, name }` (spread) est important : on ne fait jamais `playlist.name = name` directement (ça muterait l'objet existant) — on crée un **nouvel objet** copié à partir de l'ancien avec juste le champ `name` écrasé. React se base sur le changement de référence (un nouvel objet/tableau) pour détecter qu'il doit re-render ; muter l'objet existant en place ne déclenche pas toujours un re-render correct.

Ajouter (liker une musique) → **spread**, pas `map`/`filter` :

D'abord, le concept de base du spread `...` sur un tableau, en dehors de tout React — `...` "déplie" les éléments d'un tableau existant à l'intérieur d'un nouveau tableau :
```js
const fruits = ["pomme", "poire"];
const fruitsAvecCerise = [...fruits, "cerise"];
// [...fruits] déplie "pomme" et "poire", puis on ajoute "cerise" après
// résultat : ["pomme", "poire", "cerise"]
```
Sans le spread, `[fruits, "cerise"]` donnerait `[["pomme","poire"], "cerise"]` — un tableau qui contient un AUTRE tableau à l'intérieur (pas ce qu'on veut). Le spread sert justement à éviter cette imbrication : il "sort" les éléments un par un.

Appliqué à `ButtonLike.jsx`, dans `handleLike`, une fois le like confirmé côté serveur (`reponse.ok`), il faut ajouter la musique courante (déjà reçue en prop, `musique`) à la liste locale `musiquesLikee` :
```js
setMusiquesLikee((prev) => [...prev, musique]);
```
Traduction, étape par étape :
1. `prev` = l'état actuel du tableau `musiquesLikee` au moment où la mise à jour s'applique (voir plus bas pourquoi `prev` et pas la variable directement).
2. `[...prev, musique]` construit un **nouveau tableau** : tous les éléments déjà présents dans `prev` (dépliés un par un grâce au spread), suivis du nouvel élément `musique` ajouté à la fin.
3. `setMusiquesLikee(...)` remplace l'ancien tableau par ce nouveau tableau (avec un élément de plus), ce qui déclenche le re-render de tous les composants qui utilisent `musiquesLikee`.

Résumé de la règle à retenir :
- Je veux **retirer** → `filter` (je reconstruis le tableau sans l'élément).
- Je veux **modifier en place** → `map` (je reconstruis le tableau, un élément est remplacé par sa version modifiée via `{ ...objet, champModifié }`).
- Je veux **ajouter** → spread `[...prev, nouvelElement]` (je reconstruis le tableau avec un élément de plus à la fin).

Dans les 3 cas, le point commun : on ne modifie **jamais** le tableau/objet existant directement (pas de `prev.push(...)`, pas de `objet.champ = valeur`) — on **reconstruit toujours un nouveau tableau/objet**. C'est la règle d'immutabilité en React : les mises à jour de state doivent produire une nouvelle référence pour que React détecte le changement et re-render correctement.

**Pourquoi `(prev) => ...` et pas juste utiliser la variable de state directement ?** C'est la forme "fonctionnelle" du setter de `useState`. Elle garantit de partir de la **valeur la plus à jour** du state au moment où la mise à jour s'applique réellement, plutôt que de la valeur "figée" au moment du rendu (voir l'entrée #3 plus haut sur le state asynchrone — c'est le même genre de piège que `setState(prev => ...)` permet d'éviter).

---

### 11. `Array.prototype.some()` — tester "est-ce qu'au moins un élément correspond ?"

**Contexte** : `ButtonLike.jsx`, pour déterminer si une musique est déjà likée :
```js
const estLike = musiquesLikee.some((musique) => musique.id_music === idMusic);
```

**Le concept** : `some()` parcourt un tableau et retourne un **booléen** (`true`/`false`) qui répond à la question *"est-ce qu'au moins un élément du tableau vérifie cette condition ?"*. Dès qu'un élément fait matcher la fonction (elle retourne `true` pour lui), `some()` s'arrête immédiatement et renvoie `true` — il ne continue pas à parcourir le reste du tableau inutilement (contrairement à `map`/`filter` qui parcourent toujours tout le tableau).

```js
const nombres = [1, 3, 5, 8, 9];

const contientUnPair = nombres.some((n) => n % 2 === 0); // true (8 est pair)
const contientUnGrand = nombres.some((n) => n > 100);     // false, aucun n'est > 100
```

**Pourquoi c'est parfait pour "est-ce que cet élément est déjà dans la liste ?"** : c'est exactement la question posée par `estLike` — "est-ce qu'il existe, dans `musiquesLikee`, une musique dont `id_music` correspond à `idMusic` ?". `some()` répond directement par `true`/`false`, prêt à être utilisé dans un rendu conditionnel JSX (`estLike ? <A/> : <B/>`) ou dans un `if`.

**À ne pas confondre avec les méthodes voisines** :
| Méthode | Retourne | Usage typique |
|---|---|---|
| `some(cb)` | `true`/`false` | "au moins un élément vérifie la condition ?" |
| `every(cb)` | `true`/`false` | "**tous** les éléments vérifient la condition ?" |
| `find(cb)` | l'élément trouvé (ou `undefined`) | je veux **récupérer l'objet** qui correspond, pas juste savoir s'il existe |
| `includes(valeur)` | `true`/`false` | même idée que `some`, mais seulement pour tester une égalité simple (ex: un tableau de nombres/chaînes) — pas utilisable avec une condition personnalisée sur un tableau d'objets |

Ici, `musiquesLikee` est un tableau d'**objets** (pas de simples id), donc `includes(idMusic)` ne fonctionnerait pas directement — il faut `some()` avec une condition personnalisée (`musique.id_music === idMusic`) pour comparer un champ précis de chaque objet.

---

### 12. Rendu conditionnel en JSX : ternaire (`? :`) vs ET logique (`&&`)

**Contexte** : rencontré deux fois — une fois pour afficher un bouton OU un autre selon un état (like/pas liké), une fois pour afficher un bouton seulement dans certaines pages/contextes selon qu'une prop est fournie ou non.

**Le concept général** : en JSX, il n'y a pas de `if`/`else` directement dans le `return` (le JSX est une expression, pas une suite d'instructions) — on utilise donc des **opérateurs JS classiques** qui, eux, retournent une valeur.

**A. Le ternaire `condition ? A : B`** — pour choisir entre **deux rendus différents**, un dans chaque cas. Exemple générique : un badge de statut selon qu'un utilisateur est connecté ou non :
```jsx
return estConnecte ? (
  <span>Bonjour !</span>
) : (
  <span>Veuillez vous connecter</span>
);
```
Traduction : "si `estConnecte` est vrai, affiche le premier `<span>` ; sinon, affiche le second." Toujours l'un OU l'autre, jamais aucun des deux, jamais les deux en même temps.

**B. Le ET logique `condition && <Composant />`** — pour afficher un élément **seulement si une condition est vraie, sinon rien du tout** (pas d'alternative à afficher). Exemple générique : un badge "Nouveau" affiché seulement sur les articles publiés il y a moins de 24h :
```jsx
{estRecent && (
  <span className="badge">Nouveau</span>
)}
```
**Pourquoi ça marche** : en JS, `&&` évalue son opérande de gauche ; si elle est "falsy" (`undefined`, `null`, `false`, `0`, `""`), il s'arrête là et retourne cette valeur falsy sans évaluer la droite. Si elle est "truthy", il retourne la valeur de droite. React, lui, sait que rendre `undefined`/`null`/`false` dans le JSX **n'affiche rien** — donc `estRecent && (<span>...</span>)` affiche le badge seulement quand `estRecent` est vrai, et n'affiche rien du tout sinon (pas d'élément de remplacement).

**C. Le `!` (NON logique) pour inverser une condition** — utile quand tu veux la situation opposée. En reprenant l'exemple précédent, on pourrait vouloir un badge "Archivé" seulement sur les articles qui NE sont PAS récents :
```jsx
{!estRecent && (
  <span className="badge">Archivé</span>
)}
```
`!estRecent` inverse la valeur booléenne : si `estRecent` est `false`, `!estRecent` devient `true` → le badge s'affiche ; si `estRecent` est `true`, `!estRecent` devient `false` → rien ne s'affiche. C'est exactement l'inverse du cas B — pratique quand deux éléments doivent apparaître dans des situations mutuellement exclusives (l'un quand une condition est vraie, l'autre quand elle est fausse), sans jamais se chevaucher ni disparaître tous les deux.

**Comment transférer ça à un cas réel** : la question à te poser à chaque fois est "est-ce que je veux TOUJOURS afficher quelque chose (A ou B) ?" → ternaire — ou "est-ce que je veux afficher quelque chose UNIQUEMENT dans un cas, et rien dans l'autre ?" → `&&` (ou `!condition &&` si le cas à couvrir est celui où la condition est fausse).

**Comment choisir entre les trois** :
| Je veux... | Opérateur |
|---|---|
| Afficher A **ou** B (toujours l'un des deux) | ternaire `condition ? A : B` |
| Afficher A **ou rien** | `condition && A` |
| Afficher A **ou rien**, mais dans le cas inverse | `!condition && A` |

---

### 13. Construire le nouvel élément à partir de la réponse serveur, pas d'une prop existante

**La difficulté rencontrée** : après un ajout réussi côté serveur (ex: création d'un élément via un formulaire), j'ai voulu mettre à jour ma liste locale avec le spread (`[...prev, nouvelElement]`, vu en entrée #10) mais je me suis trompé sur **ce que représentait `nouvelElement`** — j'ai utilisé une prop qui contenait en fait l'**ancienne liste complète** (un tableau), au lieu de construire un objet représentant uniquement le nouvel élément créé.

**Le concept à bien distinguer** : le spread `[...prev, nouvelElement]` attend que `nouvelElement` soit **un seul objet** (une seule "fiche"), pas un tableau. Si on lui donne un tableau par erreur, on obtient un tableau imbriqué à l'intérieur du tableau principal — pas du tout ce qu'on veut.

**D'où doit venir ce nouvel élément ?** De la **réponse du serveur** à la requête qui vient de créer l'élément (le serveur connaît l'id généré, qu'on ne pouvait pas connaître avant l'insertion en base) — jamais d'une prop qui contient une liste déjà existante.

Exemple générique : je viens de créer un article de blog via un formulaire, et le serveur me répond avec `{ id: 42, titre: "Mon article", message: "Article créé" }` :
```js
const resultatServeur = await reponse.json();
const nouvelArticle = { id: resultatServeur.id, titre: resultatServeur.titre };
setArticles((prev) => [...prev, nouvelArticle]);
```
Étapes :
1. `resultatServeur` contient tout ce que le serveur a renvoyé (id généré, champs, message...).
2. Je construis `nouvelArticle`, un objet **unique**, avec seulement les champs dont j'ai besoin pour afficher cet article dans ma liste.
3. Le spread ajoute cet objet unique à la fin de `prev` — un élément de plus, du même type que les autres.

**Piège à surveiller ensuite** : les noms des champs renvoyés par le serveur pour la création (ex: `id`, `titre`) doivent correspondre aux noms de champs déjà utilisés pour les éléments existants dans la liste (ex: si la liste initiale a été chargée avec des champs `id_article`/`nom` plutôt que `id`/`titre`, le nouvel objet doit reprendre les mêmes noms de champs, sinon l'affichage de ce nouvel élément spécifique sera cassé alors que les autres fonctionnent).

---

### 14. `nodemailer` — envoyer des emails depuis un serveur Node.js

**Contexte** : Spoti-Free, formulaire de contact (page `Contact`) — le message saisi par un visiteur doit m'arriver par email plutôt que d'être juste stocké en base.

**À quoi ça sert** : `nodemailer` est un paquet npm qui permet à un serveur Node.js d'envoyer des emails, en se connectant à un vrai service de messagerie (Gmail, Outlook, ou un serveur SMTP dédié comme SendGrid/Mailtrap). Concrètement, ton backend Express peut, à la suite d'une action (formulaire soumis, inscription, etc.), déclencher l'envoi d'un email — chose que le navigateur seul ne peut pas faire (JavaScript côté frontend n'a pas accès à un serveur de messagerie, pour des raisons de sécurité évidentes).

**Quand l'utiliser (cas d'usage typiques)** :
- Formulaire de contact → recevoir le message par email.
- Confirmation d'inscription / bienvenue.
- Réinitialisation de mot de passe (envoyer un lien/code par email).
- Notification d'un événement (nouvelle commande, alerte, etc.).

**Quand ne PAS l'utiliser** : pour de la communication instantanée (chat en direct → plutôt des WebSockets), des notifications push mobile, ou des SMS (autres outils dédiés). `nodemailer` est spécifiquement pour l'email.

**Comment ça marche, avec un exemple générique** (envoyer un email de bienvenue après une inscription) :
```js
import nodemailer from "nodemailer";

// 1. On crée UNE FOIS un "transporteur", configuré avec les identifiants d'un compte email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 2. On s'en sert autant de fois qu'on veut pour envoyer des emails
async function envoyerBienvenue(emailDestinataire, pseudo) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,       // qui envoie l'email
    to: emailDestinataire,              // qui le reçoit
    subject: "Bienvenue !",
    text: `Salut ${pseudo}, merci de ton inscription !`,
    // ou "html: '<h1>Salut ${pseudo}</h1>...'" pour un email avec mise en forme
  });
}
```

**Pourquoi un "mot de passe d'application" et pas mon vrai mot de passe Gmail ?** Les grands fournisseurs (Google, Microsoft...) bloquent la connexion directe avec le mot de passe du compte pour des applications tierces, par sécurité. Il faut activer la validation en 2 étapes sur le compte, puis générer un "mot de passe d'application" dédié (un code à 16 caractères, révocable indépendamment sans toucher au vrai mot de passe) — c'est ce mot de passe-là qui va dans `EMAIL_PASS`, jamais le vrai mot de passe du compte.

**Sécurité, très important** : les identifiants (`EMAIL_USER`/`EMAIL_PASS`) ne doivent **jamais** être écrits en dur dans le code — toujours via des variables d'environnement (`.env`, lu avec `process.env.NOM_VARIABLE`), et ce fichier `.env` ne doit jamais être commité sur Git (déjà dans `.gitignore` sur Spoti-Free). Si ces identifiants fuitent, n'importe qui pourrait envoyer des emails depuis ton compte.

---

## 2026-07-05 — Spoti-Free

### 15. Responsive : un seul composant + breakpoints, vs deux composants séparés

**Contexte** : en repartant sur le redesign mobile/desktop, je connaissais déjà le CSS + `@media` classique (un seul HTML, des styles qui changent selon la largeur), mais je ne savais pas comment gérer le cas où le header/la nav mobile n'a presque rien à voir avec la version desktop (burger + menu déroulant vs boutons connexion/inscription, sidebar verticale vs barre d'onglets en bas).

**Les deux stratégies, et quand utiliser laquelle** :
- **Un seul composant + classes responsive** (Tailwind `md:`, `lg:`...) quand seuls des *nombres* changent (tailles, colonnes, marges, couleurs) mais que le contenu et le comportement restent les mêmes. C'est l'équivalent direct d'un `@media` classique, juste écrit avec des préfixes sur les classes au lieu d'un bloc séparé.
- **Deux composants séparés + une classe CSS qui choisit lequel est visible** quand le *contenu et le comportement* changent vraiment (des liens différents, un state différent — ex: un menu burger avec `useState` pour ouvrir/fermer, qui n'existe pas du tout côté desktop). Forcer les deux cas dans un seul composant avec plein de `if`/classes cachées donne un fichier qui fait deux jobs à la fois, plus dur à lire et à maintenir.

**Comment ça marche, avec un exemple générique** (nav d'un site vitrine) :

```jsx
// Les DEUX composants sont toujours rendus, en même temps.
// On ne fait PAS de `if (mobile) <NavMobile/> else <Nav/>` en JS.
<div className="md:hidden">
  <SiteNavMobile />   {/* burger + panneau, sa propre logique d'ouverture */}
</div>
<header className="hidden md:flex">
  <SiteNav />         {/* menu horizontal avec des dropdowns au survol */}
</header>
```

`md:hidden` = cette classe s'applique à partir de 768px de large (donc l'élément est caché à partir de là, visible en dessous). `hidden md:flex` = caché par défaut, redevient visible (`flex`) à partir de 768px. C'est la traduction directe de `@media (min-width: 768px) { display: none / flex }` — Tailwind n'invente rien, `md:` est un raccourci d'écriture.

**Piège si on a l'habitude d'un CSS desktop-first (`max-width`)** : ici c'est **mobile-first** — une classe *sans* préfixe s'applique à toutes les tailles (c'est la base "téléphone"), et les préfixes (`md:`, `lg:`) viennent surcharger *à partir* de cette largeur. C'est l'inverse du réflexe "je stylise le desktop puis je surcharge pour mobile".

**Pourquoi CSS plutôt que monter/démonter les composants en JS** (`useMediaQuery`, `window.matchMedia`) : pas de re-render au redimensionnement, pas de flash de contenu manquant pendant que le JS s'exécute — le navigateur gère l'affichage avant même que React ait à faire quoi que ce soit.

### 16. `display: contents` pour ne pas casser un enfant direct de CSS Grid

**Le problème** : dans une grille CSS Grid, un élément positionné avec `grid-row`/`grid-column` (ou les classes Tailwind `row-start-2`, `col-start-2`...) doit être un **enfant direct** du conteneur `display: grid`. Si on l'enveloppe dans un `<div>` (par exemple pour le cacher en dessous d'un breakpoint), c'est ce `<div>` qui devient l'enfant direct — l'élément positionné à l'intérieur perd son placement.

**Exemple générique** :
```css
.grille { display: grid; grid-template-columns: 200px 1fr; }
.item-special { grid-column: 2; } /* suppose être enfant direct de .grille */
```
```jsx
// ❌ Casse le placement : le wrapper devient l'enfant direct de la grille
<div className="wrapper">
  <div className="item-special">...</div>
</div>

// ✅ display:contents rend le wrapper "invisible" pour la mise en page :
// .item-special redevient enfant direct de .grille, comme si .wrapper n'existait pas
<div className="wrapper contents">
  <div className="item-special">...</div>
</div>
```

**Solution retenue** : pour cacher un élément grid-positionné sous un breakpoint sans casser son placement au-dessus, on combine `hidden` (le cache en dessous du breakpoint) et `contents` (le rend neutre pour le layout au-dessus) sur le même wrapper : `hidden md:contents`. En dessous du breakpoint, tout est caché ; au-dessus, le wrapper disparaît niveau layout et l'élément à l'intérieur retrouve sa position de grille normale.

---

### 17. `className` en prop : fusionner le placement du parent avec l'apparence du composant (alternative au wrapper `display:contents`)

**Contexte** : suite à l'entrée #16 — même avec `display:contents` posé au bon endroit, j'avais encore un bug de placement grid, parce que les classes de position (`row-start`, `col-start`...) étaient éclatées entre deux endroits différents : certaines sur le wrapper (mortes, à cause du `contents`), d'autres codées en dur à l'intérieur du composant lui-même. Un changement de layout demandait de fouiller à deux endroits pour comprendre où atterrissait un seul élément.

**Le concept** : plutôt que d'empiler un `<div>` wrapper autour d'un composant pour le positionner/cacher, faire accepter au composant une prop `className`, et la fusionner (via template literal) avec ses propres classes internes sur son **unique** élément racine. Le parent passe juste une string de classes comme n'importe quelle autre prop — ça ne s'applique à rien tant que le composant ne la récupère pas et ne la colle pas lui-même sur son élément.

**Exemple générique** (une carte produit dans une grille) :
```jsx
// Carte.jsx
export default function Carte({ titre, className = "" }) {
  return (
    <article className={`bg-white rounded-xl shadow p-4 ${className}`}>
      <h3>{titre}</h3>
    </article>
  );
}

// Parent.jsx — le parent choisit OÙ et QUAND, via la prop
<Carte titre="Produit A" className="hidden md:block md:col-start-2" />
```
Au final il n'y a plus qu'un seul élément DOM (`<article>`), avec une seule liste de classes fusionnée dessus — plus besoin de wrapper ni de `display:contents` pour ce cas.

**La règle de séparation à retenir** : le PARENT possède le placement (où l'élément se trouve dans SA grille/son layout) et la visibilité par breakpoint (caché ou non à telle taille d'écran) — parce que seul le parent connaît sa propre structure de layout. Le COMPOSANT possède sa propre apparence intrinsèque (couleurs, padding, arrondis, agencement interne) — ce qui ne changerait pas si le composant était réutilisé ailleurs. Test rapide pour trancher : *"si je réutilisais ce composant dans un autre parent/layout, cette classe changerait-elle ?"* Oui → elle doit venir du parent en prop. Non → elle reste écrite en dur dans le composant.

---

### 18. Valeur par défaut sur une prop déstructurée (`{ champ = "" }`) : éviter `undefined` dans un template literal

**Contexte** : suite à l'entrée #17, question sur pourquoi écrire `{ className = "" }` dans les paramètres d'un composant plutôt que juste `{ className }`.

**Le problème que ça évite** : un template literal (`` `texte ${variable}` ``) ne vérifie jamais si `variable` est vide ou non définie — il fait juste de la concaténation brute. Si la prop n'est pas fournie par l'appelant, elle vaut `undefined` en JS, et `undefined` se retrouve **littéralement écrit comme texte** dans le résultat :

```js
function Badge({ texte }) {
  return `Statut : ${texte}`;
}

Badge({}); // → "Statut : undefined"   (pas d'erreur JS, mais du texte parasite)
```

**La solution** : une valeur par défaut dans la déstructuration (`{ texte = "" }`) — une fonctionnalité JS standard, pas propre à React. Si la valeur reçue est `undefined` (donc si l'appelant n'a rien fourni), JS la remplace automatiquement par la valeur par défaut **avant** que le corps de la fonction ne s'exécute :

```js
function Badge({ texte = "" }) {
  return `Statut : ${texte}`;
}

Badge({});              // → "Statut : "        (juste vide, propre)
Badge({ texte: "OK" }); // → "Statut : OK"
```

**Pourquoi c'est utile en pratique** : ça rend la prop **optionnelle** — le composant reste utilisable même si on oublie de la passer, sans produire du texte parasite (`undefined`) ni planter. Très utile pour une prop `className` fusionnée dans un template literal (voir #17), mais s'applique à n'importe quelle prop optionnelle qui finit dans du texte concaténé.

---

### 19. `NavLink`/`isActive` : plusieurs liens qui pointent vers la même URL de secours s'allument tous en même temps

**Contexte** : une nav avec plusieurs onglets, dont certains redirigent vers une page de connexion quand l'utilisateur n'est pas authentifié (`to={user === null ? "/connexion" : "/favoris"}`). Une fois sur la page de connexion, **plusieurs onglets s'affichaient actifs en même temps** (pas juste celui censé l'être).

**La cause** : `NavLink` détermine `isActive` en comparant sa prop `to` avec l'URL actuelle — c'est tout ce qu'il sait faire. Si deux onglets différents ont, à un instant donné, la **même** valeur de `to` (ici, plusieurs replis vers `"/connexion"`), ils deviennent littéralement le même lien aux yeux du router. Ce n'est pas un bug de `NavLink` : il n'y a plus rien à distinguer, la donnée qu'on lui donne est ambiguë.

**Le vrai problème de fond** : mélanger deux responsabilités différentes dans une seule valeur — *"quel contenu cet onglet représente"* (ex: Favoris) et *"où renvoyer si l'utilisateur n'a pas le droit d'y accéder"* (Connexion). Un seul champ (`to`) ne peut pas porter ces deux informations sans perdre l'une des deux.

**Deux niveaux de solution** :
- **Rustine rapide** : neutraliser l'état actif quand la destination résolue est celle de secours (`isActive && to !== "/connexion"`) — règle le symptôme, pas la cause.
- **Bonne pratique — les vraies "routes protégées"** : chaque onglet garde **toujours** sa vraie destination (Favoris → toujours `/favoris`), et c'est la **route elle-même** qui vérifie l'authentification et redirige si besoin — pas le lien de navigation. Ça centralise la vérification à un seul endroit (une route protégée) au lieu de la dupliquer dans chaque lien de nav, et ça supprime l'ambiguïté à la source : `isActive` n'a plus jamais deux onglets pointant vers la même URL.

**Comment ça marche, avec un exemple générique** (une appli avec une page "Mon Panier" réservée aux membres) :
```jsx
// ProtectedRoute.jsx — un composant "garde" réutilisable pour n'importe quelle route privée
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ utilisateur, children }) {
  if (utilisateur === null) {
    return <Navigate to="/connexion" replace />;
  }
  return children;
}
```
```jsx
// Dans les routes de l'app
<Route
  path="/panier"
  element={
    <ProtectedRoute utilisateur={utilisateur}>
      <Panier />
    </ProtectedRoute>
  }
/>
```
```jsx
// Dans la nav — plus jamais de "to" conditionnel, chaque onglet garde sa vraie destination
<NavLink to="/panier" className={({ isActive }) => (isActive ? "actif" : "")}>
  Mon Panier
</NavLink>
```
Si l'utilisateur clique sur "Mon Panier" sans être connecté : il est envoyé sur `/panier`, `ProtectedRoute` détecte `utilisateur === null` et le redirige vers `/connexion` **avant** que `Panier` ne s'affiche. La nav, elle, n'a jamais eu besoin de connaître l'état de connexion pour savoir où pointer.

**`replace` sur `<Navigate>`** : remplace l'entrée d'historique au lieu d'en empiler une nouvelle — évite qu'un clic sur "Précédent" ramène l'utilisateur vers la page protégée qui vient de le rejeter (il retournerait sinon droit dans la redirection, en boucle).

---

### 20. Rendre le contenu d'un bouton variable sans dupliquer tout le composant : `children`

**Contexte** : un composant regroupe un bouton déclencheur + une modale + toute la logique d'envoi, et je veux le réutiliser à deux endroits différents de l'appli — mais avec une apparence différente pour le bouton (un texte à un endroit, une icône à un autre). Le contenu du bouton était codé en dur dans le JSX du composant.

**Le problème** : si le contenu du bouton est figé en dur, la seule façon de changer ce qui s'affiche dedans est de dupliquer tout le composant (bouton + modale + logique de soumission) — alors que tout le reste (l'ouverture de la modale, l'envoi du formulaire) doit rester strictement identique.

**La solution — `children`** : en React, tout ce qu'on écrit **entre les balises ouvrante et fermante** d'un composant est automatiquement transmis à ce composant via une prop spéciale appelée `children` — pas besoin de la déclarer soi-même, React la fournit toujours. Le composant peut alors décider où l'afficher dans son propre JSX (ici, à l'intérieur du `<button>`), pendant que l'appelant décide librement de ce qu'il y met.

**Exemple générique** (un bouton "ajouter au panier" réutilisé dans une fiche produit avec du texte, et dans l'en-tête du site avec juste une icône) :
```jsx
function AddToCartButton({ onAdd, children }) {
  return (
    <button className="btn" onClick={onAdd}>
      {children}
    </button>
  );
}

// Dans ProductCard.jsx
<AddToCartButton onAdd={handleAdd}>Ajouter au panier</AddToCartButton>

// Dans Header.jsx
<AddToCartButton onAdd={handleAdd}>
  <CartIcon />
</AddToCartButton>
```
`AddToCartButton` ne connaît jamais le détail de ce qu'il affiche — texte, icône, ou même plusieurs éléments combinés — il se contente de le placer dans son bouton. La logique (`onAdd`, l'état, etc.) reste écrite une seule fois, centralisée dans le composant.

**Deux écritures possibles, un seul mécanisme.** `children` reste une prop comme une autre — elle peut donc s'écrire explicitement comme n'importe quelle prop :
```jsx
<AddToCartButton onAdd={handleAdd} children={<CartIcon />} />
```
... ou en imbriquant le JSX entre les balises ouvrante et fermante, ce que React transforme automatiquement en la même prop `children` :
```jsx
<AddToCartButton onAdd={handleAdd}>
  <CartIcon />
</AddToCartButton>
```
Les deux sont strictement équivalents pour React. La forme imbriquée est presque toujours préférée en pratique : elle se lit comme du HTML classique (le contenu est visuellement "à l'intérieur" du composant, pas noyé au milieu des autres props), et elle seule permet de passer plusieurs éléments ou du texte mélangé à des balises sans avoir à tout empaqueter dans un fragment ou un tableau.

---

### 21. `useRef` plutôt que `document.getElementById` pour piloter un élément du DOM (ex: une `<dialog>`)

**Contexte** : un composant avec un bouton déclencheur et une `<dialog>` modale, ouverte via `document.getElementById("un_id").showModal()`. Ce composant est appelé à devenir réutilisable — potentiellement monté plusieurs fois en même temps sur la même page.

**Le problème** : un `id` HTML doit être unique sur toute la page. Si le même composant (donc le même `id` codé en dur dans son JSX) est monté deux fois, on se retrouve avec deux éléments partageant le même `id` — invalide en HTML, et `document.getElementById` ne renvoie que le premier trouvé. La seconde instance du composant devient inutilisable : son bouton ouvrirait la modale de l'autre instance, ou rien du tout.

**La solution — `useRef`** : au lieu de chercher l'élément dans tout le document via un identifiant global, on garde une référence directe et privée vers CET élément précis, propre à cette instance du composant. Chaque instance a son propre `ref`, donc aucune collision possible, même si le composant est copié dix fois sur la page.

**Exemple générique** (un composant de confirmation avant suppression, réutilisé à plusieurs endroits d'une appli de notes) :
```jsx
import { useRef } from "react";

function ConfirmDialog({ onConfirm }) {
  const dialogRef = useRef(null);

  return (
    <>
      <button onClick={() => dialogRef.current.showModal()}>Supprimer</button>
      <dialog ref={dialogRef}>
        <p>Confirmer la suppression ?</p>
        <button onClick={onConfirm}>Oui</button>
      </dialog>
    </>
  );
}
```
`dialogRef.current` pointe toujours vers l'élément DOM propre à cette instance précise de `ConfirmDialog`, peu importe combien de fois le composant est utilisé sur la page — contrairement à un `id`, qui est un espace de noms global partagé par toute la page.

---

## 2026-07-06 — Spoti-Free

### 22. État de chargement pendant un `fetch` : désactiver le bouton + spinner, via `finally`

**Contexte** : `Contact.jsx`, `handleSubmit` — je voulais désactiver le bouton "Envoyer" et afficher un spinner pendant l'envoi du formulaire, pour empêcher un double-clic et donner un retour visuel que ça travaille.

**Le problème à éviter** : le `try`/`catch` de `handleSubmit` a plusieurs sorties possibles — succès (`reponse.ok`), erreur renvoyée par le serveur (`if (!reponse.ok)`), ou erreur réseau (`catch`). Remettre l'état de chargement à `false` en dupliquant `setIsSending(false)` dans chacune de ces 3 branches fonctionne, mais c'est fragile : si j'ajoute une 4e branche plus tard, ou si j'oublie une des trois, le bouton reste désactivé pour toujours.

**La solution — `finally`** : un bloc `finally` après un `try`/`catch` s'exécute **toujours**, quelle que soit l'issue du `try` (retour normal, `return` anticipé dans un `if`, ou exception attrapée par le `catch`). C'est l'endroit parfait pour du "nettoyage" qui doit se produire dans tous les cas, écrit une seule fois :

```js
async function handleSubmit(event) {
  event.preventDefault();
  setIsSending(true);
  try {
    // ... requête fetch, plusieurs branches de retour possibles
  } catch (erreur) {
    // ... gestion de l'erreur réseau
  } finally {
    setIsSending(false); // s'exécute dans TOUS les cas, une seule fois
  }
}
```

Le state `isSending` sert ensuite à deux choses dans le JSX du bouton : `disabled={isSending}` (React désactive le bouton tant que c'est vrai) et un rendu conditionnel (`{isSending ? <span className="loading loading-spinner loading-md"></span> : null}`) pour afficher le spinner fourni par daisyUI plutôt que d'en fabriquer un en CSS à la main.

---

### 23. `target="_blank"` sans `rel="noopener noreferrer"` : une faille de sécurité, pas un détail optionnel

**Contexte** : `Contact.jsx`, les liens Github/LinkedIn — je voulais qu'ils s'ouvrent dans un nouvel onglet plutôt que de remplacer la page courante.

**`target="_blank"`** : dit au navigateur d'ouvrir le lien dans un nouvel onglet/fenêtre au lieu de naviguer sur la page actuelle.

**Pourquoi `rel="noopener noreferrer"` est indispensable dès qu'on met `target="_blank"`** (pas une option cosmétique) :
- Sans `noopener`, la page ouverte dans le nouvel onglet garde un accès JS à `window.opener`, c'est-à-dire à ma page d'origine — elle pourrait la rediriger vers un site de phishing pendant que je regarde l'autre onglet (attaque connue sous le nom de "tabnabbing"). `noopener` coupe ce lien.
- `noreferrer` évite en plus d'envoyer l'URL de ma page dans les headers de la requête faite vers le site externe.

```jsx
<a href="https://github.com/mon-compte" target="_blank" rel="noopener noreferrer">
  Lien Github
</a>
```

Règle simple à retenir : **jamais `target="_blank"` seul** — toujours accompagné de `rel="noopener noreferrer"`.

---

### 24. `overflow-hidden` sur un parent + page enfant sans `overflow-y-auto` = contenu qui déborde sans pouvoir défiler

**Contexte** : `Contact.jsx` était impossible à faire défiler sur mobile/tablette — le bouton "Envoyer" restait inatteignable en bas de page, alors que la même structure marchait sur `Apropos.jsx`, `Favoris.jsx`, etc.

**Le problème** : dans `App.jsx`, le `<main>` qui contient toutes les pages a `overflow-hidden` — c'est voulu, ça sert à empêcher la page entière (sidebar, header, lecteur) de défiler d'un bloc. Mais `overflow-hidden` ne fait pas que masquer le débordement, il **coupe aussi la possibilité de scroller** cet élément. Résultat : c'est à chaque page, individuellement, de définir sa propre zone de scroll interne. Toutes les autres pages du projet le faisaient déjà :

```jsx
<section className="h-full overflow-y-auto p-4 md:p-8">
  {/* contenu de la page, peut être plus haut que l'écran */}
</section>
```

`Contact.jsx` avait seulement `lg:h-full` (une hauteur définie uniquement à partir de 1024px) et aucun `overflow-y-auto`. En dessous de `lg`, la section n'avait donc ni hauteur bornée ni scroll propre : le contenu qui dépassait était simplement rogné par le `overflow-hidden` du parent, sans aucun moyen d'y accéder.

**La règle à retenir** : `overflow-hidden` sur un conteneur signifie "le scroll se gère à l'intérieur, pas ici" — dès qu'on ajoute une page/section dans ce conteneur, il faut systématiquement lui donner `h-full overflow-y-auto` (à toutes les largeurs d'écran où elle peut être plus haute que l'espace disponible), sinon le contenu excédentaire devient invisible et injoignable.

---

### 25. `align-self`/`justify-self` sur un enfant flex qui contient des enfants en largeur `%`

**Contexte** : dans `Contact.jsx`, le bloc formulaire (`<section className="bg-base-200 ... self-center">`) se retrouvait anormalement étroit sur mobile et tablette, alors que ses champs internes étaient tous en `w-full`.

**Le problème** : le parent est en `flex-col`. Par défaut, un enfant flex s'étire pour prendre toute la largeur disponible (`align-items: stretch`, appliqué à l'axe secondaire — ici horizontal, puisque l'axe principal `flex-col` est vertical). `self-center` désactive volontairement cet étirement pour **cet enfant précis**, et lui dit à la place : "prends seulement la largeur nécessaire à ton contenu."

Le piège : cet enfant contenait lui-même des champs en `w-full` (largeur en `%` relative au parent). Or un enfant en pourcentage ne peut pas servir de référence pour calculer la largeur "nécessaire" de son propre parent — c'est une dépendance circulaire que le navigateur résout en ignorant ces enfants-là pour le calcul, et en se basant sur d'autres éléments (texte, bouton) qui ne dictent pas la largeur voulue. Résultat : une boîte plus étroite que prévu, sans rapport évident avec le CSS écrit.

**La solution** : ne jamais utiliser `self-center` (ou `justify-self` côté grid) sur un conteneur qui doit s'étirer pleine largeur ET contenir des enfants en `%`. Ici, la vraie intention était de centrer verticalement le bloc *seulement* dans le layout en grille 2 colonnes du desktop (`lg:`) — pas de changer sa largeur sur mobile :

```jsx
<section className="bg-base-200 rounded-2xl p-8 h-fit w-full lg:self-center">
```

`w-full` explicite règle le cas par défaut, et `lg:self-center` ne s'applique qu'à partir du breakpoint où le centrage a réellement du sens.

---

## 2026-07-13 — Spoti-Free

### 26. `toLocaleDateString` — formater une date lisible à partir d'une chaîne ISO

**Concept** (demande de cours, exemple générique) : une API renvoie souvent une date sous forme de chaîne ISO (ex: `"2026-07-13T10:00:00.000Z"`), qui n'est qu'une chaîne de caractères, pas exploitable directement pour un affichage propre.

```js
const article = { titre: "Mon article", publieLe: "2026-07-13T10:00:00.000Z" };

new Date(article.publieLe).toLocaleDateString("fr-FR");
// → "13/07/2026"
```

Deux étapes :
1. `new Date(article.publieLe)` construit un vrai objet `Date` JS à partir de la chaîne.
2. `.toLocaleDateString("fr-FR")` formate cette date selon les conventions françaises (jour/mois/année), au lieu du format US par défaut.

Un deuxième argument (objet d'options) permet un format plus détaillé :

```js
new Date(article.publieLe).toLocaleDateString("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
// → "13 juillet 2026"
```

---

### 27. `useEffect` — pourquoi, quand il se relance, et pourquoi jamais l'appeler conditionnellement

**Concept** (demande de cours, exemple générique) : une fonction composant React doit rester *pure* pendant le rendu — pas d'effet de bord (requête réseau, timer, abonnement, manipulation directe du DOM) exécuté directement dans son corps, sinon ça se déclencherait à chaque rendu de façon incontrôlée. `useEffect` sert à dire à React : *"une fois le rendu affiché à l'écran, exécute ce code"* — l'effet tourne donc après le rendu, pas pendant.

```jsx
function FicheProduit({ produitId }) {
  const [produit, setProduit] = useState(null);

  useEffect(() => {
    if (!produitId) return; // garde-fou : rien à charger

    fetch(`/api/produits/${produitId}`)
      .then((res) => res.json())
      .then((data) => setProduit(data));
  }, [produitId]);

  return <p>{produit?.nom}</p>;
}
```

**Le tableau de dépendances contrôle QUAND l'effet se relance** :
- pas de tableau → l'effet tourne après CHAQUE rendu (rarement voulu, risque de boucle) ;
- `[]` → l'effet tourne une seule fois, juste après le premier rendu (le montage) ;
- `[produitId]` → l'effet tourne au montage, ET à chaque fois que `produitId` change entre deux rendus. Avec `[]` à la place, le composant resterait bloqué sur les données du tout premier `produitId` chargé, même si la prop change ensuite — erreur fréquente.

**Pourquoi le garde-fou (`if (!produitId) return;`) doit être DANS l'effet, jamais autour** (par exemple `if (produitId) { useEffect(...) }` est interdit) : React repère chaque hook par sa position dans l'ordre d'appel, qui doit être identique à chaque rendu. Si l'appel du hook devient conditionnel, cet ordre peut changer d'un rendu à l'autre et React perd le fil. La condition va donc toujours à l'intérieur de la fonction callback, jamais autour du hook lui-même.

**Le nettoyage** (`return` d'une fonction dans l'effet) — utile dès qu'un effet s'abonne à quelque chose (event listener, timer, websocket) :

```jsx
useEffect(() => {
  function handleResize() {
    console.log(window.innerWidth);
  }
  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);
```

Sans ce nettoyage, chaque réaffichage ou démontage du composant ajouterait un nouveau listener sans retirer l'ancien → fuite mémoire, comportements en double.

---

### 28. Installer un thème (shadcn/tweakcn) ne suffit pas : le contraste vient des **tokens de surface**, pas des couleurs

**Contexte** : après avoir migré vers shadcn/ui et installé le thème "Midnight Bloom" de tweakcn dans `index.css`, l'app restait quasiment toute noire, sans contraste, alors que le thème est censé être coloré (violet/bleu/indigo).

**Problème** : je pensais que le thème était mal installé ou qu'il manquait des couleurs. En réalité les tokens étaient **corrects** dans `index.css` — les valeurs oklch correspondaient exactement au preset officiel (`--primary` = `#6c5ce7` violet, `--card` = `#2f3436` gris, `--accent` = `#6495ed` bleu). Le problème n'était pas les couleurs **définies**, mais les couleurs **utilisées** :

1. `App.jsx` gardait `bg-zinc-900` sur le `<main>` — un gris Tailwind brut, **hors du thème**, et par-dessus le marché plus sombre que la sidebar. Les deux zones se fondaient donc l'une dans l'autre.
2. Le token `--card` (le gris du thème, celui qui apporte justement le contraste) n'était utilisé **nulle part** dans le contenu : les `TrackRow` n'avaient un fond qu'au survol (`hover:bg-card`), donc au repos elles flottaient directement sur `--background`. D'où le grand aplat noir.

**La leçon** : dans un design system type shadcn, les couleurs ne sont pas décoratives, elles ont un **rôle sémantique**. Ce sont ces rôles qui construisent la profondeur :

- `background` → le fond de l'app (le niveau le plus bas) ;
- `card` / `popover` / `sidebar` → les **panneaux** posés sur ce fond ;
- `muted` → les éléments neutres à l'intérieur d'un panneau ;
- `primary` / `accent` / `secondary` → l'identité et les interactions ;
- `destructive` → **uniquement** les actions destructrices.

Une classe Tailwind brute (`bg-zinc-900`, `bg-black`) court-circuite tout ce système : elle ne changera jamais avec le thème, et elle ne "sait" pas où elle se situe dans la hiérarchie. **Règle à garder** : dans un projet themé, aucune couleur en dur — que des tokens.

**Sur les rôles couleur** : le seul élément vraiment coloré de ma Home était le bouton **rouge** "Se déconnecter" (`destructive`). L'œil était donc attiré par la pire action de la page. Le rouge est un signal, pas une décoration : il se réserve aux suppressions réelles. La déconnexion est redevenue discrète (grise, rouge seulement au survol).

---

### 29. Le contraste est **relatif** : un enfant `bg-card` dans un parent `bg-card` est invisible

**Contexte** : en corrigeant le point précédent, j'ai mis le `<main>` en `bg-card` (le gris du thème) pour le détacher du fond. Mais du coup, tous les blocs qui étaient **déjà** en `bg-card` à l'intérieur (les cartes de `Card.jsx`, le formulaire de `Contact.jsx`, les blocs de stats de `Profil.jsx`, le toggle liste/grille de `Bibliotheque.jsx`) sont devenus **invisibles** : même couleur que leur parent.

**Le piège** : on pense une couleur "en absolu" (`bg-card` = gris = ça se voit), alors qu'une surface ne se voit **que par différence avec ce qu'il y a derrière**. `bg-card` sur du noir ressort ; `bg-card` sur du `bg-card`, ça n'existe plus.

**Solution** : une fois le panneau passé en surface claire, ses enfants doivent aller dans l'**autre sens** — plus sombres — pour se "creuser" dedans :

```jsx
// AVANT — la carte a la même couleur que le panneau qui la contient : invisible
<article className="bg-card rounded-2xl p-3">

// APRÈS — la carte se creuse dans le panneau clair
<article className="bg-background/50 border border-border rounded-2xl p-3">
```

D'où la hiérarchie que je garde maintenant pour ce projet (notée aussi dans `SUIVI-PROJET.md`) :
- `bg-background` → le fond de l'app, la "gouttière" entre les panneaux ;
- `bg-card` / `bg-sidebar` + `border-border` → les panneaux (le `main`, l'`Aside`, le `MediaPlayer`) ;
- `bg-background/50` + `border-border` → ce qui vit **à l'intérieur** d'un panneau.

**À retenir** : quand on change la couleur d'un conteneur, il faut re-vérifier tous ses enfants — le contraste n'est jamais une propriété d'un élément seul, toujours d'une **paire** (élément + ce qu'il y a derrière).

---

### 30. Un composant ne doit pas figer le style de son propre déclencheur

**Contexte** : `ButtonAddPlaylist.jsx` est utilisé à deux endroits — dans l'`Aside` (juste une icône `+`) et sur la page Playlists (un bouton texte "Ajouter une playlist"). Sur la page Playlists, le bouton **débordait de l'écran**.

**Problème** : le composant imposait le style de son bouton déclencheur en dur, quel que soit son contenu :

```jsx
// le trigger est TOUJOURS un petit bouton carré d'icône...
<DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
  {children}   {/* ...même quand children = "Ajouter une playlist" */}
</DialogTrigger>
```

`size="icon-sm"` donne un bouton carré dimensionné pour une icône. En lui passant un texte long, le texte ne rentre pas et sort du cadre.

**Solution** : ce qui **varie selon le contexte d'appel** ne doit pas être codé en dur dans le composant, mais exposé en prop (avec une valeur par défaut pour ne pas casser l'usage existant) :

```jsx
export default function ButtonAddPlaylist({
  children = "",
  variant = "ghost",     // défaut : l'usage historique (icône dans l'Aside)
  size = "icon-sm",
  className = "",
  ...
}) {
  ...
  <DialogTrigger render={<Button variant={variant} size={size} className={className} />}>
```

L'appelant décide alors de la présentation, sans que le composant ait à connaître ses contextes d'usage :

```jsx
<ButtonAddPlaylist variant="default" size="default" className="rounded-full">
  Ajouter une playlist
</ButtonAddPlaylist>
```

**Le principe général** : un composant réutilisable gère la **logique** (ici : ouvrir la modale, faire le `POST`, mettre à jour la liste). La **présentation** de son point d'entrée dépend de l'endroit où on le pose — donc elle se paramètre. Quand on se retrouve à vouloir dupliquer un composant juste pour changer un `size`, c'est le signe qu'une prop manque.

---

### 31. Un `useEffect` avec `[]` qui lit `localStorage` : l'état ne se resynchronise jamais après connexion

**Contexte** : bug constaté sur les likes — certaines musiques refusaient d'être likées ("Erreur lors de l'ajout du like"), d'autres non. Et après un `F5`, tout remarchait. Symptôme déroutant, mais la cause est nette.

**Le code en cause** (`App.jsx`) :

```jsx
useEffect(() => {
  const token = localStorage.getItem("token");   // ← lu UNE seule fois
  fetch("http://localhost:3000/api/users/likes", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((r) => r.json())
    .then((data) => setMusiquesLikee(Array.isArray(data) ? data : []));
}, []);                                           // ← ne se relance jamais
```

**L'enchaînement** :
1. J'arrive sur l'app **déconnecté** → l'effet tourne, pas de token → le backend répond 404 → `musiquesLikee = []`.
2. Je me connecte → `setToken`/`setUser` provoquent un re-render… **mais l'effet ne se relance pas** (dépendances `[]`). `musiquesLikee` reste **vide**.
3. Donc **tous** les cœurs s'affichent vides — y compris ceux des musiques que j'avais déjà likées.
4. Je clique sur l'un d'eux → le front croit qu'elle n'est pas likée → `INSERT` → mais la table `likes` a une clé primaire `(id_user, id_music)` → **violation de contrainte** → le backend renvoie 500, le like échoue.

Et au `F5`, l'app se remonte **avec** le token déjà dans `localStorage` : l'effet le trouve, charge les likes, tout est cohérent. D'où l'impression que le bug est aléatoire.

**Ce que ça m'apprend** : `localStorage` n'est **pas réactif**. Le lire dans un effet ne crée aucun lien entre sa valeur et React — React ne "voit" pas que le token a changé. La source de vérité réactive, c'est le **state** (`token`), et c'est lui qui doit figurer dans les dépendances :

```jsx
// exemple générique
useEffect(() => {
  if (!jeton) return;              // le garde-fou va DANS l'effet (cf. note 27)
  chargerLesDonnees(jeton);
}, [jeton]);                       // ← se relance quand le jeton change
```

**La règle** : tout ce que l'effet **utilise** et qui peut **changer** doit être dans le tableau de dépendances. Si une valeur est lue "hors React" (`localStorage`, une variable globale), l'effet ne se resynchronisera pas quand elle change — il faut passer par un state.

**À noter aussi** : ce bug de front a été *masqué* par un défaut de backend. Un doublon devrait renvoyer un **409 Conflict** ("cette musique est déjà dans tes favoris"), pas un **500** ("erreur serveur"). Un 500 dit "quelque chose a cassé chez moi" ; un 409 dit "ta demande entre en conflit avec l'état actuel" — c'est une information exploitable, qui m'aurait mis sur la piste tout de suite.

---

## 2026-07-13 — Spoti-Free (audit complet de l'application)

### 32. Une route sans middleware est une porte ouverte : le cas de mon catalogue

**Contexte** : audit de sécurité du backend, route par route.

**Le problème** : dans `musicRoute.js`, trois routes n'avaient **aucun middleware** :

```js
router.post("/ajouter", async (req, res) => { ... });        // ← rien
router.put("/update/:id", async (req, res) => { ... });      // ← rien
router.delete("/delete/:id", async (req, res) => { ... });   // ← rien
```

Testé en conditions réelles : **sans le moindre token**, j'ai pu créer une musique, la modifier, puis la supprimer. N'importe qui connaissant l'URL pouvait vider tout le catalogue.

Pourquoi je ne l'avais pas vu : **le frontend n'appelle jamais ces routes**. Aucun bouton "supprimer une musique" n'existe dans l'interface. J'ai donc raisonné comme si elles étaient inaccessibles — alors qu'une API HTTP est publique par nature. Un `curl` suffit. **Ce n'est pas parce qu'un bouton n'existe pas dans l'UI que l'action est protégée.** La sécurité est *forcément* côté serveur.

**La correction — authentification ≠ autorisation.** Deux questions distinctes :
- **Qui es-tu ?** → `authMiddleware` : le token est-il valide ? Sinon **401 Unauthorized**.
- **As-tu le droit ?** → `adminMiddleware` : ton rôle t'autorise-t-il cette action ? Sinon **403 Forbidden**.

D'où l'enchaînement (l'ordre compte : le second s'appuie sur `req.user` posé par le premier) :

```js
router.delete("/delete/:id", authMiddleware, adminMiddleware, async (req, res) => { ... });
```

Il n'existait pas de notion de rôle : le code testait `if (idUser !== 10)` en dur. J'ai ajouté une colonne `users.role` (`'user' | 'admin'`).

**Détail qui compte : le rôle est relu en base à chaque requête**, pas lu dans le JWT. Un JWT est *signé*, donc non falsifiable — mais il est **figé** jusqu'à son expiration. Si j'y mettais `role: "admin"` et que je retirais les droits à quelqu'un, son token continuerait de le déclarer admin pendant 24h. Relire en base coûte une requête, mais un retrait de droits prend effet immédiatement.

---

### 33. `req.body` peut être `undefined` : la validation front ne protège que le navigateur

Deux découvertes de l'audit, liées par la même idée.

**a) L'API acceptait n'importe quoi.** En appelant directement le backend :

```
POST /api/users/inscription  { password: "a" }              → 201 Created
POST /api/users/inscription  { email: "pas-un-email" }      → 201 Created
```

Pourtant mon formulaire a bien un `type="email"` et une vérification du mot de passe en React. Mais **ces contrôles ne s'exécutent que dans le navigateur** : un `curl`, Postman ou un script les contourne entièrement. Le formulaire sert le confort de l'utilisateur (feedback immédiat) ; **la seule validation qui protège les données est celle du serveur**. Les deux ne sont pas redondantes, elles n'ont pas le même rôle.

**b) Une requête sans `Content-Type` faisait planter la route en 500.** Avec Express 5, `express.json()` ne renseigne `req.body` **que si** la requête porte `Content-Type: application/json`. Sinon `req.body` vaut `undefined`, et la première ligne qui fait :

```js
const nom = req.body.nom;   // TypeError: Cannot read properties of undefined
```

part dans le `catch` → **500 "Erreur serveur"**, alors que la vraie réponse est **400 "requête malformée"**. Un 500 dit "j'ai un bug chez moi", un 400 dit "ta requête est invalide" : confondre les deux envoie le débogage dans la mauvaise direction.

Corrigé une fois pour toutes dans `server.js`, plutôt que route par route :

```js
app.use(express.json());
app.use((req, res, next) => {
  if (!req.body) req.body = {};   // garantit un objet, quel que soit le Content-Type
  next();
});
```

---

### 34. `createConnection` vs `createPool` : un point de rupture unique

**Contexte** : `db.js` utilisait `mysql.createConnection()` — **une seule** connexion TCP, ouverte au démarrage et gardée à vie.

**Le problème** : c'est un *single point of failure*. Si MySQL ferme cette connexion (timeout d'inactivité, redémarrage du serveur, coupure réseau), elle n'est **pas rétablie** : toutes les requêtes suivantes échouent jusqu'à ce que je redémarre Node à la main. En local ça ne se voit pas ; en production, l'app tombe toute seule au bout de quelques heures d'inactivité.

Second problème : une connexion unique **sérialise** les requêtes. Deux utilisateurs simultanés attendent chacun leur tour.

**La solution** — un *pool* : un ensemble de connexions gérées automatiquement. Il en ouvre à la demande, les réutilise, et **en recrée une si l'une tombe**.

```js
const db = mysql.createPool({
  host: process.env.DB_HOST,
  // ...
  waitForConnections: true,
  connectionLimit: 10,   // 10 connexions max en parallele
  queueLimit: 0,         // file d'attente illimitee au-dela
});
```

Bonne surprise : **l'API est identique** (`db.query(...)`), donc aucune route n'a eu à changer. Seule subtilité, le pool est *paresseux* — il n'ouvre rien tant qu'on ne lui demande pas de connexion. Je force donc un `getConnection()` au démarrage pour vérifier tout de suite que la base répond, au lieu de le découvrir à la première requête d'un utilisateur.

---

### 35. Un `404` n'est pas un « je n'ai rien trouvé » : liste vide ≠ ressource inexistante

**Contexte** : plusieurs routes renvoyaient `404` quand l'utilisateur n'avait **aucun** like / aucune playlist :

```js
if (playlists.length === 0) {
  return res.status(404).json({ message: "Aucune playlist." });  // ← faux
}
```

**Pourquoi c'est faux** : `404 Not Found` signifie « **la ressource que tu demandes n'existe pas** » (mauvaise URL). Or ici l'URL `/api/playlists` existe parfaitement, le serveur l'a traitée avec succès, et la réponse — « tu as zéro playlist » — est une **information valide**. Une collection vide est un résultat normal, pas une erreur. La bonne réponse est donc :

```js
return res.status(200).json(playlists);   // 200 avec []
```

**La conséquence concrète côté front** : mon code était obligé de traiter un cas d'erreur qui n'en était pas un (`if (Array.isArray(data))… else []`), et une vraie erreur devenait indiscernable d'une liste vide.

**La règle générale** : le code de statut décrit **ce qui est arrivé à la requête**, pas le contenu de la réponse.
- `200` — requête traitée. Le corps peut très bien être vide (`[]`).
- `400` — la requête est malformée (**c'est le client qui a tort**).
- `401` — pas authentifié (« je ne sais pas qui tu es »).
- `403` — authentifié mais pas autorisé (« je sais qui tu es, et tu n'as pas le droit »).
- `404` — la ressource demandée n'existe pas.
- `409` — conflit avec l'état actuel (ex : ce like existe déjà).
- `500` — **le serveur a planté** : à réserver aux vrais bugs, jamais à un cas métier prévu.

C'est exactement ce qui m'avait égaré sur le bug des likes : un doublon renvoyait `500` (« erreur serveur ») alors que c'était un `409` (« ça existe déjà »). Le mauvais code de statut m'a fait chercher un bug serveur là où il y avait une règle métier.

---

### 36. `1fr` en CSS Grid ne veut pas dire « au maximum une fraction »

**Contexte** : avec beaucoup de playlists, l'Aside grandissait et faisait déborder toute l'app au-delà de l'écran. J'avais pourtant mis un `overflow-y-auto` sur la liste — et il ne s'activait **jamais**.

**Le shell de l'app** :

```jsx
<section className="h-screen md:grid md:grid-rows-[1fr_88px]">
  <aside>…liste des playlists…</aside>   {/* ligne 1 : 1fr */}
  <MediaPlayer />                         {/* ligne 2 : 88px */}
</section>
```

**Le piège** : `1fr` n'est **pas** « occupe une fraction de la place disponible, et pas plus ». C'est un raccourci pour :

```css
minmax(auto, 1fr)
```

Et ce **`auto` en minimum** signifie « **ne descends jamais en dessous de la taille de ton contenu** ». Donc quand la liste s'allongeait, la ligne grandissait avec elle, l'aside grandissait, la grille grandissait, et l'app dépassait la hauteur de l'écran.

Du coup, mon `overflow-y-auto` ne pouvait rien faire : **un conteneur ne scrolle que s'il a une hauteur maximale**. Ici, aucune contrainte ne l'empêchait de s'étirer indéfiniment — il n'y avait donc jamais de « trop-plein » à faire défiler.

**La correction** — autoriser explicitement la ligne à rétrécir sous son contenu :

```jsx
md:grid-rows-[minmax(0,1fr)_88px]
```

Vérifié avec 15 playlists : la page fait exactement la hauteur de l'écran (900px pour 900px), et la liste défile à l'intérieur.

**Le même piège existe en Flexbox**, avec un nom différent : un élément flex a `min-height: auto` par défaut, d'où le fameux `min-h-0` qu'on ajoute sur les enfants flex qui doivent scroller. C'est exactement la même idée : *par défaut, un élément CSS refuse de devenir plus petit que son contenu — il faut le lui permettre explicitement.*

**La leçon à garder** : quand un `overflow-y-auto` « ne marche pas », la cause n'est presque jamais l'`overflow` lui-même — c'est qu'**aucun parent ne contraint la hauteur**. Remonter la chaîne des parents jusqu'à trouver celui qui s'étire.

---

### 37. Centraliser les appels réseau : un seul endroit pour le token, l'URL et les erreurs

**Contexte** : chaque composant faisait son `fetch` dans son coin :

```jsx
const token = localStorage.getItem("token");
const reponse = await fetch("http://localhost:3000/api/users/like/" + idMusic, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});
```

Répété dans une quinzaine de fichiers. Trois problèmes, tous réglés par un module unique (`src/lib/api.js`) :

**a) L'URL en dur rendait le déploiement impossible.** `http://localhost:3000` était écrit dans 14 fichiers : mettre le projet en ligne aurait voulu dire les éditer un par un. Elle vient maintenant d'une variable d'environnement (`VITE_API_URL`), avec le localhost en valeur par défaut pour le dev. Règle : **tout ce qui change selon l'environnement (URL, clé, port) sort du code.**

**b) La logique du token était dupliquée** partout. Un seul endroit la porte désormais.

**c) Surtout : personne n'interceptait les `401`.** Quand le token expirait, chaque composant affichait bêtement le message brut de l'API (« Token invalide ») et l'utilisateur restait coincé dans une session morte. Maintenant, **tout** `401` — d'où qu'il vienne — purge la session :

```js
const reponse = await fetch(`${BASE_URL}${chemin}`, { …ajoute le token… });

if (reponse.status === 401) {
  surSessionExpiree?.();   // callback enregistré par App
}
```

**Le point de conception à retenir** : `api.js` ne connaît **pas** React. Il ne fait pas d'`import` de mon state, il expose un **callback** (`definirSurSessionExpiree`) que `App` enregistre au montage. La dépendance va dans un seul sens (App → api), jamais l'inverse. Un module bas niveau ne doit jamais dépendre de la couche au-dessus de lui.

**Conséquence inattendue et intéressante** : je pensais avoir besoin d'un `AuthContext` pour partager le token. **Il n'est plus nécessaire du tout** — puisque `apiFetch` gère le token lui-même, plus aucun composant n'a besoin de le connaître. Un bon découpage supprime le besoin d'une abstraction, au lieu d'en ajouter une.

**Détail d'UX qui compte** : au début, deux toasts s'affichaient à l'expiration — « Token invalide » (le message de l'API, remonté par le composant) puis « Ta session a expiré ». J'ai ajouté un helper `messageErreur(reponse, donnees)` qui renvoie `null` sur un 401 : le message technique de l'API n'a rien à faire sous les yeux de l'utilisateur quand un message clair est déjà affiché.

---

### 38. bcrypt ne protège pas du brute-force : il faut limiter le nombre de tentatives

**Contexte** : ma route `/connexion` hache bien les mots de passe avec bcrypt et compare avec `bcrypt.compare`. Je pensais donc l'authentification « sécurisée ». Elle ne l'était pas.

**Ce que bcrypt fait — et ne fait pas.** bcrypt protège les mots de passe **si la base fuite** : les hachages sont lents à casser. Mais il **n'empêche pas** un attaquant de tester des mots de passe via l'API. Il ralentit chaque tentative (~100ms), ce qui n'arrête personne : un script tourne en boucle et teste les mots de passe les plus courants, indéfiniment. Rien dans mon code ne l'en empêchait.

**La correction** — limiter le nombre de tentatives par IP (`express-rate-limit`) :

```js
const limiteConnexion = rateLimit({
  windowMs: 15 * 60 * 1000,        // fenetre de 15 minutes
  limit: 10,                        // 10 tentatives max
  skipSuccessfulRequests: true,     // ← seuls les ECHECS comptent
});

router.post("/connexion", limiteConnexion, async (req, res) => { … });
```

Au-delà, l'API répond **429 Too Many Requests**.

**Le détail qui fait la différence : `skipSuccessfulRequests`.** Sans lui, quelqu'un qui se connecte et se déconnecte souvent finirait bloqué alors qu'il n'a rien fait de mal. En ne comptant que les **échecs**, la limite ne gêne que celui qui cherche à deviner un mot de passe.

**À prévoir au déploiement** : `express-rate-limit` identifie les clients par leur IP. Derrière un reverse proxy (Nginx, hébergeur), toutes les requêtes semblent venir de l'IP **du proxy** — la limite bloquerait alors tout le monde d'un coup. Il faut `app.set("trust proxy", 1)` pour qu'Express lise la vraie IP dans l'en-tête `X-Forwarded-For`.

---

### 39. Un lien n'est pas un bouton (même s'il en a l'air)

**Contexte** : mes boutons "Connexion" et "Me contacter" utilisaient le composant `Button` de shadcn en lui demandant de se rendre comme un lien :

```jsx
<Button nativeButton={false} render={<Link to="/connexion" />}>
  Connexion
</Button>
```

Le HTML produit : `<a href="/connexion" role="button">`.

**Le problème** : `role="button"` **écrase** la sémantique naturelle de l'élément. Un lecteur d'écran annonce « bouton », alors que l'élément **navigue** vers une autre page. Or les deux ne se comportent pas pareil pour l'utilisateur :

- un **lien** navigue → on peut l'ouvrir dans un nouvel onglet, le copier, y revenir avec « Précédent » ;
- un **bouton** déclenche une action → il s'active avec `Espace`, un lien avec `Entrée` uniquement.

Annoncer « bouton » sur quelque chose qui navigue, c'est mentir sur ce qui va se passer.

**La correction** — le pattern officiel de shadcn : ne pas utiliser le composant `Button`, mais **styler un vrai lien** avec ses classes :

```jsx
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

<Link to="/connexion" className={cn(buttonVariants(), "rounded-full px-6")}>
  Connexion
</Link>
```

Résultat : exactement la même apparence, mais un vrai `<a>` sans `role` trafiqué.

**La règle générale** : l'apparence et la sémantique sont deux choses distinctes. **On choisit la balise pour ce que l'élément *fait*, puis on lui donne l'apparence qu'on veut avec du CSS.** L'attribut `role` sert à *décrire* un élément qui n'a pas de balise native adaptée — jamais à en déguiser un qui en a déjà une.

(Petit bonus : mes tests Playwright cherchaient `getByRole('button', {name:'Connexion'})` et ont commencé à échouer après ce changement. C'est **la preuve que le correctif marche** — l'élément est enfin annoncé comme un lien, exactement comme le verrait un lecteur d'écran.)

---

### 40. Toute route qui déclenche une action coûteuse doit être limitée

**Contexte** : question posée à Claude — « l'app est-elle prête à être déployée ? ». Elle ne l'était pas, et le point le plus grave était celui auquel je pensais le moins : **mon formulaire de contact**.

**Le problème** : `POST /api/contact` envoie un **vrai mail** vers ma boîte Gmail, à chaque appel, sans aucune limite. J'avais bien mis un rate limiter sur la connexion (contre le brute-force) et sur l'inscription — mais pas là, parce que je ne voyais pas le formulaire de contact comme « sensible ».

Or il l'est, et pour une raison qui n'a rien à voir avec la sécurité des données : **il déclenche une action qui coûte cher**. Une fois le site en ligne, n'importe quel bot (ils scannent les formulaires de contact en permanence) peut boucler dessus et m'envoyer des milliers de mails. Au mieux ma boîte est noyée, au pire Google suspend mon compte pour envoi abusif.

**Le bon réflexe** : ne pas se demander « cette route est-elle sensible ? » mais **« que se passe-t-il si quelqu'un l'appelle 10 000 fois de suite ? »**. Toute route qui envoie un mail, écrit en base, appelle une API payante ou consomme du CPU mérite une limite.

```js
const limiteContact = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  skipFailedRequests: true,   // ← ne compter que les envois qui ont REELLEMENT abouti
});

router.post("/", limiteContact, async (req, res) => { … });
```

**`skipFailedRequests` compte ici autant que la limite elle-même** : sans lui, un visiteur qui se trompe trois fois de format d'email serait bloqué une heure **sans avoir rien envoyé**. On ne compte que ce qui coûte réellement quelque chose. La limite doit gêner l'abus, jamais l'usage normal.

Au passage, deux autres trous sur cette même route : le format de l'email n'était pas vérifié côté serveur (le `replyTo` du mail pouvait donc contenir n'importe quoi), et rien ne bornait la taille du message (on pouvait envoyer plusieurs Mo).

---

### 41. `cors()` sans option ouvre l'API à tout Internet

**Contexte** : mon `server.js` avait `app.use(cors())`. Je l'avais mis « pour que ça marche » quand le front n'arrivait pas à appeler l'API — sans jamais me demander ce que ça autorisait exactement.

**Ce que fait CORS** : par défaut, un navigateur **interdit** à une page servie par `site-a.com` de lire la réponse d'une requête vers `site-b.com`. C'est une protection du navigateur. Les en-têtes CORS sont la façon dont le serveur dit : « j'accepte que telle origine me lise ».

**`cors()` sans argument répond donc « j'accepte tout le monde »** (`Access-Control-Allow-Origin: *`). N'importe quel site peut faire appeler mon API par le navigateur de ses visiteurs.

**La correction** — n'autoriser que l'origine de mon front :

```js
const originesAutorisees = [
  process.env.FRONTEND_URL,      // ex: https://spotifree.fr
  "http://localhost:5173",       // le dev
].filter(Boolean);

app.use(cors({ origin: originesAutorisees, credentials: true }));
```

**Ce que CORS ne fait PAS — et c'est le point important** : ce n'est **pas** une protection de l'API. CORS est appliqué par le **navigateur**, pas par le serveur. Un `curl`, un script Node ou Postman s'en moquent totalement et pourront toujours appeler mes routes.

Autrement dit : CORS empêche *le site d'un tiers* d'utiliser la session de mes visiteurs à leur insu. **Il ne remplace jamais l'authentification et les autorisations côté serveur** (voir note 32). Les deux sont nécessaires, et répondent à deux menaces différentes.

---

### 42. Une protection ne doit jamais pouvoir être désactivée par une variable oubliée

**Contexte** : ma suite de tests crée une dizaine de comptes à chaque exécution… et se faisait donc **bloquer par ma propre protection anti-abus** (20 inscriptions/heure). Il fallait pouvoir la couper pour les tests.

**Le piège** : la solution évidente est une variable d'environnement.

```js
// DANGEREUX
skip: () => process.env.RATE_LIMIT_DISABLED === "1",
```

Le problème est évident dès qu'on y pense : le jour où ce `.env` est copié vers le serveur de production (ou qu'on colle une config en vitesse), **toutes les protections tombent, silencieusement**. Rien ne le signale : le site fonctionne parfaitement… et n'est plus protégé.

**La correction** — verrouiller l'échappatoire sur l'environnement :

```js
export const limitesDesactivees =
  process.env.NODE_ENV !== "production" &&      // ← le verrou
  process.env.RATE_LIMIT_DISABLED === "1";
```

Même si `RATE_LIMIT_DISABLED=1` se retrouve dans le `.env` de production, il est **sans effet**.

**Le principe général** : un mécanisme de confort (mode debug, désactivation d'une protection, données de test, logs verbeux) doit être **structurellement impossible** à activer en production — pas seulement « on fait attention à ne pas le faire ». On ne se protège pas d'une erreur humaine avec de la discipline, mais avec du code qui rend l'erreur inoffensive.

C'est la même logique que le filtre de mes tests, qui ne supprime que les comptes dont l'email commence par `e2e-test+` : même si le script part en vrille, il ne *peut pas* toucher un vrai compte.

---

### 43. Des tests qui tournent contre la vraie application (et pourquoi ça change tout)

**Contexte** : tous les tests écrits pendant l'audit étaient temporaires, dans un dossier jetable. Ils ont été versionnés dans `tests/`.

**Le choix technique** : pas de Jest, pas de Vitest. Les tests s'exécutent contre l'**application réellement démarrée** (backend + frontend + MySQL) : un simple script Node suffit, et ça évite une dépendance de plus.

Deux suites, qui ne testent pas la même chose :

- **`e2e.test.mjs`** — les parcours, dans un vrai navigateur (Playwright). *Est-ce que l'app fait ce qu'elle doit faire ?*
- **`securite.test.mjs`** — l'API attaquée **directement**, sans passer par l'interface. C'est le point de vue d'un attaquant : il n'utilise pas mes boutons, il envoie des requêtes. C'est exactement comme ça que la faille du catalogue avait été trouvée — les routes n'étaient appelées par aucun bouton, je les croyais donc inaccessibles.

**Ce que j'en retiens surtout : le test de non-régression.** Chaque bug corrigé pendant l'audit est devenu un test :

```js
verifier(
  "reconnexion : les coeurs des titres deja likes sont pleins",
  pleins === 1,
);
```

Ce test-là **échouait** avant le correctif. Il passe maintenant. Si je casse à nouveau la logique des `useEffect`, il redeviendra rouge immédiatement. **Un bug corrigé sans test peut revenir ; un bug corrigé avec un test est verrouillé.**

**Deux détails de conception qui comptent :**

1. **Le code de sortie.** `process.exitCode = 1` s'il y a un échec. Sans ça, une CI verrait le script se terminer « normalement » et croirait que tout va bien, alors que des tests sont rouges.

2. **Un test doit être honnête sur ce qu'il ne teste pas.** Quand les limites anti-abus sont désactivées (pour que la suite puisse créer ses comptes), le test anti brute-force ne peut évidemment pas passer. Il est alors **ignoré avec un avertissement visible**, plutôt que « adapté » pour passer quand même. Un test vert qui ne vérifie rien est pire que pas de test : il donne une fausse confiance.

---
