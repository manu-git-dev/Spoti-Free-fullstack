-- Depots de musique par les utilisateurs, en attente de moderation.
--
-- Pourquoi une table separee, et pas une colonne `statut` sur `musics` ?
-- Avec un statut sur `musics`, TOUTES les requetes existantes (catalogue, Top 5, recherche...)
-- devraient penser a filtrer `WHERE statut = 'approuve'`. Le jour ou on en oublie une, un
-- morceau non valide apparait dans l'application.
-- Avec une table a part, un morceau non valide ne PEUT PAS fuiter : il n'est simplement pas
-- dans la table que l'application lit. L'erreur devient impossible, au lieu d'etre seulement
-- "a ne pas commettre".
--
-- A jouer une fois :
--   mysql -h <host> -P <port> -u <user> -p <base> < scripts/add-submissions-table.sql

CREATE TABLE IF NOT EXISTS `submissions` (
  `id_submission` INT NOT NULL AUTO_INCREMENT,
  `id_user`       INT NOT NULL,
  `title`         VARCHAR(255) NOT NULL,
  `artist`        VARCHAR(255) NOT NULL,
  `genre`         VARCHAR(100) DEFAULT NULL,

  -- Noms des fichiers dans backend/uploads/ (JAMAIS dans public/ tant que non valide :
  -- public/ est servi statiquement, le morceau serait donc en ligne avant moderation).
  `fichier_audio` VARCHAR(255) NOT NULL,
  `fichier_image` VARCHAR(255) NOT NULL,

  -- Extraite du fichier par le serveur (music-metadata), jamais envoyee par le client :
  -- une valeur venant du client peut mentir.
  `duration`      INT UNSIGNED DEFAULT NULL,

  `statut`        ENUM('en_attente','approuve','refuse') NOT NULL DEFAULT 'en_attente',
  `motif_refus`   TEXT DEFAULT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id_submission`),
  KEY `fk_submissions_users` (`id_user`),
  CONSTRAINT `fk_submissions_users`
    FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
