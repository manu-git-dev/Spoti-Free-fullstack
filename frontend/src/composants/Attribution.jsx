// Le credit d'un morceau : sous quelle licence il est diffuse, et ou trouver l'original.
//
// Ce n'est pas une decoration. Le catalogue est constitue d'oeuvres sous licence Creative
// Commons BY ou BY-SA, et ces licences EXIGENT l'attribution : diffuser sans crediter viole la
// licence aussi surement que diffuser une oeuvre sous copyright. Une licence stockee en base
// mais jamais affichee ne nous autorise rien.
//
// La regle d'attribution porte un nom, TASL : Title, Author, Source, License. Le titre et
// l'artiste sont deja affiches par le lecteur juste au-dessus ; ce composant fournit les deux
// derniers.
//
// Les licences demandent une attribution "raisonnable au regard du support" : elle doit etre
// accessible, pas omnipresente. D'ou le choix de la porter sur le lecteur (toujours visible
// pendant l'ecoute) plutot que sur chaque vignette du catalogue, ou elle noierait l'interface
// sans rien apporter.
export default function Attribution({ musique, className = "" }) {
  if (!musique?.licence) return null;

  return (
    <p className={`truncate text-xs text-muted-foreground ${className}`}>
      <a
        href={musique.licence_url}
        target="_blank"
        // noreferrer ET noopener : sans eux, la page ouverte garde une reference vers la notre
        // via window.opener et peut la rediriger ailleurs (tabnabbing).
        rel="noopener noreferrer"
        className="hover:text-foreground underline-offset-2 hover:underline"
        onClick={(evenement) => evenement.stopPropagation()}
      >
        {musique.licence}
      </a>
      {musique.source_url ? (
        <>
          {" · "}
          <a
            href={musique.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline-offset-2 hover:underline"
            onClick={(evenement) => evenement.stopPropagation()}
          >
            original
          </a>
        </>
      ) : null}
    </p>
  );
}
