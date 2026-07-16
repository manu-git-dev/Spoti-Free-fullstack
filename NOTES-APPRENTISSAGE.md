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

### 44. Recevoir un fichier d'un inconnu : l'extension ne prouve rien

**Contexte** : fonctionnalité de dépôt de musique. Jusqu'ici, tout ce qu'un utilisateur pouvait m'envoyer, c'était du **texte**. Là, c'est un **binaire** — et ça change complètement la nature des risques.

**Les trois pièges, et comment ils se referment :**

**a) Le nom du fichier.** Le réflexe naturel est de garder le nom d'origine :

```js
filename: (req, fichier, cb) => cb(null, fichier.originalname);   // ← DANGEREUX
```

Un nom comme `../../server.js` fait alors écrire multer **en dehors** du dossier prévu, et peut **écraser mon code** (attaque par *path traversal*). La règle : **on régénère toujours le nom soi-même.**

```js
cb(null, `${crypto.randomUUID()}${path.extname(fichier.originalname).toLowerCase()}`);
```

**b) L'extension et le `Content-Type` ne prouvent RIEN.** Les deux viennent du client. Renommer `virus.txt` en `musique.mp3` suffit à passer un filtre qui ne regarde que l'extension — et le `mimetype` que donne multer n'est que ce que le navigateur a *déclaré*, pas ce que le fichier *est*.

Un filtre sur l'extension reste utile comme **premier tri** (éviter de traiter des fichiers manifestement hors sujet), mais ce n'est **pas une validation**.

**c) La vraie validation : lire le contenu.** Il faut ouvrir le fichier et vérifier qu'il est bien ce qu'il prétend être. Ici, `music-metadata` essaie de le décoder comme de l'audio :

```js
try {
  const metadonnees = await parseFile(chemin);
  duration = Math.round(metadonnees.format.duration ?? 0);
} catch {
  duration = null;
}

// Pas de durée = pas d'audio, quel que soit le nom du fichier.
if (!duration) {
  await supprimerFichiers(...);
  return res.status(400).json({ message: "Ce fichier n'est pas un fichier audio valide." });
}
```

**Le bénéfice double** : la même opération me donne la **validation** *et* la **durée**. Une donnée que je n'ai donc jamais besoin de demander au client — et qu'il ne peut donc pas falsifier.

**Le test qui prouve que ça marche** : renommer un `.txt` en `.mp3` et le déposer. S'il est accepté, la validation est en carton. C'est devenu un test automatisé.

**À ne pas oublier** : une **limite de taille** (sinon on me remplit le disque), un **rate limit** (chaque dépôt déclenche aussi un mail : sans limite, on remplit le disque *et* on noie ma boîte), et la **suppression des fichiers orphelins** dès qu'un dépôt échoue — sinon le dossier gonfle indéfiniment avec des fichiers dont plus personne ne connaît l'existence.

---

### 45. Modération : le fichier ne doit pas être accessible avant d'être validé

**Contexte** : c'est la décision la plus importante de toute la fonctionnalité, et elle n'a rien à voir avec du code compliqué.

**Le piège** : `server.js` contient `app.use(express.static("public"))`. Ça veut dire que **tout ce qui atterrit dans `public/` est servi publiquement, immédiatement**, à qui connaît l'URL.

Donc si j'écris le fichier déposé dans `public/musiques/`, il est **en ligne dès le dépôt** — avant même que je l'aie écouté. Ma modération ne servirait plus strictement à rien : le contenu est déjà accessible.

**La solution** : le fichier va dans `backend/uploads/`, **hors** du dossier servi. Il n'est **déplacé** vers `public/` qu'au moment de l'approbation. Pour que je puisse l'écouter avant de décider, une seule porte : une route `GET /api/submissions/:id/audio`, protégée par `adminMiddleware`.

**Le même raisonnement pour la base de données.** J'ai hésité entre :
- une colonne `statut` sur `musics` (simple), et
- une table `submissions` séparée.

J'ai choisi la table séparée, pour une raison qui est devenue mon critère de décision : avec un statut sur `musics`, **toutes** mes requêtes existantes (catalogue, Top 5, recherche…) devraient penser à filtrer `WHERE statut = 'approuve'`. Le jour où j'en oublie une, un morceau non validé apparaît dans l'app.

Avec une table séparée, **ça ne peut pas arriver** : le morceau n'est simplement pas dans la table que l'application lit.

**Le principe, qui revient partout** (voir aussi la note 42 sur les protections désactivables) : **rendre l'erreur impossible par construction**, plutôt que compter sur sa vigilance pour ne pas la commettre. Un bon design ne demande pas de se souvenir de quelque chose.

---

### 46. Un `<audio src>` n'envoie pas le header `Authorization`

**Contexte** : côté admin, je voulais écouter un morceau en attente avant de le valider. Le réflexe :

```jsx
<audio src="/api/submissions/12/audio" controls />   // ← répond 401
```

**Pourquoi ça échoue** : quand le navigateur rencontre un attribut `src`, **c'est lui** qui va chercher la ressource, avec sa propre requête. Il n'a aucune idée de mon `apiFetch` ni de mon token : il **n'enverra pas** l'en-tête `Authorization`. La route étant réservée à l'admin, elle répond `401` et le lecteur reste muet.

C'est vrai pour **tout** ce que le navigateur charge lui-même : `<img src>`, `<video src>`, `<link href>`…

**La mauvaise solution** (fréquente, et tentante) : passer le token dans l'URL.

```jsx
<audio src={`/api/submissions/12/audio?token=${token}`} />   // ← à éviter
```

Ça marche… mais le token se retrouve dans les **logs du serveur**, dans l'**historique du navigateur**, et dans l'en-tête `Referer` envoyé aux sites tiers. Un token dans une URL est un token qui fuite.

**La bonne solution** : télécharger le fichier avec `fetch` (qui, lui, envoie les en-têtes), le garder en mémoire sous forme de **Blob**, et donner au lecteur une URL locale qui pointe vers cette mémoire :

```jsx
const { reponse } = await apiFetch(`/api/submissions/${id}/audio`, { brut: true });
const blob = await reponse.blob();
const urlLocale = URL.createObjectURL(blob);   // "blob:http://localhost:5173/xxxx"
setSrc(urlLocale);
```

Le fichier n'est jamais exposé publiquement, et le token reste dans un en-tête.

**Ne pas oublier le nettoyage** : un `objectURL` occupe de la mémoire **jusqu'au rechargement de la page**. Il faut le libérer quand le composant disparaît :

```jsx
useEffect(() => {
  let url = null;
  charger().then((u) => { url = u; setSrc(u); });

  return () => { if (url) URL.revokeObjectURL(url); };   // ← sinon, fuite mémoire
}, [id]);
```

---

## 2026-07-14 — Spoti-Free (dashboard admin, dépôt, mot de passe oublié)

### 47. « Mot de passe oublié » : quatre pièges, dont un qu'on ne voit pas venir

**Contexte** : le lien « Mot de passe oublié ? » de ma page Connexion pointait sur `to="#"`. Fonctionnalité banale en apparence, et pourtant un nid à failles.

**a) L'énumération de comptes — le piège invisible.** Le réflexe naturel est de répondre « cet email n'existe pas » quand c'est le cas. C'est une **fuite de données personnelles** : n'importe qui peut alors tester des adresses en masse pour savoir **qui est inscrit sur mon site**. Savoir que quelqu'un a un compte quelque part est déjà une information — et c'est le point de départ d'attaques ciblées.

La réponse doit donc être **strictement identique** (même message, même code HTTP), que le compte existe ou non :

> « Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé. »

Le même raisonnement vaut pour la réinitialisation : « jeton inconnu », « déjà utilisé » et « expiré » renvoient **un seul et même message**. Les distinguer renseignerait un attaquant sur la validité d'un jeton qu'il teste.

**b) Le jeton ne se stocke pas en clair.** Ce jeton **vaut un mot de passe** : qui le possède peut changer celui du compte. Si la base fuitait, tous les comptes ayant une demande en cours seraient compromis. On stocke donc son **empreinte SHA-256**, et on compare les empreintes.

Détail intéressant : ici **pas de bcrypt**, contrairement aux mots de passe. Pourquoi ? bcrypt sert à *ralentir* le cassage de secrets **faibles, choisis par des humains** (`azerty123` se devine, il faut donc rendre chaque essai coûteux). Un jeton de 32 octets aléatoires a une entropie énorme : il est insensible aux attaques par dictionnaire, un SHA-256 suffit.

**c) Usage unique.** Le mail **reste dans la boîte de réception**. Quelqu'un qui y accède plus tard (ordinateur partagé, boîte piratée) ne doit pas pouvoir rejouer le lien → colonne `used_at`.

**d) Expiration.** Un lien de réinitialisation qui traîne est un risque permanent → 1 heure.

**Et le jeton lui-même** : `crypto.randomBytes(32)`. Surtout pas un UUID ni `Math.random()` — il faut de **l'imprévisible**, pas seulement de l'unique. Un UUID v4 garantit qu'il n'y aura pas de collision, pas qu'on ne peut pas le deviner.

---

### 48. Une donnée personnelle se hache **avec un sel** — sinon le hash ne protège rien

**Contexte** : pour compter les visiteurs uniques du dashboard, je dois distinguer les visiteurs. L'IP est l'identifiant naturel… mais c'est une **donnée personnelle** (RGPD).

**La solution** : ne jamais la stocker en clair, mais garder son empreinte. Ça suffit à compter des visiteurs **distincts** sans pouvoir remonter à quelqu'un.

**Le piège** : un `SHA-256(ip)` tout seul **ne protège rien**.

