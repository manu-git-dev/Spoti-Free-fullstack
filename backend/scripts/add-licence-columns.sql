-- Migration : tracabilite des droits (licence + attribution).
--
-- Pourquoi
-- --------
-- Tant que l'app tournait sur localhost, l'origine des morceaux n'engageait personne. En ligne,
-- deux obligations apparaissent :
--
--   1. Le catalogue est constitue d'oeuvres sous licence Creative Commons. CC BY *exige*
--      l'attribution : afficher qui crediter, sous quelle licence, et ou trouver l'original.
--      Une licence stockee mais pas affichee est une licence violee.
--
--   2. Un utilisateur qui depose un morceau doit certifier qu'il en a le droit. Cette
--      declaration doit laisser une trace datee, pas rester une phrase decorative sur un
--      formulaire.
--
-- La regle d'attribution Creative Commons porte un nom : TASL (Title, Author, Source, License).
-- `title` et `artist` couvrent deja T et A. Ces colonnes ajoutent S et L.
--
-- A rejouer sur une base existante :
--     mysql -u root -p spotifree < backend/scripts/add-licence-columns.sql
--
-- Sur une base NEUVE, ce fichier est inutile : ses modifications sont deja dans schema.sql.

-- ---------------------------------------------------------------------------
-- musics : d'ou vient ce morceau, et sous quelle licence
--
-- NOT NULL est deliberement dur. Il va casser toutes les insertions existantes — c'est
-- l'objectif. Plutot que d'esperer ne jamais oublier la licence sur un nouveau chemin
-- d'ecriture, on rend l'oubli impossible : un morceau sans licence ne peut litteralement plus
-- exister dans cette base.
--
-- Les lignes deja presentes recevront '' (MySQL remplit avec la valeur implicite sur un
-- ADD COLUMN). Ce n'est pas grave : `seed-musics.sql` remplace integralement l'ancien catalogue
-- de demonstration, qui affichait de vrais titres d'artistes sur des fichiers libres sans
-- aucun rapport. Rejouer le seed APRES cette migration.
-- ---------------------------------------------------------------------------
-- `source_url` est en revanche NULLABLE, et ce n'est pas une inconsequence. La regle TASL dit
-- "Source, SI elle est fournie" : un utilisateur qui depose sa propre creation via le formulaire
-- n'a aucune source externe a citer — l'original, c'est le fichier qu'il vient d'envoyer. Rendre
-- la colonne obligatoire forcerait a inventer une URL pour satisfaire la contrainte, ce qui est
-- exactement le genre de mensonge qu'un NOT NULL mal place fabrique.
ALTER TABLE `musics`
  ADD COLUMN `licence`     varchar(50)  NOT NULL COMMENT 'Code lisible, ex. "CC BY 4.0"',
  ADD COLUMN `licence_url` varchar(255) NOT NULL COMMENT 'Lien vers le deed de la licence',
  ADD COLUMN `source_url`  varchar(255) DEFAULT NULL COMMENT 'Page d''origine, si elle existe';

-- ---------------------------------------------------------------------------
-- submissions : ce que le deposant declare
--
-- `droits_confirmes_at` est un datetime plutot qu'un booleen : une trace vaut par sa date.
-- Savoir QUAND l'utilisateur a certifie detenir les droits a une valeur ; savoir qu'il l'a
-- fait "un jour" n'en a aucune.
--
-- Cette colonne est NULLABLE, contrairement a celles de `musics`. Ce n'est pas une
-- inconsequence : les depots anterieurs a cette migration n'ont reellement jamais fait l'objet
-- d'une declaration. NULL est ici la representation honnete de "aucune declaration recueillie",
-- alors qu'une date par defaut leur inventerait un consentement qui n'a jamais existe.
--
-- La route, elle, refuse tout nouveau depot sans declaration (voir backend/src/validation.js).
-- ---------------------------------------------------------------------------
ALTER TABLE `submissions`
  ADD COLUMN `licence`             varchar(50)  DEFAULT NULL COMMENT 'Licence declaree par le deposant',
  ADD COLUMN `source_url`          varchar(255) DEFAULT NULL COMMENT 'Origine declaree du morceau',
  ADD COLUMN `droits_confirmes_at` datetime     DEFAULT NULL COMMENT 'Date de la certification de droits';
