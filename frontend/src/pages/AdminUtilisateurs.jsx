import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Users, Shield, ShieldOff, Trash2, ListMusic, Heart, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { apiFetch, messageErreur } from "@/lib/api";

export default function AdminUtilisateurs({ user }) {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [aSupprimer, setASupprimer] = useState(null);

  useEffect(() => {
    charger();
  }, []);

  function charger() {
    apiFetch("/api/admin/utilisateurs")
      .then(({ donnees }) => {
        setUtilisateurs(Array.isArray(donnees) ? donnees : []);
      })
      .catch((error) => console.error(error))
      .finally(() => setChargement(false));
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  async function changerRole(cible, role) {
    try {
      const { reponse, donnees } = await apiFetch(
        `/api/admin/utilisateurs/${cible.id_user}/role`,
        { method: "PATCH", body: { role } },
      );

      if (!reponse.ok) {
        const message = messageErreur(reponse, donnees);
        if (message) toast.error(message);
        return;
      }

      toast.success(donnees.message);
      setUtilisateurs((prev) =>
        prev.map((u) => (u.id_user === cible.id_user ? { ...u, role } : u)),
      );
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }

  async function supprimer(cible) {
    try {
      const { reponse, donnees } = await apiFetch(
        `/api/admin/utilisateurs/${cible.id_user}`,
        { method: "DELETE" },
      );

      if (!reponse.ok) {
        const message = messageErreur(reponse, donnees);
        if (message) toast.error(message);
        return;
      }

      toast.success(donnees.message);
      setUtilisateurs((prev) =>
        prev.filter((u) => u.id_user !== cible.id_user),
      );
      setASupprimer(null);
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    }
  }

  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">
            Utilisateurs
          </h1>
          <p className="text-sm text-muted-foreground">
            {utilisateurs.length} compte{utilisateurs.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* On n'edite volontairement PAS le pseudo, le nom ou l'email de quelqu'un.
          L'email est l'identifiant de connexion : pouvoir le changer reviendrait a pouvoir
          s'approprier un compte. Un admin a les droits que son role exige, pas tous ceux qui
          sont techniquement possibles. */}
      <p className="mb-4 text-xs text-muted-foreground">
        Les identités (pseudo, nom, email) ne sont pas modifiables : seul leur
        propriétaire peut les changer.
      </p>

      {chargement ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {utilisateurs.map((u) => {
            const estMoi = u.id_user === user.id_user;

            return (
              <li
                key={u.id_user}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-4 lg:flex-row lg:items-center"
              >
                <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white">
                  {u.pseudo?.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    <span className="truncate">{u.pseudo}</span>
                    {u.role === "admin" ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    ) : null}
                    {estMoi ? (
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        (toi)
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {u.first_name} {u.last_name} — {u.email}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Inscrit le{" "}
                    {new Date(u.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <span className="inline-flex items-center gap-1" title="Playlists">
                    <ListMusic className="w-3.5 h-3.5" />
                    {u.nb_playlists}
                  </span>
                  <span className="inline-flex items-center gap-1" title="Favoris">
                    <Heart className="w-3.5 h-3.5" />
                    {u.nb_likes}
                  </span>
                  <span className="inline-flex items-center gap-1" title="Dépôts">
                    <UploadCloud className="w-3.5 h-3.5" />
                    {u.nb_depots}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {u.role === "admin" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1.5"
                      disabled={estMoi}
                      title={
                        estMoi ? "Tu ne peux pas retirer ton propre rôle" : undefined
                      }
                      onClick={() => changerRole(u, "user")}
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                      Retirer admin
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => changerRole(u, "admin")}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Passer admin
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    size="icon-sm"
                    className="rounded-full"
                    disabled={estMoi}
                    aria-label={`Supprimer le compte de ${u.pseudo}`}
                    title={
                      estMoi ? "Tu ne peux pas supprimer ton propre compte" : undefined
                    }
                    onClick={() => setASupprimer(u)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* La suppression est irreversible : on annonce precisement ce qui va disparaitre, plutot
          qu'un "Êtes-vous sûr ?" qui n'informe de rien. */}
      <Dialog
        open={aSupprimer !== null}
        onOpenChange={(ouvert) => !ouvert && setASupprimer(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce compte ?</DialogTitle>
            <DialogDescription>
              Le compte de <strong>{aSupprimer?.pseudo}</strong> sera supprimé
              définitivement, ainsi que{" "}
              <strong>{aSupprimer?.nb_playlists} playlist(s)</strong>,{" "}
              <strong>{aSupprimer?.nb_likes} favori(s)</strong> et{" "}
              <strong>{aSupprimer?.nb_depots} dépôt(s)</strong>. Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
            <Button
              variant="destructive"
              onClick={() => supprimer(aSupprimer)}
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