Pourquoi ? Il n'existe que **~4 milliards d'adresses IPv4**. Un attaquant peut toutes les hacher en quelques secondes, construire la table de correspondance, et retrouver l'IP d'origine de n'importe quel hash. L'espace des valeurs possibles est trop petit.

**La correction — un sel secret**, stocké côté serveur (dans le `.env`), ajouté avant de hacher :

```js
const ipHash = crypto
  .createHash("sha256")
  .update(ip + process.env.IP_HASH_SALT)   // ← le sel change tout
  .digest("hex");
```

Sans connaître le sel, l'attaque devient impossible : il faudrait re-hacher les 4 milliards d'IP **pour chaque sel possible**.

**La règle générale** : hacher une donnée **à faible entropie** (une IP, un numéro de téléphone, un code postal, une date de naissance) sans sel, c'est de la pseudonymisation de façade. Le sel n'est pas un détail d'implémentation, c'est ce qui fait tenir la protection.

---

### 49. La couleur d'un graphique se **valide**, elle ne se choisit pas à l'œil

**Contexte** : pour le dashboard admin, j'ai voulu utiliser les couleurs de mon thème (violet `#6c5ce7`, bleu `#6495ed`) pour les deux séries de la courbe de fréquentation. Elles vont bien ensemble, ça me semblait évident.

**Un validateur les a rejetées.** Deux problèmes que je n'aurais **jamais** vus à l'œil :

1. **Contraste insuffisant** : le violet n'avait que **2.6:1** face à la surface sombre des cartes (le minimum pour une marque est 3:1). Sur mon écran, ça « passait ». Sur un écran moins bon, ou en plein soleil, la courbe s'efface.
2. **Luminosité hors bande** : le bleu était trop clair pour le mode sombre (L 0.675, la bande admise s'arrête à 0.67).

Bonne surprise en revanche : la **séparation daltonisme** passait déjà largement (ΔE 21.6 en deutéranopie, pour un seuil de 12) — violet et bleu restent distinguables. Mais ça, je ne pouvais pas le savoir non plus.

Correction : assombrir légèrement le bleu (`#6495ed` → `#5c8fe6`). Tous les contrôles passent.

**Ce que j'en retiens** : ces quatre propriétés (bande de luminosité, chroma, contraste sur la surface, séparation daltonisme) sont **calculables**. Les estimer à l'œil, c'est deviner. Environ **8 % des hommes** sont daltoniens — « je trouve que ça se distingue bien » n'est pas une donnée.

Autres règles que j'ai appliquées sans les connaître avant :
- **Jamais deux axes Y** sur un même graphique : les deux échelles étant arbitraires, la comparaison visuelle ne veut rien dire. Deux mesures d'échelles différentes → deux graphiques.
- **Une seule couleur pour une série unique.** Colorer chaque barre d'un classement d'une teinte différente laisse croire que la couleur porte une information — alors que le rang n'est pas une catégorie.
- **Les statuts ne sont pas des couleurs de série** : ils ont une palette réservée et sortent toujours avec **une icône et un mot**, jamais identifiés par la couleur seule.

---

### 50. Un admin a les droits que son rôle **exige** — pas tous ceux qui sont possibles

**Contexte** : en construisant la gestion des utilisateurs, la tentation était de faire un CRUD complet — lister, **modifier** (pseudo, nom, email), supprimer. C'est ce qu'on fait « par défaut ».

**Pourquoi j'ai retiré l'édition de l'email** : c'est **l'identifiant de connexion**. Un admin capable de le changer peut se l'attribuer, puis se connecter à la place de la personne. C'est une **escalade de privilèges** — et pour quel besoin réel ? Aucun. Personne n'a jamais eu besoin de changer l'email de quelqu'un d'autre.

Idem pour le pseudo : le seul cas légitime serait un pseudo insultant — et là on **supprime ou on bloque**, on ne renomme pas.

**Le principe** : chaque droit accordé est une surface d'attaque. On n'ajoute pas une capacité « parce qu'on peut », mais parce qu'un besoin l'exige. Le CRUD complet est un réflexe, pas une décision.

**Et les garde-fous sur ce qui reste** (suppression, changement de rôle) :
- un admin ne peut pas **se supprimer lui-même** ni **se rétrograder** (il s'enfermerait dehors) ;
- on ne peut pas supprimer **le dernier admin** (plus personne ne pourrait administrer, et il n'existe aucun moyen de se re-promouvoir depuis l'interface) ;
- la confirmation **annonce ce qui va être détruit** (« 3 playlists, 12 favoris, 2 dépôts ») plutôt qu'un « Êtes-vous sûr ? » qui n'informe de rien — on clique « Oui » par réflexe sur une question vide.

---

### 51. CSS préfère **déformer** plutôt que déborder

**Contexte** : deux bugs différents, la même cause profonde. C'est la leçon CSS la plus utile de ces deux jours.

**Cas 1 — la grille (`1fr`).** L'app dépassait la hauteur de l'écran quand l'aside avait beaucoup de playlists. `grid-rows-[1fr_88px]` : or `1fr` vaut `minmax(auto, 1fr)`, et ce **`auto` en minimum** interdit à la ligne de descendre sous la taille de son contenu. La ligne grandissait donc, et mon `overflow-y-auto` ne s'activait jamais (rien ne contraignait la hauteur). → `minmax(0, 1fr)`.

**Cas 2 — la colonne flex (`shrink`).** En réorganisant l'aside en sections, le bloc des playlists **s'est écrasé à zéro** : la liste avait purement disparu, et deux sections se chevauchaient. En flex, un enfant se **comprime par défaut** pour faire tenir ses voisins. → `shrink-0`.

**La leçon commune** : par défaut, CSS fait tout pour que ça « rentre » — quitte à écraser un élément à zéro, ou à laisser un conteneur s'étirer indéfiniment. Il ne déborde pas, il **déforme**.

Donc quand un élément **disparaît**, s'aplatit, ou qu'un `overflow` « ne marche pas », la cause n'est presque jamais là où on regarde : c'est qu'un parent, quelque part, a le droit de se déformer. Il faut **remonter la chaîne des parents** et l'interdire explicitement (`shrink-0`, `min-h-0`, `minmax(0,1fr)`).

---

### 52. Une fonctionnalité qu'on ne peut pas atteindre n'existe pas

**Contexte** : j'ai construit tout un espace d'administration (dashboard, modération, utilisateurs, catalogue) plus les pages de dépôt. Sur mobile, **rien ne débordait, rien n'était moche, aucune erreur** — le responsive était parfait.

**Sauf qu'aucune de ces pages n'était accessible.**

Tous les liens vivaient dans l'`Aside`, qui est `hidden md:flex` — **masquée sous `md`**. La barre du bas ne porte que les 5 onglets principaux, et le burger ne contenait qu'« À propos » et « Contact ». Sur téléphone, **6 pages n'étaient joignables qu'en tapant l'URL à la main**.

**Ce qui est instructif** : aucun test ne l'aurait vu. Pas d'erreur, pas de débordement, les pages s'affichaient parfaitement **quand on y arrivait**. Un test de rendu vérifie « est-ce que ça s'affiche bien ? », jamais « est-ce qu'on peut y aller ? ».

**Le réflexe à prendre** : après avoir construit une page, se demander « **par où on y accède, concrètement ?** » — et le vérifier sur chaque taille d'écran. Une page sans chemin d'accès n'est pas une page, c'est du code mort qui a l'air vivant.

---

### 53. Un `UPDATE` de toutes les colonnes écrase ce qu'on ne lui envoie pas

**Contexte** : la route de modification d'une musique, écrite au début du projet.

```js
// DANGEREUX
await db.query(
  "UPDATE musics SET title=?, artist=?, genre=?, src_image=?, src_audio=?, duration=? WHERE id_music=?",
  [title, artist, genre, srcImage, srcAudio, duration, id],
);
```

**Le problème** : mon formulaire d'admin n'envoie que le **titre, l'artiste et le genre** (on ne remplace pas un fichier en le renommant). Les trois autres valeurs arrivent donc à `undefined` → mysql2 les écrit **`NULL`**.

Résultat : le morceau devient **injouable** (plus de `src_audio`) et sa pochette **cassée** (plus de `src_image`), **en silence**. La requête réussit, l'API répond 200, rien ne signale quoi que ce soit. On ne le découvre qu'en rechargeant la page.

**La correction** : n'accepter **que ce qui est réellement modifiable**.

```js
"UPDATE musics SET title = ?, artist = ?, genre = ? WHERE id_music = ?"
```

**Et il y a un second motif, de sécurité** : un chemin de fichier venant du client est une valeur qu'on ne contrôle pas. Rien n'empêchait d'écrire `../../.env` dans `src_audio` et de le faire servir par `express.static`. La durée, elle, est extraite du fichier réel — une valeur envoyée par le client pourrait simplement mentir.

**La règle** : une route de modification expose **la liste des champs modifiables**, jamais « toutes les colonnes de la table ». Ce qui est dérivé (une durée lue dans le fichier) ou structurel (un chemin de stockage) se calcule côté serveur et ne s'accepte jamais du client.

---

## 2026-07-14 — Spoti-Free (validation en direct du formulaire d'inscription)

### 54. Valider un formulaire pendant la saisie : contrôlé, indulgent, et surtout pas seulement côté client

**Contexte** : sur ma page Inscription, les règles du mot de passe existaient **côté serveur** (8 caractères minimum) mais n'étaient **écrites nulle part dans l'interface**. L'utilisateur ne les découvrait qu'en se prenant l'erreur au moment de valider. Je voulais un retour visuel en direct : croix rouge tant que c'est invalide, check vert quand c'est bon.

**a) Pour valider pendant la saisie, il faut un champ *contrôlé*.**

Mon formulaire lisait tout d'un coup au moment de l'envoi :

```jsx
const formData = new FormData(event.currentTarget);
const email = formData.get("email");
```

C'est un formulaire **non contrôlé** : la valeur vit dans le DOM, React ne la connaît pas. Elle n'est lue qu'au submit — donc impossible de réagir à chaque frappe. Pour valider en direct, la valeur doit vivre dans un **state** :

```jsx
const [email, setEmail] = useState("");
// ...
<Input value={email} onChange={(event) => setEmail(event.target.value)} />
```

Là, chaque frappe déclenche un rendu, et `emailValide(email)` est recalculé. Je n'ai converti que les **trois champs qui ont besoin d'un retour** (email, mot de passe, confirmation) : le pseudo, le prénom et le nom n'ont rien à valider en direct et restent lus par `FormData`. Ajouter un state à un champ qui n'en a pas besoin, c'est du bruit.

**b) Le timing : ne pas crier sur quelqu'un qui est en train d'écrire.**

