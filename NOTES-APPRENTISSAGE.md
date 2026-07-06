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
