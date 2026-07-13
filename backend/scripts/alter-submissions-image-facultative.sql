-- La pochette devient facultative au depot.
--
-- Si l'utilisateur n'en fournit pas, l'admin peut quand meme approuver : une des pochettes
-- deja utilisees dans le catalogue est alors tiree au hasard (voir submissionRoute.js,
-- route d'approbation).
--
-- A jouer une fois :
--   mysql -h <host> -P <port> -u <user> -p <base> < scripts/alter-submissions-image-facultative.sql

ALTER TABLE `submissions`
  MODIFY COLUMN `fichier_image` VARCHAR(255) DEFAULT NULL;