Le piège de la validation en direct, c'est d'afficher « email invalide » dès la première lettre tapée — l'utilisateur voit du rouge alors qu'il n'a simplement pas fini. Le standard UX est **indulgent** : on n'affiche l'erreur qu'une fois que l'utilisateur a **quitté** le champ (`onBlur`), et ensuite seulement on met à jour en direct à chaque touche.

D'où un state qui mémorise les champs déjà « touchés » :

```jsx
const [touche, setTouche] = useState({});
// <Input onBlur={() => setTouche((p) => ({ ...p, email: true }))} />
```

Et une nuance : `touche` commande le **rouge**, pas le **vert**. Le check vert s'affiche dès que la règle est remplie — un encouragement n'a pas besoin d'attendre.

**c) Ne pas désactiver le bouton d'envoi.**

Le réflexe est de griser le bouton tant que le formulaire est invalide. Deux raisons de ne pas le faire : un bouton grisé **n'explique rien** (l'utilisateur ne sait pas ce qu'on lui reproche), et il est invisible pour beaucoup d'outils d'accessibilité. Le bouton reste cliquable, et c'est le `handleSubmit` qui bloque l'envoi en affichant les erreurs. Bonus inattendu : mon test Playwright **clique** sur ce bouton avec un formulaire invalide pour vérifier que le compte n'est pas créé — un bouton désactivé aurait fait partir le test en timeout.

**d) Le point le plus important : le front est un miroir, pas une protection.**

Ma checklist verte est du **confort**. Elle ne protège rien : un appel direct à l'API (curl, Postman) ne passe jamais par React. La règle qui protège vraiment est celle du serveur.

Conséquence : durcir la règle voulait dire la durcir **côté serveur**, et le front ne fait que l'**afficher**. Les deux doivent donc rester d'accord — s'ils divergent, le symptôme est désagréable : le formulaire affiche un beau check vert, et le serveur refuse quand même.

**e) Le piège que je n'avais pas vu : la règle doit être la même PARTOUT.**

En durcissant l'inscription, j'ai failli oublier la route de **réinitialisation de mot de passe**, qui appliquait encore l'ancienne règle. Or elle attribue elle aussi un mot de passe. Une exigence appliquée à l'inscription mais oubliée là se **contourne en passant par « mot de passe oublié »** pour se choisir un mot de passe faible — le formulaire le plus strict ne sert alors plus à rien.

D'où un module unique, `backend/src/validation.js`, importé par les **deux** routes. Une règle de sécurité dupliquée à deux endroits est une règle qui finira par diverger.

**La règle à retenir** : la validation client **explique**, la validation serveur **impose**. Et une exigence de sécurité s'applique à **tous** les chemins qui mènent à la même donnée, pas seulement au plus visible.

---

## 2026-07-14 — Spoti-Free (intégration continue)

### 55. La CI : ce n'est pas un lanceur de tests, c'est un révélateur

**Contexte** : mes 106 tests passaient. Chez moi. J'ai voulu les brancher sur une **CI** (intégration continue) : un serveur — ici GitHub Actions — qui, à chaque `push`, prend une machine **neuve**, installe le projet et lance les tests tout seul. Croix rouge sur le commit si ça casse.

Je pensais que ce serait un fichier de config à écrire. En réalité, **la CI a trouvé trois défauts que je ne voyais pas** — et elle les a trouvés précisément parce qu'elle ne connaît rien de mon ordinateur.

**Le mot important, c'est « neuve ».** Chez moi il y a MAMP, un `.env`, une base MySQL déjà remplie, des fichiers audio dans `backend/public/`. **Rien de tout ça n'est dans Git.** Une CI est donc une réponse à la question : *mon projet tourne-t-il ailleurs que chez moi ?* C'est exactement la question que se pose un recruteur qui clone mon dépôt.

**Défaut 1 — le schéma de ma base n'était versionné nulle part.**

J'avais des scripts `add-role-column.sql`, `add-submissions-table.sql`… mais **aucun `CREATE TABLE` pour `users`, `musics`, `playlists` ou `likes`**. Ces tables n'existaient que dans le MySQL de mon MAMP.

Conséquences que je n'avais pas mesurées : personne d'autre ne pouvait lancer mon app ; mon `DEPLOIEMENT.md` était **faux** (il disait « rejouer les scripts SQL », mais ces scripts supposent des tables inexistantes) ; et si mon disque lâchait, le schéma partait avec.

Corrigé avec un `mysqldump --no-data` versionné (`backend/scripts/schema.sql`) + un seed du catalogue. **Règle : la structure de la base est du code. Elle va dans Git.**

**Défaut 2 — mes tests dépendaient d'un compte fantôme.**

Premier run : **rouge**. `depots.find is not a function`.

Mes tests d'admin forgeaient un jeton pour `id_user: 10` / `admin@admin.fr` — un compte de **ma** base de dev. Sur une base neuve, il n'existe pas : `adminMiddleware` répondait `403`, la route renvoyait un message d'erreur au lieu d'une liste, et `.find()` explosait dessus.

Le plus savoureux : `admin@admin.fr` est **exactement le compte que mon `DEPLOIEMENT.md` me dit de purger avant la mise en production**. Mes tests auraient donc cassé le jour de la purge.

Corrigé par un helper `creerAdmin()` : les tests **créent leur propre admin** au lieu d'en supposer un. **Règle : un test ne doit rien supposer qui ne soit pas dans le dépôt.**

**Défaut 3 — mes tests lisaient un vrai `.mp3` dans `backend/public/`**, qui est gitignoré. Même problème : injouable ailleurs.

La subtilité : mon test central vérifie qu'un `.txt` renommé en `.mp3` est **rejeté**. Il me fallait donc un fichier **réellement décodable**, pas un leurre. J'ai fabriqué un MP3 valide à la main : une suite de trames MPEG (en-tête `0xFF 0xFB 0x90 0x00`, 417 octets par trame) remplies de zéros. C'est **du vrai MP3, mais silencieux** — `music-metadata` y lit une durée, donc le backend l'accepte. 33 Ko, et libre de tout droit, au lieu de 2,8 Mo de musique que je n'ai pas le droit de redistribuer.

**Deux pièges techniques rencontrés en chemin**

*`mysqldump` sort les tables par ordre alphabétique.* `likes` arrivait donc **avant** `musics`, alors qu'elle porte une clé étrangère vers elle → `Failed to open the referenced table 'musics'`. Un dump normal protège ça avec `SET FOREIGN_KEY_CHECKS = 0`, que mon option `--compact` avait supprimé. À remettre en tête du fichier.

*`dotenv.config()` sans chemin charge le `.env` du dossier COURANT.* Lancer `node backend/server.js` depuis la racine ne trouve donc aucune configuration. Il faut lancer **depuis** `backend/` (`working-directory` en CI). C'est le genre de détail invisible en local, où l'on est déjà dans le bon dossier.

**Ce que la CI m'apporte concrètement**

Un badge vert sur le README, oui. Mais surtout : je ne peux plus mettre en ligne une régression sans la voir, et **je sais désormais que mon projet s'installe ailleurs que sur mon Mac** — ce que je croyais vrai, et qui ne l'était pas.

**La règle à retenir** : une CI ne teste pas que ton code. Elle teste **ton dépôt**. Tout ce qui vit seulement sur ta machine (un schéma, un compte, un fichier) est une dette invisible — et elle la rend visible du premier coup.

---

## 2026-07-16 — Spoti-Free (mise en production)

### 56. Mon hash d'IP ne servait à rien sans son sel

**Contexte** : en préparant le `.env` de production, je devais générer `IP_HASH_SALT`. Je savais qu'il fallait un sel — c'est ce qu'on lit partout — mais j'aurais été incapable d'expliquer **pourquoi**. Il se trouve que c'est plus intéressant que « c'est plus sûr ».

**Où ça sert chez moi** : dans `backend/src/routes/adminRoute.js`, je compte les visites en stockant `sha256(ip + sel)` dans la table `visites`, jamais l'IP elle-même. L'intention est bonne : une adresse IP est une **donnée personnelle** au sens du RGPD. Un hash **salé** n'en est plus une. Je peux donc compter mes visiteurs sans conserver de données personnelles.

**Le point que je n'avais pas compris : un hash d'IP SANS sel ne protège strictement rien.**

Une adresse IPv4, c'est **2³² possibilités, soit environ 4,3 milliards**. Ça paraît énorme. En réalité c'est *minuscule* : quelqu'un qui récupérerait ma table `visites` peut calculer les 4,3 milliards de `sha256()` possibles en quelques minutes sur un GPU, se construire une table de correspondance, et **retrouver toutes mes IP en clair**. Le hash seul n'est alors qu'un pseudonyme que n'importe qui peut lever. J'aurais cru mes visiteurs protégés, ils ne l'auraient pas été du tout.

