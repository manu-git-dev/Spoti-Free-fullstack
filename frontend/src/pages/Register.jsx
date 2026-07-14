import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Music, Check, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { emailValide, motDePasseValide } from "@/lib/validation";
import ChecklistMotDePasse from "@/composants/ChecklistMotDePasse";

// Le petit signe vert/rouge affiche a droite d'un champ.
// Defini HORS du composant : un composant declare a l'interieur d'un autre est recree a chaque
// rendu, donc demonte et remonte a chaque frappe. Ici ce ne serait qu'un SVG, mais c'est
// exactement comme ca qu'on perd le focus d'un champ sans comprendre pourquoi.
function IconeEtat({ valide, enErreur }) {
  if (valide) {
    return (
      <Check
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-success"
        aria-hidden="true"
      />
    );
  }
  if (enErreur) {
    return (
      <X
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive"
        aria-hidden="true"
      />
    );
  }
  return null;
}

export default function Register() {
  const [message, setMessage] = useState("");
  const [typeMessage, setTypeMessage] = useState("");
  const navigate = useNavigate();

  // Ces trois champs sont CONTROLES (leur valeur vit dans un state) : c'est ce qui permet de les
  // valider a chaque frappe. Les trois autres (pseudo, prenom, nom) n'ont rien a valider en
  // direct et restent lus par `FormData` au moment de l'envoi — inutile de leur ajouter un state.
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");

  // "Touche" = l'utilisateur est deja sorti du champ. Tant que ce n'est pas le cas, on n'affiche
  // aucune erreur : on ne met pas une croix rouge a quelqu'un qui n'a pas fini d'ecrire.
  const [touche, setTouche] = useState({});
  const [tentativeEnvoi, setTentativeEnvoi] = useState(false);
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);

  const emailOk = emailValide(email);
  const motDePasseOk = motDePasseValide(motDePasse);
  const confirmationOk = confirmation !== "" && confirmation === motDePasse;

  // Un champ passe au rouge s'il est invalide ET que l'utilisateur en est sorti (ou a tente
  // d'envoyer). Un champ encore vide ne devient rouge qu'a la tentative d'envoi : sortir d'un
  // champ sans l'avoir rempli, ce n'est pas encore une faute.
  function enFaute(nom, valeur, valide) {
    if (valide) return false;
    if (tentativeEnvoi) return true;
    return Boolean(touche[nom]) && valeur !== "";
  }

  const erreurEmail = enFaute("email", email, emailOk);
  const erreurMotDePasse = enFaute("password", motDePasse, motDePasseOk);
  const erreurConfirmation = enFaute("confirm", confirmation, confirmationOk);

  function marquerTouche(nom) {
    setTouche((precedent) => ({ ...precedent, [nom]: true }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTentativeEnvoi(true);

    // Le bouton reste toujours cliquable (un bouton grise sans explication laisse l'utilisateur
    // sans savoir ce qu'on lui reproche). C'est donc ici qu'on bloque l'envoi.
    if (!emailOk || !motDePasseOk || !confirmationOk) {
      setTypeMessage("error");
      setMessage(
        !confirmationOk && emailOk && motDePasseOk
          ? "Les mots de passe ne correspondent pas."
          : "Certains champs ne sont pas valides.",
      );
      return;
    }

    const formData = new FormData(event.currentTarget);

    const user = {
      pseudo: formData.get("pseudo"),
      prenom: formData.get("prenom"),
      nom: formData.get("nom"),
      email,
      password: motDePasse,
    };

    try {
      const { reponse, donnees } = await apiFetch("/api/users/inscription", {
        method: "POST",
        body: user,
      });
      if (!reponse.ok) {
        setTypeMessage("error");
        setMessage(donnees.message);
        return;
      }
      setTypeMessage("success");
      setMessage(donnees.message);
      setTimeout(() => {
        navigate("/connexion");
      }, 3000);
    } catch (erreur) {
      setTypeMessage("error");
      setMessage("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }

  return (
    <>
      {" "}
      {message ? (
        <Alert variant={typeMessage === "success" ? "success" : "destructive"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <section className="h-full flex flex-col justify-center items-center p-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
          <Music className="text-primary-foreground w-7 h-7" />
        </div>
        <h1 className="text-4xl font-serif">Inscription</h1>
        <p className="text-muted-foreground text-center mb-6">
          Crée ton compte gratuitement et commence à écouter.
        </p>
        <form
          action=""
          className="flex flex-col gap-2 w-full max-w-sm"
          onSubmit={handleSubmit}
          noValidate
        >
          <fieldset className="flex flex-col gap-1.5 w-full">
            <legend className="text-sm mb-1">Pseudo</legend>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="pseudo"
                type="text"
                className="pl-8"
                placeholder="Ton pseudo"
              />
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-1.5 w-full">
            <legend className="text-sm mb-1">Prénom</legend>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="prenom"
                type="text"
                className="pl-8"
                placeholder="Ton prénom"
              />
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-1.5 w-full">
            <legend className="text-sm mb-1">Nom</legend>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="nom"
                type="text"
                className="pl-8"
                placeholder="Ton nom"
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-1.5 w-full">
            <legend className="text-sm mb-1">Email</legend>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="email"
                type="email"
                className={cn(
                  "pl-8 pr-8",
                  erreurEmail && "border-destructive",
                  emailOk && "border-success",
                )}
                placeholder="ton@email.fr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => marquerTouche("email")}
                aria-invalid={erreurEmail}
                aria-describedby={erreurEmail ? "erreur-email" : undefined}
              />
              <IconeEtat valide={emailOk} enErreur={erreurEmail} />
            </div>
            {erreurEmail ? (
              <p id="erreur-email" className="text-xs text-destructive">
                {email === ""
                  ? "L'adresse email est obligatoire."
                  : "Cette adresse email n'est pas valide."}
              </p>
            ) : null}
          </fieldset>

          <fieldset className="flex flex-col gap-1.5 w-full">
            <legend className="text-sm mb-1">Mot de passe</legend>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="password"
                type={motDePasseVisible ? "text" : "password"}
                className={cn(
                  "pl-8 pr-9",
                  erreurMotDePasse && "border-destructive",
                  motDePasseOk && "border-success",
                )}
                placeholder="Ton mot de passe"
                value={motDePasse}
                onChange={(event) => setMotDePasse(event.target.value)}
                onBlur={() => marquerTouche("password")}
                aria-invalid={erreurMotDePasse}
                aria-describedby="regles-mot-de-passe"
              />
              <button
                type="button"
                onClick={() => setMotDePasseVisible((visible) => !visible)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  motDePasseVisible
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {motDePasseVisible ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <ChecklistMotDePasse
              id="regles-mot-de-passe"
              motDePasse={motDePasse}
              montrerErreurs={erreurMotDePasse}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-1.5 w-full">
            <legend className="text-sm mb-1">Confirmation du mot de passe</legend>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="confirmPassword"
                type="password"
                className={cn(
                  "pl-8 pr-8",
                  erreurConfirmation && "border-destructive",
                  confirmationOk && "border-success",
                )}
                placeholder="Confirme ton mot de passe"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                onBlur={() => marquerTouche("confirm")}
                aria-invalid={erreurConfirmation}
                aria-describedby={
                  erreurConfirmation ? "erreur-confirmation" : undefined
                }
              />
              <IconeEtat
                valide={confirmationOk}
                enErreur={erreurConfirmation}
              />
            </div>
            {erreurConfirmation ? (
              <p id="erreur-confirmation" className="text-xs text-destructive">
                {confirmation === ""
                  ? "Confirme ton mot de passe."
                  : "Les deux mots de passe ne correspondent pas."}
              </p>
            ) : null}
          </fieldset>

          <Button className="rounded-full w-full mt-4" type="submit">
            Inscription
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4">
          Déjà un compte ?{" "}
          <Link
            to="/connexion"
            className="text-primary underline-offset-4 hover:underline"
          >
            Connexion
          </Link>
        </p>
      </section>
    </>
  );
}
