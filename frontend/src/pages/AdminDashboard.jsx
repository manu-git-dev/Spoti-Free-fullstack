import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Music,
  ListMusic,
  Heart,
  Play,
  Inbox,
  Eye,
  Clock,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import {
  CourbeTemporelle,
  BarresClassement,
  Colonnes,
} from "../composants/graphiques/Graphiques";
import { apiFetch } from "@/lib/api";
import EnTetePage from "../composants/EnTetePage";

// Les statuts ne sont PAS des couleurs de serie : ce sont des etats. Ils ont leur propre
// palette reservee, et ils sortent TOUJOURS accompagnes d'une icone et d'un mot — jamais
// identifies par la seule couleur.
const STATUTS_DEPOT = {
  en_attente: {
    label: "En attente",
    icone: Clock,
    classe: "text-muted-foreground",
  },
  approuve: { label: "Approuvés", icone: Check, classe: "text-success" },
  refuse: { label: "Refusés", icone: X, classe: "text-destructive" },
};

function Tuile({ icone: Icone, valeur, libelle, accent = false }) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icone className={`w-4 h-4 ${accent ? "text-primary" : ""}`} />
        <span className="text-xs">{libelle}</span>
      </div>
      {/* Le chiffre EST le graphique : pas de mini-courbe decorative derriere. */}
      <p className="text-2xl font-bold tabular-nums">
        {valeur.toLocaleString("fr-FR")}
      </p>
    </div>
  );
}

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    apiFetch("/api/admin/stats")
      .then(({ donnees }) => setStats(donnees))
      .catch((error) => console.error(error))
      .finally(() => setChargement(false));
  }, []);

  // Confort d'affichage uniquement : la protection reelle est `adminMiddleware`, cote serveur.
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (chargement) {
    return (
      <section className="h-full overflow-y-auto p-4 md:p-8">
        <p className="text-muted-foreground">Chargement des statistiques…</p>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="h-full overflow-y-auto p-4 md:p-8">
        <p className="text-destructive">
          Impossible de charger les statistiques.
        </p>
      </section>
    );
  }

  const { totaux } = stats;

  const depotsParStatut = ["en_attente", "approuve", "refuse"].map(
    (statut) => ({
      statut,
      nombre:
        stats.repartitionDepots.find((d) => d.statut === statut)?.nombre ?? 0,
    }),
  );

  return (
    <section className="h-full overflow-y-auto p-4 md:p-8">
      <EnTetePage
        icone={LayoutDashboard}
        titre="Tableau de bord"
        sousTitre="Vue d'ensemble de Spoti-Free"
      />

      {/* Les totaux : des chiffres, pas des graphiques. Une valeur unique n'a pas besoin
          d'etre dessinee. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Tuile
          icone={Eye}
          valeur={totaux.visiteurs30j}
          libelle="Visiteurs (30 j)"
          accent
        />
        <Tuile
          icone={Users}
          valeur={totaux.utilisateurs}
          libelle="Utilisateurs"
        />
        <Tuile icone={Play} valeur={totaux.ecoutes} libelle="Écoutes totales" />
        <Tuile icone={Music} valeur={totaux.musiques} libelle="Morceaux" />
        <Tuile
          icone={ListMusic}
          valeur={totaux.playlists}
          libelle="Playlists"
        />
        <Tuile icone={Heart} valeur={totaux.likes} libelle="Likes" />
        <Tuile
          icone={Eye}
          valeur={totaux.pagesVues30j}
          libelle="Pages vues (30 j)"
        />
        <Tuile
          icone={Inbox}
          valeur={totaux.depotsEnAttente}
          libelle="Dépôts à traiter"
          accent
        />
      </div>

      {/* Raccourci vers la modération quand il y a du travail en attente. */}
      {totaux.depotsEnAttente > 0 ? (
        <Link
          to="/admin/depots"
          className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 mb-4 transition-colors hover:bg-primary/15"
        >
          <Inbox className="w-5 h-5 text-primary shrink-0" />
          <span className="flex-1 text-sm">
            <span className="font-medium">
              {totaux.depotsEnAttente}{" "}
              {totaux.depotsEnAttente > 1 ? "dépôts attendent" : "dépôt attend"}{" "}
              ta validation
            </span>
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </Link>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Deux series de meme unite -> un seul axe, une legende. */}
        <div className="lg:col-span-2">
          <CourbeTemporelle
            titre="Fréquentation"
            sousTitre="30 derniers jours"
            donnees={stats.visitesParJour}
            series={[
              { cle: "visiteurs", libelle: "Visiteurs uniques" },
              { cle: "pages_vues", libelle: "Pages vues" },
            ]}
          />
        </div>

        <Colonnes
          titre="Inscriptions"
          sousTitre="30 derniers jours"
          donnees={stats.inscriptionsParJour}
          cleValeur="nombre"
        />

        {/* Repartition des depots : trois etats, trois chiffres. Un camembert de trois parts
            se lit moins bien que trois nombres poses cote a cote. */}
        <section className="rounded-2xl border border-border bg-background/50 p-5">
          <h2 className="font-semibold mb-1">Dépôts de musique</h2>
          <p className="text-xs text-muted-foreground mb-4">Depuis le début</p>

          <ul className="grid grid-cols-3 gap-3">
            {depotsParStatut.map(({ statut, nombre }) => {
              const config = STATUTS_DEPOT[statut];
              const Icone = config.icone;

              return (
                <li
                  key={statut}
                  className="rounded-xl border border-border bg-card/40 p-3 text-center"
                >
                  <Icone
                    className={`w-4 h-4 mx-auto mb-1.5 ${config.classe}`}
                  />
                  <p className="text-xl font-bold tabular-nums">{nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {config.label}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <BarresClassement
          titre="Les plus écoutés"
          sousTitre="Depuis le début"
          donnees={stats.topEcoutes}
          cleValeur="play_count"
          suffixe=" ▸"
        />

        <BarresClassement
          titre="Les plus likés"
          sousTitre="Depuis le début"
          donnees={stats.topLikes}
          cleValeur="nombre"
          suffixe=" ♥"
        />

        {/* Pages les plus consultees : une liste suffit, la comparaison se fait sur le chiffre. */}
        <section className="rounded-2xl border border-border bg-background/50 p-5 lg:col-span-2">
          <h2 className="font-semibold mb-1">Pages les plus consultées</h2>
          <p className="text-xs text-muted-foreground mb-4">
            30 derniers jours
          </p>

          {stats.pagesVues.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Pas encore de visites enregistrées.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {stats.pagesVues.map((page) => (
                <li
                  key={page.chemin}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <code className="truncate text-muted-foreground">
                    {page.chemin}
                  </code>
                  <span className="shrink-0 font-medium tabular-nums">
                    {page.nombre}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