**C'est le sel qui fait la protection, pas le hash.** Sans connaître le sel — qui est secret, et qui n'est nulle part dans le dépôt — aucune table pré-calculée n'est réutilisable. L'attaquant devrait tout recalculer pour mon sel précis, qu'il n'a pas.

**La généralisation qui m'a marqué** : hacher une donnée issue d'un **petit espace** — une IP, un numéro de téléphone, une plaque d'immatriculation, une date de naissance — sans sel, c'est une protection **décorative**. Ça ne vaut que pour les espaces immenses, comme un mot de passe long. Le hash rassure l'œil ; c'est l'espace des valeurs possibles qui décide.

**Un défaut que j'ai trouvé dans mon propre code au passage** :

```js
.update(ip + (process.env.IP_HASH_SALT ?? ""))
```

Ce `?? ""` fait que si j'oublie la variable dans mon `.env` de production, **rien ne plante**. Le code hache sans sel, silencieusement, et je continue à croire mes IP protégées alors qu'elles sont triviales à retrouver. C'est le pire type de défaut : celui qui ne se voit jamais. À vérifier explicitement une fois le `.env` de prod écrit.

**Une asymétrie que je n'attendais pas** — mes deux secrets ne se changent pas pareil :

- `JWT_SECRET` est **rotatable à volonté**. Le coût, c'est que tout le monde est déconnecté. Pénible, pas grave.
- `IP_HASH_SALT` **ne l'est pas**. Si je le change, le même visiteur produira un hash différent : mes statistiques historiques deviennent incomparables avec les nouvelles, et je compte les gens en double. Celui-là se fixe **une fois**, et on n'y touche plus.

**La règle à retenir** : un hash ne protège que si l'espace des valeurs possibles est trop grand pour être parcouru. Quand il ne l'est pas — et une IP, c'est le cas — c'est le **sel** qui fait tout le travail. Et un secret qui a un fallback silencieux (`?? ""`) n'est pas un secret : c'est une option.

---

### 57. Choisir sa version d'Ubuntu, c'est choisir ses versions de paquets

**Contexte** : à la création du VPS, trois images proposées — Ubuntu 22.04 LTS, 24.04 LTS, 26.04 LTS. Mon réflexe : prendre la plus récente. C'était le mauvais réflexe, et la raison m'a appris quelque chose.

**Ce que je n'avais pas réalisé** : une distribution **fige un jeu de versions pour toute sa durée de vie**. `apt install mysql-server` ne me donne pas « MySQL » — il me donne **la version que cette Ubuntu-là a figée** :

| Ubuntu | Support standard | `apt install mysql-server` livre |
|---|---|---|
| 22.04 LTS | jusqu'en **avril 2027** | MySQL 8.0 |
| **24.04 LTS** | jusqu'en avril 2029 | **MySQL 8.0** |
| 26.04 LTS | jusqu'en avril 2031 | **MySQL 8.4** |

**Le critère qui a tranché : ma CI teste contre `mysql:8.0`.**

En prenant 26.04, la commande du §2 de mon `DEPLOIEMENT.md` — la même commande — m'aurait installé **MySQL 8.4 sans rien me dire**. Ma production aurait tourné sur une version que **mes 106 tests n'ont jamais exercée**. Et 8.4 apporte de vraies ruptures : `mysql_native_password` désactivé par défaut, `default_authentication_plugin` supprimé, de nouveaux mots réservés (`MANUAL`, `PARALLEL`, `QUALIFY`, `TABLESAMPLE`).

Est-ce que ça aurait cassé mon app ? **Probablement pas** : `mysql2` gère `caching_sha2_password`, mes clés sont des `INT`, et `utf8mb4_0900_ai_ci` existe toujours. Mais « probablement » n'a rien à faire dans une mise en production.

**Le lien direct avec la note 55**, et c'est ce qui m'a convaincu : j'ai écrit que ma CI teste **mon dépôt**. C'est vrai. Mais elle ne teste **que l'environnement que je lui donne**. Si ma production diverge de cet environnement, le vert de la CI ne prouve plus rien sur la production — il ne prouve que quelque chose sur une machine qui n'existe nulle part. Une suite de tests verte ne vaut que si la prod ressemble à ce qui a été testé.

**22.04 était exclue** pour l'autre bout du problème : fin de support standard en **avril 2027**, soit dans neuf mois. Installer un système déjà en fin de vie sur une machine neuve n'a aucun sens.

**Le piège inverse, dont je me méfiais à tort** : je pensais que 26.04, sortie en avril 2026, serait « trop fraîche » et que les dépôts tiers ne suivraient pas. **Faux** — NodeSource publie sur une suite `nodistro` indépendante du nom de code, donc mon `setup_22.x` y marcherait très bien. 26.04 est une **vraie LTS**, supportée jusqu'en 2031 : récent n'est pas instable. Le vrai problème n'était pas Node, c'était MySQL — plus le fait qu'à trois mois d'existence, les réponses que je trouverai en ligne à 23h seront écrites pour 24.04.

**La règle à retenir** : pour un déploiement, prendre **l'avant-dernière LTS** — assez récente pour avoir des années de support devant elle, assez ancienne pour que l'écosystème (docs, tutos, réponses, dépôts tiers) soit mûr. **Un déploiement n'est pas l'endroit où être pionnier.** Et plus largement : le choix de l'OS n'est pas un détail administratif, c'est un choix de versions qui engage toute la stack.

**Dette assumée** : MySQL 8.0 est en fin de vie chez Oracle depuis avril 2026 — Ubuntu 24.04 continue d'en assurer la maintenance de sécurité sur la durée de sa LTS, donc rien d'urgent. Mais le passage de ma **CI et** de ma prod vers 8.4 devra se faire un jour : consciemment et testé, pas par accident au détour d'un `apt install`.

---

### 58. Mettre en ligne, c'est changer de régime juridique

**Contexte** : en attendant la validation du paiement du VPS, une idée me trotte : dans la section « déposer une musique », **à aucun moment on ne précise que le morceau et l'image doivent être libres de droit**. En creusant, j'ai découvert un problème bien plus gros que celui que je cherchais.

**Le vrai problème, celui que je ne cherchais pas** : mon `seed-musics.sql` contenait 20 morceaux nommés « Blinding Lights / The Weeknd », « Bohemian Rhapsody / Queen »… pointant vers **5 fichiers libres de droit recyclés en boucle**. Sur `localhost`, c'est un jeu de données de démo tout à fait normal. En ligne, ça devient trois problèmes d'un coup : j'affiche publiquement des noms d'artistes que je n'ai pas le droit d'exploiter ; c'est **trompeur** (on clique sur Bohemian Rhapsody, on entend du piano d'ambiance) ; et un recruteur qui clique sur Play se dit « démo bricolée ».

**La leçon générale** : `localhost` et la production ne sont pas le même endroit avec une adresse différente — ce sont **deux régimes juridiques différents**. Des données de démo qui n'engagent personne sur ma machine deviennent une publication dès qu'elles ont une URL. Il faut relire ses données de test avec ces yeux-là **avant** de déployer, pas après.

**Hébergeur ou éditeur, et le paradoxe de la modération** : la LCEN distingue l'**hébergeur** (responsabilité limitée : il doit retirer promptement un contenu illicite qu'on lui signale) de l'**éditeur** (responsable de ce qu'il publie). Ce qui est contre-intuitif : **le fait que je modère a priori me rapproche du statut d'éditeur**, puisque j'ai validé le contenu, donc je l'endosse. Ma modération est une bonne fonctionnalité, mais elle **augmente** mon exposition. D'où l'intérêt de faire signer une déclaration au déposant : elle ne me dédouane pas, elle documente ma diligence.

**TASL** : la règle d'attribution Creative Commons tient en quatre lettres — **T**itle, **A**uthor, **S**ource, **L**icense. Mes colonnes `title` et `artist` couvraient déjà T et A ; il me manquait S et L. Et le piège que je n'avais pas vu : **CC BY *exige* l'attribution**. Prendre du CC BY sans créditer viole la licence aussi sûrement que de prendre du Weeknd. **Le libre n'est pas le domaine public.** Une licence stockée en base mais jamais affichée ne m'autorise rien.

**Le `NOT NULL` comme outil de conception, pas comme contrainte** : j'ai mis `musics.licence` en `NOT NULL` sans valeur par défaut. Ça a **cassé** toutes mes insertions — et c'était le but. C'est le principe *make illegal states unrepresentable* : plutôt que d'espérer ne jamais oublier la licence sur un nouveau chemin d'écriture, je rends l'oubli **impossible**. Un morceau sans licence ne peut littéralement plus exister dans ma base.

Ça a immédiatement payé : je pensais avoir deux chemins d'insertion (ajout admin, approbation d'un dépôt). La base m'en a révélé **un troisième** que j'avais raté — une fixture de `admin.test.mjs` qui écrivait en SQL direct, hors API. Le test a explosé sur `Field 'licence' doesn't have a default value`. **Je ne l'aurais jamais trouvé à la lecture.**

**Mais un `NOT NULL` mal placé fabrique des mensonges.** J'avais aussi mis `source_url` en `NOT NULL`. Erreur : quelqu'un qui dépose **sa propre création** n'a aucune source externe à citer, et TASL dit bien « Source, *si elle est fournie* ». La contrainte m'aurait forcé à **inventer une URL** pour la satisfaire. Même raisonnement pour `droits_confirmes_at`, laissé nullable : mes dépôts antérieurs n'ont réellement jamais fait l'objet d'une déclaration, et `NULL` est la représentation **honnête** de « aucune déclaration recueillie » — une date par défaut leur aurait inventé un consentement qui n'a jamais existé. **Le NOT NULL sert à interdire l'impossible, pas à forcer l'inconnu à ressembler à du connu.**

**Deux valeurs qu'on ne reçoit jamais du client** :
- **L'URL de la licence** est **dérivée** du code (`CC BY 4.0` → l'URL du deed), jamais envoyée par le formulaire. Sinon rien n'empêcherait d'afficher « CC BY 4.0 » en pointant vers n'importe quoi — l'attribution deviendrait un mensonge signé de ma main. C'est le même raisonnement que pour `src_audio` (note sur le CRUD catalogue).
- **`source_url` est une faille XSS en puissance** : elle finit dans un `href` affiché à tous les visiteurs. Vérifier qu'elle « ressemble à une URL » laisserait passer `javascript:alert(...)`, qui s'exécuterait au clic. Je n'autorise que `http` et `https`, en m'appuyant sur `new URL()` — le parseur natif fait autorité sur ce qu'est une URL, pas ma regex maison.

**La case à cocher qui ne protège rien** : `required` sur l'input React est du **confort d'affichage**. Un appel direct à l'API ne passe jamais par mon formulaire — mes propres tests le prouvent, ils envoient du `FormData` à `fetch` sans toucher au navigateur. La barrière qui protège est **côté serveur**, dans `validation.js`. Et une case **pré-cochée n'est pas un consentement, c'est un piège** : l'utilisateur doit faire le geste.

**Un bug trouvé au passage** : dans la route de dépôt, `supprimerFichiers(audio.filename, image.filename)` — sans `?.` sur `image`. La pochette étant facultative, un dépôt **sans pochette et avec un audio invalide** levait un `TypeError`, transformant un refus 400 parfaitement prévu en **500**, et laissant le fichier orphelin sur le disque puisque le nettoyage plantait avant de s'exécuter. Deux caractères. Trouvé en relisant le fichier pour une tout autre raison.

**Une liste codée en dur est une bombe à retardement** : `preparer-medias.mjs` listait mes 5 mp3 en dur. Ça tenait avec 5 morceaux ; avec 100, la liste devenait ingérable et surtout **fausse en silence** — le script aurait créé 5 fichiers obsolètes, ignoré les 100 autres, et laissé la CI échouer sur des médias manquants sans dire pourquoi. La source de vérité du catalogue, c'est le seed : autant **le lire** plutôt que le recopier.

**Ce que j'ai vérifié plutôt que supposé** : ma page de mentions légales allait affirmer « vous pouvez supprimer votre compte depuis votre profil ». J'ai vérifié dans `userRoute.js` : **cette route n'existe pas**. J'aurais publié une page légale qui ment. Sur une page légale plus qu'ailleurs, **on n'écrit que ce qu'on a vérifié**.

**Et une question à laquelle j'ai eu la mauvaise raison** : je voulais un vrai catalogue « pour intéresser de vrais utilisateurs ». Honnêtement : **personne ne viendra écouter de la musique libre sur Spotifree alors que Spotify existe.** Ce n'est pas grave, ce n'est pas le but. Le vrai bénéfice est ailleurs : **5 morceaux c'est une démo, 100 morceaux c'est une application**. La recherche prend un sens, les filtres se justifient, la pagination devient un vrai sujet, et les problèmes de perf apparaissent enfin. Bonne décision, mauvaise raison — et ça valait le coup de le dire.

---

### 59. Supprimer son compte : ce que la cascade emporte, et ce qu'elle ne doit surtout pas emporter

**Contexte** : ma page de mentions légales affirmait qu'on pouvait supprimer son compte depuis son profil. C'était faux — la route n'existait pas. Plutôt que d'adoucir la phrase, autant écrire la fonctionnalité : le **RGPD** donne un « droit à l'effacement », et une personne doit pouvoir faire disparaître ses données **sans avoir à le demander à qui que ce soit**. Un formulaire de contact n'est pas un droit à l'effacement, c'est une faveur.

**La règle du projet qui semblait l'interdire** : mon `CLAUDE.md` dit « ne pas compléter le CRUD utilisateurs ». Mais en relisant *pourquoi* : l'absence d'**édition** du pseudo/nom/email est volontaire, parce que **l'email est l'identifiant de connexion** — pouvoir le modifier ouvre une escalade de privilèges. Ce raisonnement ne dit **rien** sur la suppression. **Supprimer n'est pas modifier.** Leçon : une règle sans son « pourquoi » devient un dogme qu'on applique de travers. J'ai précisé la règle plutôt que de la contourner.

**Deux garde-fous qui ne font pas double emploi** : je voulais « juste une modale de confirmation ». La modale confirme l'**intention** (on ne supprime pas son compte d'un clic égaré). Elle ne confirme pas l'**identité**. Or l'action est irréversible et emporte tout. Un token valide prouve qu'**une session est ouverte** — pas que c'est la **bonne personne devant l'écran**. Un ordinateur laissé sans surveillance trente secondes, un token volé, et le compte n'existe plus. D'où le **mot de passe redemandé dans la modale**. C'est ce que font GitHub (retaper le nom du dépôt) et Google (retaper son mot de passe) : ce n'est pas de la lourdeur, c'est proportionné à l'irréversibilité.

**403 et pas 401 sur un mauvais mot de passe** : réflexe naturel = 401. Mauvaise idée ici. Mon `apiFetch` **purge la session sur tout 401** (c'est le comportement voulu : un 401 signifie « je ne sais pas qui tu es »). Une simple faute de frappe aurait donc **déconnecté** la personne. Or je sais parfaitement qui elle est — son token est valide. Elle n'a juste pas prouvé son identité **pour cette action-là**. C'est la définition du **403** : « je sais qui tu es, mais tu n'as pas le droit ». La distinction 401/403 n'est pas une subtilité académique, elle a une conséquence directe sur l'UX.

**Le piège de la cascade — celui qui aurait vraiment fait mal** : `submissions` part en cascade avec l'utilisateur (`ON DELETE CASCADE`). Mais **la base ne sait rien des fichiers sur le disque**. Il faut les nettoyer soi-même. Et là, le réflexe « je supprime les fichiers de ses dépôts » est une **catastrophe** :

| Statut du dépôt | Où est le fichier | Que faire |
|---|---|---|
| `en_attente` | dans `uploads/` | **supprimer** — il n'appartient qu'à ce dépôt |
| `approuve` | **déplacé dans `public/`** | **NE PAS TOUCHER** — c'est le fichier du **catalogue** |
| `refuse` | déjà effacé au refus | rien |

La ligne `submissions` d'un dépôt **approuvé** porte encore le nom du fichier — mais à l'approbation, un `fs.rename` l'a **déplacé** dans `public/`. Le supprimer rendrait un morceau **public** injouable. Et s'il s'agit d'une pochette, elle est peut-être **partagée par plusieurs morceaux** — exactement la règle « ne jamais supprimer un fichier partagé » que j'avais déjà apprise en me la prenant en pleine figure. **Le même piège est revenu par une porte différente.** Une ligne en base ne dit pas où est le fichier : elle dit où il *était* quand on l'a écrite.

**Le garde-fou auquel je n'avais pas pensé** : le **dernier admin ne peut pas se supprimer** (409). Sinon, un clic et le catalogue comme la modération deviennent **définitivement ingérables** — plus personne ne peut approuver un dépôt ni promouvoir un nouvel admin. Il faudrait se connecter en SSH et faire un `UPDATE` à la main sur la base de production. Ce genre de garde-fou ne se voit pas dans les specs : il se voit en se demandant « et si la dernière personne qui a la clé la jette ? ».

**Un bug trouvé grâce à un test qui a échoué comme prévu** : j'avais écrit un test « le token d'un compte supprimé ne donne plus rien », en attendant un 401 ou un 404. **Reçu : 200.** Parce que `authMiddleware` ne vérifie que la **signature** du token, **pas l'existence du compte** — le jeton reste cryptographiquement bon jusqu'à son expiration (24h). Et `/profil` faisait `res.json(undefined)` sur un utilisateur introuvable → **200 avec un corps vide**. Le front croyait avoir reçu un profil et affichait une page vide **sans la moindre erreur**. Corrigé en 404. Ce n'était pas lié à la suppression : ce bug existait pour **n'importe quel** utilisateur inexistant. **Le test que j'avais écrit "pour la forme" a trouvé un vrai bug.**

**La limite qui reste, et que j'assume** : un JWT ne se révoque pas. Le token d'un compte supprimé reste valide jusqu'à son expiration. En pratique ce n'est pas grave ici — le compte n'existe plus, il n'y a rien à lire, et les clés étrangères bloquent toute écriture. Mais c'est la faiblesse structurelle des JWT : vérifier l'existence du compte à chaque requête coûterait une requête SQL sur **chaque** appel. `adminMiddleware` le fait déjà (il relit le rôle en base), mais seulement sur les routes d'admin, qui sont rares. Le faire partout serait un vrai choix d'architecture, pas une correction à glisser en passant.

**Ce que je retiens sur les tests** : mes tests API ont validé la route, mais c'est le test **navigateur** qui a vérifié que le bouton de confirmation est bien **désactivé tant que le mot de passe est vide**. Sans lui, la modale n'aurait été qu'un clic de plus. Les deux niveaux ne testent pas la même chose : l'API teste la **barrière**, le navigateur teste le **garde-fou**.

---

### 60. Le nombre magique attend son heure, et la copie finit toujours par diverger

**Contexte** : en relisant l'app sur desktop, deux incohérences me sautent aux yeux. La page Mentions légales a une police plus petite que Contact et À propos. Et surtout : sur Bibliothèque, le titre reste en haut quand je fais défiler la liste — mais sur toutes les autres pages, le titre part vers le haut avec le contenu. On ne sait plus où on est dès qu'on descend.

**Ce que j'ai trouvé en cherchant** : il n'y avait pas deux comportements, il y en avait **trois**.

| Pattern | Où | Verdict |
|---|---|---|
| `h-full overflow-y-auto` sur la section | la majorité des pages | tout défile, titre compris |
| `overflow-hidden` + enfant en `h-[calc(100%-6rem)]` | Bibliothèque | marche, mais nombre magique |
| `overflow-hidden flex flex-col` + enfant `flex-1 min-h-0` | **AdminMusiques** | la bonne solution |

**La bonne solution était déjà dans mon code.** Je m'apprêtais à généraliser Bibliothèque, qui était ma référence mentale « ça marche ». C'était l'exception bancale. `AdminMusiques`, que j'avais écrite plus tard, faisait déjà les choses correctement. Leçon : avant de généraliser un pattern, vérifier qu'on généralise **le bon** — « ça a l'air de marcher » n'est pas « c'est juste ».

**Pourquoi le `calc(100%-6rem)` est un piège** : il code en dur la hauteur de l'en-tête. Or mon `EnTetePage` n'a **pas** de hauteur fixe — un sous-titre l'agrandit, et sur mobile le bloc `actions` passe **sous** le titre, ce qui l'agrandit encore. Le calcul était donc **déjà faux** dans ces cas-là : le contenu dépassait, les dernières lignes devenaient inatteignables. Personne ne l'avait vu parce que la Bibliothèque, justement, n'a pas de sous-titre. **Un nombre magique n'est pas faux tout de suite. Il attend.**

**`flex-1 min-h-0`, et le piège du `min-h-0`** : c'est la solution sans nombre magique — la zone de défilement prend ce qui reste, quelle que soit la hauteur réelle de l'en-tête. Mais `min-h-0` n'est pas décoratif : **sans lui, rien ne défile**. Un enfant de flexbox a `min-height: auto` par défaut : il refuse d'être plus petit que son contenu, donc `overflow-y-auto` n'a jamais rien à faire déborder — c'est la section entière qui grandit et sort de l'écran. `min-h-0` lève cette protection. C'est le genre de détail qui fait perdre une heure quand on ne le connaît pas.

**La vraie cause des deux problèmes est la même : la copie.** La police de Mentions légales n'était pas plus petite par décision — `Apropos` et `MentionsLegales` définissaient **chacune leur propre** composant `Titre`, identique en intention, différent en taille (`text-2xl` contre `text-xl`). Les deux pages ont juste été écrites à des moments différents. Pareil pour la mise en page : chaque page reconstruisait sa coquille à la main.

Ironie : le commentaire en tête de mon propre `EnTetePage` dit exactement ça — « recopier le markup dans chaque page, c'est se garantir qu'il divergera à nouveau dès la prochaine page ajoutée ». J'avais compris le principe pour l'en-tête, et je ne l'avais pas appliqué à la coquille qui l'entoure. **Corriger une valeur qui a dérivé, c'est traiter le symptôme ; supprimer la copie, c'est traiter la cause.** D'où `Page.jsx` et `TitreSection.jsx`.

**Un cas particulier qui n'en était pas un** : l'accueil avait son propre en-tête, plus grand et sans icône. En le regardant vraiment, il correspondait **exactement** au modèle d'`EnTetePage` : un titre (« Bonjour X »), un sous-titre, et un bloc à droite (connexion ou avatar). Il n'était pas différent — il avait juste été écrit avant que le composant existe. Beaucoup de « cas particuliers » sont des vestiges chronologiques.

**Le déplacement que la structure a imposé** : sur « Mes demandes », un lien de retour vivait **au-dessus** du titre. Avec un en-tête figé, il n'avait plus de place — je l'ai passé dans le slot `actions`. C'est mieux : il reste visible en permanence au lieu de disparaître au premier défilement. Une contrainte structurelle force parfois une meilleure décision qu'on n'aurait pas prise seul.

**Vérifier au lieu de croire** : j'ai écrit un test qui mesure la position du `<h1>` **avant et après** avoir poussé la zone de contenu jusqu'en bas, sur les 9 pages. Si le titre bouge d'un pixel, c'est rouge. J'ai aussi vérifié que la **fenêtre** ne défile jamais — si elle défile, c'est que la page déborde, l'en-tête « figé » partirait avec le reste et le lecteur en bas serait poussé hors de vue. Une capture d'écran m'aurait montré que « ça a l'air bien ». La mesure me dit que **c'est** bien, et le test empêchera que ça redérive.

---

### 61. Une API tierce ne fait pas ce que sa doc dit — elle fait ce qu'elle fait

**Contexte** : remplacer mon faux catalogue par 100 vraies œuvres Creative Commons via l'**API Jamendo**. J'avais un script écrit d'après la documentation. Il ne marchait pas, et surtout : **il ne marchait pas en silence**.

**Le réflexe qui a tout sauvé : un essai à 5 morceaux avant les 100.** Télécharger 590 Mo pour découvrir ensuite que les genres sont vides, c'est 590 Mo à retélécharger. Sur toute opération longue et coûteuse, **faire d'abord tourner la chaîne complète en miniature**. Ça n'a coûté que 30 secondes et ça a révélé quatre bugs.

**Défaut 1 — un filtre qui filtre à moitié.** Je croyais que `ccnd=0` me donnait du libre. Faux : il écarte les ND (pas de modification) mais **laisse passer tout le NC**. Il faut le **couple** `ccnd=0 ccnc=0` pour n'avoir que `by` et `by-sa`.

**Défaut 2 — les champs qui n'existent que si on les demande.** `license_ccurl` et les genres ne sont **pas renvoyés par défaut**. Sans `include=licenses musicinfo`, ma vérification de licence aurait rejeté 100 % des morceaux — et mes 100 titres seraient arrivés sans genre.

**Défaut 3 — le `+` qui n'en est pas un.** La doc écrit `include=licenses+musicinfo`. Mais dans une URL, `+` **signifie espace**, et `URLSearchParams` encode un `+` littéral en `%2B`. L'API recevait `licenses%2Bmusicinfo`, ne comprenait pas — et **ne disait rien** : elle répondait `success` avec les deux champs vides. La solution : écrire une vraie **espace**, que `URLSearchParams` transforme en `+`. Une heure de perdue sur un caractère.

**Défaut 4 — le pire : des pages vides au hasard.** Le même appel renvoyait tantôt 2 résultats, tantôt 0. La réponse vide :

```json
{ "headers": { "status": "success", "code": 0, "error_message": "", "results_count": 0 },
  "results": [] }
```

**Rien** ne la distingue d'une vraie fin de catalogue. Pas d'erreur, pas d'en-tête de quota. Une à trois pages sur six. Or mon script faisait `if (page.length === 0) break;` — il aurait donc annoncé fièrement **« import terminé »** avec 12 morceaux sur 100, sans un avertissement. **Le pire bug n'est pas celui qui plante : c'est celui qui réussit avec un mauvais résultat.** Correctif : réessayer le même offset 4 fois, avec une pause qui s'allonge, avant de conclure.

**La leçon de méthode, celle que je retiens vraiment.** Mes premiers tests montraient `ccnd=false → 0 résultats`. J'allais en conclure « ce paramètre est invalide ». **C'était le bruit des pages vides.** J'ai failli tirer une conclusion technique d'un artefact.

Ce qui m'a sauvé : changer de mesure. Compter les résultats ne prouvait rien. **Regarder les licences réellement renvoyées** sur 250 morceaux, oui — et là, la vérité saute aux yeux :

| Filtre | Ce qui revient vraiment |
|---|---|
| aucun | licence absente (!) |
| `ccnd=0` | by, by-sa… **et by-nc, by-nc-sa** |
| `ccnd=0 ccnc=0` | **by et by-sa uniquement** ✅ |

**Mesurer la bonne chose vaut mieux que mesurer beaucoup.** Face à une API instable, une seule observation ne prouve rien : il faut répéter, et surtout observer **la propriété qui compte** (ici : la licence), pas une approximation commode (le nombre de résultats).

**Défaut 5, trouvé à l'œil sur une capture** : l'affichage montrait « Ground **&amp;** Leaves ». L'API rend ses textes **encodés pour le HTML**. React échappe systématiquement ce qu'il affiche — c'est sa protection contre les injections —, donc il rendait l'esperluette littéralement. Le bug n'est pas dans React : la valeur qu'on lui donnait était **déjà encodée, une fois de trop**. Je décode donc **à l'entrée**, quand la donnée quitte l'API. Une base doit contenir **du texte, pas du HTML** : sinon chaque lecteur (le player, la recherche, un futur export) devrait re-décoder pour son compte, et l'un d'eux oubliera. Détail d'implémentation : décoder `&amp;` **en dernier**, sinon `&amp;lt;` devient `<` au lieu de `&lt;`.

**Le piège du test qui connaissait trop de choses.** Mon test du lecteur cliquait sur « Believer ». Le catalogue remplacé, il a cherché 30 secondes un texte disparu puis échoué sur un timeout illisible. La tentation : y mettre le nom du nouveau premier morceau. **Ça aurait refermé le même piège au prochain import.** Le test vise maintenant la première pochette venue — le titre du morceau n'a aucune importance pour tester un lecteur. **Même leçon que la note 55 : un test ne suppose rien du contenu de la base.**

**Et une décision produit, pas technique** : `groupby=artist_id`, un seul morceau par artiste. Sans ça, « les 100 plus écoutés » donne une quinzaine d'artistes avec sept titres chacun. **100 artistes différents font un catalogue ; quinze font une playlist.** L'API offrait le paramètre, encore fallait-il se demander à quoi doit *ressembler* un bon catalogue plutôt que juste comment en télécharger 100.

---

### 62. Lire une licence Creative Commons

**Contexte** : mon catalogue importé annonce « 38 CC BY 3.0, 60 CC BY-SA 3.0, 2 CC BY-SA 2.5, zéro NC, zéro ND ». Je lisais ça comme du charabia. Ce sont pourtant les conditions auxquelles j'ai le droit de diffuser 100 morceaux.

**Une licence CC n'est pas un bloc, c'est un assemblage de quatre briques** :

| Brique | Nom | Ce que ça impose |
|---|---|---|
| **BY** | Attribution | **Créditer** l'auteur. Présente dans **toutes** les licences CC modernes. |
| **SA** | Share Alike | Si tu **modifies**, ta version porte **la même licence**. |
| **NC** | Non Commercial | Pas d'usage commercial. |
| **ND** | No Derivatives | Interdit de diffuser une version **modifiée**. |

D'où six combinaisons : `BY` → `BY-SA` → `BY-NC` → `BY-NC-SA` → `BY-ND` → `BY-NC-ND`, de la plus libre à la plus fermée. Mon catalogue est entièrement dans les deux premières.

**Le SA ne me concerne pas, et c'est le malentendu classique du copyleft.** J'avais la crainte diffuse que « partage à l'identique » contamine tout ce qu'il touche. Mais la condition se déclenche **si on modifie l'œuvre**. Spotifree diffuse le mp3 **tel quel** : c'est une diffusion *verbatim*, pas une œuvre dérivée. **Pour mon usage, `CC BY` et `CC BY-SA` imposent donc exactement la même chose : créditer.** La différence entre mes 38 et mes 60 morceaux est nulle en pratique. Elle n'apparaîtrait que si je faisais des mashups ou publiais des remixes.

**Et mon code n'est pas concerné du tout** : une licence CC porte sur l'œuvre qu'elle couvre, pas sur le logiciel qui la diffuse. Une bibliothèque ne devient pas copyleft parce qu'elle prête des livres.

**Pourquoi exclure NC et ND alors qu'ils ne me gênaient pas ?** Honnêtement : un `BY-NC-ND` serait diffusable sur Spotifree **tel qu'il est aujourd'hui** — mon app est gratuite et ne modifie rien. Le problème est **demain**. Le jour où j'ajoute une pub ou un abonnement, tous mes morceaux NC deviennent illégaux d'un coup, et je ne m'en souviendrai pas. En prime, « non commercial » n'est même pas défini précisément dans la licence : c'est une zone grise reconnue. Avec BY et BY-SA, **aucune condition à revérifier** — je peux monétiser, remixer, tout faire, il faut juste créditer. **On coupe la question à la racine plutôt que de se la reposer à chaque évolution.**

**Les numéros de version — et le vrai piège** : ce sont les versions du **texte juridique**, pas de la musique. 2.5 (2005) permet de créditer un tiers désigné ; 3.0 (2007) adapte le texte pays par pays ; 4.0 (2013) est un texte international unique qui couvre aussi les droits sur les bases de données.

Mais surtout — **le délai de réparation** :

- En **4.0**, si je viole la licence (un crédit oublié), j'ai **30 jours pour corriger** à compter du moment où je m'en aperçois : mes droits sont rétablis automatiquement.
- En **3.0 et avant**, ce délai n'existe pas. La licence **se termine automatiquement et définitivement** dès la violation. Pour rediffuser, il faut **redemander la permission à l'artiste**.

**98 % de mon catalogue est en 3.0 ou 2.5.** Traduction : si mon `Attribution.jsx` disparaissait — un refactor, une régression CSS, quelqu'un qui trouve ça moche —, je perdrais **définitivement** le droit de diffuser ces 100 morceaux. C'est pour ça que la règle est dans `CLAUDE.md` et que l'affichage du crédit n'est pas négociable. Ce n'est pas du zèle : c'est la condition du droit de diffusion.

**Une licence n'est pas rétroactive** : l'artiste a choisi sa version le jour de la mise en ligne, et elle ne bouge plus. D'où le 3.0 majoritaire sur Jamendo alors que la 4.0 existe depuis 2013.

**Ce qu'il ne faut jamais oublier : libre ≠ domaine public.** Une licence CC est un **contrat** : elle accorde des droits **à condition** d'en respecter les termes. Diffuser du CC BY sans créditer, c'est violer la licence — juridiquement la même infraction que de diffuser une œuvre sous copyright sans autorisation. La seule différence, c'est que la condition est facile à remplir.

---

### 63. Un filtre ne vaut que ce que valent ses données

**Contexte** : mes 100 morceaux importés ont maintenant un genre. Ajouter un filtre par genre dans la Bibliothèque paraissait être un petit chantier d'interface : quelques pastilles, un `useState`, un `.filter()`. J'ai voulu voir les données d'abord.

**Ce que j'ai trouvé** : 100 morceaux, **25 genres**, dont **14 avec un seul morceau**. Et des libellés qui n'en étaient pas : « Rnb », « Edm », « Alternativehiphop », « Singersongwriter », « Poprock ». Mon `genreDe()` prenait le tag brut de l'API et se contentait d'y mettre une majuscule.

**Le filtre aurait été techniquement parfait et humainement inutile.** Un menu de 25 entrées dont 14 mènent à un seul titre, c'est pire que pas de filtre : l'utilisateur clique sur « Filmscore », tombe sur un morceau, et repart. **Un filtre doit ouvrir des portes, pas des placards.** Le bug n'était pas dans le code que j'allais écrire — il était dans la donnée que j'avais laissée entrer trois heures plus tôt.

**Mesurer avant de décider (encore).** J'allais écrire ma table de correspondance au jugé. Je suis allé compter les tags réels sur 400 morceaux : **66 tags distincts**, une longue traîne à une occurrence (`bossanova`, `8bit`, `waltz`, `manouche`, `rockabilly`…). Sans cette mesure j'aurais inventé des familles pour des genres inexistants et oublié `world` (7 occurrences), que je n'avais pas prévu. **La table est bâtie sur ce que l'API produit, pas sur ce que j'imagine de la musique.**

**Jamendo n'a pas des genres, il a des tags.** La distinction n'est pas cosmétique : un genre est une case, un tag est une étiquette libre. Une même chanson porte `["rock", "metal", "hardcore"]`. Ma colonne `genre` attend **une** valeur. Il faut donc *choisir*, et ce choix est de la **curation** — pas de la technique. Que le funk aille avec la soul, le blues avec le jazz : c'est discutable, et c'est assumé.

**`genres[0]` n'était pas le bon choix.** Je prenais le premier tag. Mais un morceau taggé `["indie", "pop"]` rendait « Indie » — or **indie n'est pas un son, c'est une posture** : ça ne dit pas si on a affaire à du rock ou de la pop. La solution : *parcourir* le tableau et retenir le premier tag qui tombe dans une famille, en laissant `indie` et `experimental` **volontairement hors de la table**. Ils sont alors ignorés, et on tombe sur le tag suivant, plus précis.

**Ne jamais perdre de l'information en silence.** Les tags non classés sont désormais **listés en fin d'import** : `indie (4), filmscore (1)`. Ce n'est pas une erreur — la longue traîne n'a pas vocation à devenir une famille. Mais si un tag revient souvent, c'est qu'il manque une case, et **je ne peux le voir que si le script me le dit**. Un import qui jette discrètement est un import qu'on ne peut pas améliorer.

**Nettoyer à l'entrée, pas à l'affichage.** Même raisonnement que pour les entités HTML (note 61) : le repliement se fait **à l'import**, pas dans le composant React. Si je mappais à l'affichage, la base contiendrait « alternativehiphop », et **chaque** endroit qui lit `genre` — la bibliothèque, une future recherche, l'admin, un export — devrait re-mapper pour son compte. L'un d'eux oubliera. **Une base contient de la donnée propre.**

**Déduire la liste plutôt que l'écrire.** Les pastilles viennent d'un `useMemo` qui compte les genres **présents dans le catalogue**. Écrire la liste en dur aurait été plus rapide — et faux dès le prochain import, ou dès qu'un dépôt approuvé apporte un genre nouveau : une pastille vide, ou un genre invisible. **La donnée est la source de vérité, pas une constante que je maintiens à la main.**

**Le test qui ne doit pas connaître le catalogue.** Mon test e2e ne peut pas cliquer sur « Jazz » — ce serait refaire l'erreur de « Believer » (note 61). Il prend **la première pastille venue** et vérifie le *comportement* : filtrer réduit la liste, le texte se **cumule** avec le genre (chercher dans un genre ne doit pas annuler le genre), recliquer annule. Le nom du genre n'a aucune importance.

**Une dette que j'assume et que j'écris** : le formulaire de dépôt laisse le genre en **texte libre**. Un dépôt approuvé avec « Trap » créera une pastille à un morceau, et la dérive recommencera lentement. Le passer en `<select>` sur les mêmes familles réglerait ça à la source — comme je l'ai fait pour la licence. Pas fait aujourd'hui : la modération absorbe le cas. Mais c'est noté, parce qu'**une dette qu'on n'écrit pas n'est pas une dette, c'est un oubli**.

---

### 64. Trois façons de casser en silence (et pourquoi mes tests étaient verts)

**Contexte** : Manuel me signale que le lecteur ne marche « pas vraiment » — play, précédent et suivant fonctionnent, mais **impossible de toucher au volume ni de se déplacer dans le morceau**. Mes 147 tests étaient verts, dont un test « lecteur ». Deux heures plus tôt, j'avais aussi cassé le bouton « Modifier » du Catalogue admin sans que rien ne bronche.

**Quatre bugs, un point commun : aucun ne fait de bruit.**

**1. Déstructurer une valeur qui n'est pas un tableau.**
```js
onValueChange={([nouvelleValeur]) => ...}   // Base UI rend un NOMBRE
```
`const [x] = 18` lève `number 18 is not iterable`. Le gestionnaire meurt **avant d'agir**. Pour l'utilisateur : un curseur qui ne bouge pas. Aucun message, aucun symptôme, sauf dans la console.

La signature de la bibliothèque le disait pourtant :
```ts
onValueChange?: ((value: Value extends number ? number : Value, …) => void)
```
Une valeur nombre → un nombre. Un tableau → un tableau. **Le contrat était écrit dans les types que j'avais sous la main.**

**2. Un attribut HTML qui n'existe pas.**
```jsx
<audio volume={volume / 100} />   // ne fait RIEN
```
Le `volume` d'un `<audio>` est une **propriété du DOM**, pas un attribut HTML. React écrit donc sagement `volume="0.5"` dans le balisage et le navigateur l'ignore poliment. Résultat : le curseur affichait 50 %, le son sortait à 100 %. **React ne prévient pas** — il pose l'attribut et passe à autre chose. Vérifié en le mesurant : `getAttribute("volume")` → `"0.5"`, `audio.volume` → `1`. **L'attribut existait, la propriété non.**

La correction n'est pas de l'écrire ailleurs, c'est un `useEffect` : *l'état décide, l'effet applique*. Avant, le volume était écrit à deux endroits (le JSX et le gestionnaire du curseur). **Deux endroits qui écrivent la même chose finissent toujours par ne plus être d'accord.**

**3. Un composant tiers qui devine mal.** Le wrapper `slider.jsx` livré par shadcn :
```js
const _values = Array.isArray(value) ? value : ... : [min, max]
```
Il ne prévoit que deux cas : un tableau → autant de poignées, sinon `[min, max]` → deux poignées, en supposant un curseur d'**intervalle**. Il oublie le cas le plus courant : `value={50}`, une valeur unique contrôlée. Mes deux curseurs dessinaient donc **deux poignées** pour une seule valeur — l'une collée à 0, l'autre à 100. Le glisser semblait marcher (on attrapait une poignée au hasard) ; le clavier donnait le focus à la poignée fantôme bloquée sur `min`, et les flèches ne faisaient rien. **Le code qu'on n'a pas écrit reste du code dont on est responsable.**

**4. Durcir un contrat sans chercher ses appelants.** En rendant la licence obligatoire sur `PUT /api/musics/update/:id`, mon test admin est devenu rouge. Je l'ai « réparé » en lui faisant envoyer une licence. **Je n'ai pas cherché qui d'autre appelait cette route.** `AdminMusiques.jsx` continuait d'envoyer `{title, artist, genre}` et se prenait un 400 : le bouton « Modifier » ne marchait plus **du tout**, et la suite était verte.

**La leçon** : quand un test devient rouge après un durcissement, il ne se plaint pas pour lui — il annonce que **le contrat a changé**. Ce sont les **appelants** qu'il faut aller chercher, pas le test qu'il faut faire taire. `grep` sur la route aurait suffi.

**Pourquoi mes tests ne voyaient rien, et c'est LE vrai sujet.**

Mon test « lecteur » vérifiait : un seul `<audio>`, la lecture démarre, Pause fonctionne. Trois assertions justes — et **il ne touchait jamais aux curseurs**. J'avais même une assertion globale « aucune erreur JavaScript dans la console », qui passait : **elle ne peut attraper que les erreurs de ce qu'on exerce.** Un test qui ne touche pas à un curseur ne prouve rien sur ce curseur, et l'absence d'erreur ne prouve que l'absence d'erreur *sur le chemin parcouru*.

De même, mon test d'API admin prouvait que **l'API répond correctement** — pas que **l'application l'appelle correctement**. Ce sont deux affirmations différentes, et je les avais confondues.

**Un test vert ne dit pas « ça marche ». Il dit « ce que j'exerce marche ».** Toute la question est de savoir ce qu'il exerce — et j'avais arrêté de me la poser.

**Ce que j'ai fait ensuite, et qui compte autant que la correction** : j'ai **remis le bug** pour vérifier que le nouveau test devient rouge. Il l'est devenu, en pointant la cause exacte (`number 49 is not iterable`). **Un test de non-régression qu'on n'a jamais vu échouer n'est pas un test : c'est une décoration.**

**Détail qui m'a coûté du temps, et qui vaut d'être noté** : mon premier test clavier échouait, et j'ai cru le bug plus profond. En réalité **mon test était faux** : la poignée est un `<div>` non focusable qui contient un `<input type="range">` caché. `focus()` sur le div ne fait rien, le focus restait sur `<body>`, les flèches partaient dans le vide. **Avant d'accuser le code, vérifier que la mesure mesure la bonne chose.** C'est la troisième fois de la journée que ça me sauve.

---

### 65. Une cible de 4 pixels, et un débordement que personne ne regardait

**Contexte** : après avoir réparé les curseurs du lecteur, Manuel me signale que le **glisser est fluide** mais que le **clic sur le rail est bancal** : « des fois ça fonctionne, des fois pas, des fois il faut cliquer plusieurs fois ».

**Ce que j'avais sous les yeux et que je n'ai pas chassé.** Mon diagnostic précédent affichait `"boite": 4` pour le curseur. J'ai lu ce chiffre, j'ai enchaîné sur le clavier et le glisser, et je suis passé à autre chose. **Une mesure aberrante qu'on ne poursuit pas est une mesure gâchée.** « Des fois ça marche » était l'indice : ce n'est jamais du hasard, c'est une condition qu'on n'a pas identifiée.

**La mesure qui tranche.** Plutôt que de deviner, j'ai balayé verticalement autour du rail en notant à chaque fois si le clic était pris en compte :

```
dy = -3 px -> non      dy = 0 px -> OUI      dy = +3 px -> non
```

**Quatre pixels.** Pas « bancal » : une cible de 4 px est simplement **invisable à la souris**. La loi de Fitts n'est pas une opinion — le temps pour atteindre une cible dépend de sa taille. À 4 px, on tape à côté deux fois sur trois. Le ressenti « ça marche une fois sur trois » était une **mesure exacte**, exprimée en langage humain.

**La cause** : le `Control` (l'élément qui capte les clics) n'avait aucune hauteur propre. Il se réduisait à celle de son contenu — le trait de 4 px, puisque la poignée est en `position: absolute` et ne compte pas dans le flux. Ironie : la poignée avait droit à un `after:-inset-2` pour étendre sa zone de clic à 28 px. **Le rail, lui, n'avait rien.** On pouvait attraper la poignée, mais pas cliquer à côté.

La correction tient en une classe : `data-horizontal:h-5` sur le `Control`. **20 px de zone cliquable, 4 px de trait à l'œil** — le rail reste fin, centré par `items-center`. Rien ne change visuellement, tout change à l'usage.

**Le bug que la correction a révélé, et qui était le mien.** En mesurant, je découvre que le lecteur **débordait de sa carte de 11 px** : la barre de progression sortait sous le panneau, posée sur le fond de la page.

La cause remonte au matin : la carte du lecteur vit dans une ligne de grille de **hauteur fixe** (`grid-rows-[minmax(0,1fr)_88px]`). Son contenu ne peut donc pas la faire grandir — **il déborde, silencieusement**. Et 88 px, c'était exactement la taille du contenu d'alors. En ajoutant la ligne d'attribution CC (que la licence exige), je l'ai fait déborder. **Un conteneur taillé au pixel près est un conteneur qui cassera au premier ajout.**

**Pourquoi rien ne l'a vu — et c'est le vrai enseignement.** J'avais :
- **une capture d'écran** : le débordement y était visible, mais il faut savoir où regarder. Je regardais si le rail était fin, pas s'il sortait de la carte.
- **un test « l'app tient dans l'écran »** : il passait. Le débordement restait **dans la fenêtre** (885 px sur 900) — il ne sortait que du **panneau**. Le test vérifiait la bonne chose au mauvais niveau.

Un test de mise en page qui ne regarde que la fenêtre ne dit rien des conteneurs à l'intérieur. `scrollHeight > clientHeight` sur la carte, lui, le dit sans ambiguïté — et sans qu'on ait à savoir où regarder.

**Comment j'ai écrit le test pour qu'il prouve quelque chose.** Il clique **volontairement à 6 px du centre**. Au centre, il passerait même avec la bande de 4 px, et ne prouverait donc rien. Puis j'ai remis l'ancienne hauteur (`88px`) pour vérifier que le test devient rouge : « déborde de 13 px ». **Un test qu'on n'a pas vu échouer ne teste rien** — c'est la deuxième fois de la journée que je me le rappelle.

**Et j'ai cassé le build en écrivant le commentaire.** J'ai mis un `{/* … */}` juste avant le `<section>` racine dans un `return (…)` : deux éléments adjacents, JSX invalide. Un commentaire JSX est une **expression**, pas une annotation flottante. Dans un `return`, avant l'élément, il faut un `//` classique — on est encore en JavaScript, le JSX n'a pas commencé.

**Ce que je retiens** : trois bugs de cette journée (les curseurs, le débordement, la zone de 4 px) étaient **invisibles aux tests mais évidents à l'usage**. Manuel les a tous trouvés en cliquant. Mes tests couvrent ce que j'ai pensé à exercer ; **ils ne remplacent pas quelqu'un qui se sert vraiment de l'application**. Le bon réflexe n'est pas d'écrire plus de tests a priori — c'est de transformer chaque retour d'usage en test, une fois qu'on sait quoi regarder.

---
