-- Schema complet de la base Spoti-Free.
-- Genere depuis la base de developpement (mysqldump --no-data).
--
-- Il faut le rejouer EN PREMIER sur une base vide :
--     mysql -u root -p spotifree < backend/scripts/schema.sql
--     mysql -u root -p spotifree < backend/scripts/seed-musics.sql   # le catalogue
--
-- Les scripts add-*.sql du meme dossier sont des MIGRATIONS historiques : leurs
-- modifications sont deja incluses ici. Sur une base neuve, ce fichier suffit.

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
-- Les tables sont creees par ordre alphabetique : `likes` arrive avant `musics`, alors qu'elle
-- porte une cle etrangere vers elle. Sans cette desactivation temporaire, l'import echoue sur
-- "Failed to open the referenced table 'musics'". On les reactive a la fin : les contraintes sont
-- alors verifiees normalement.
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `historique` (
  `id_historique` int NOT NULL AUTO_INCREMENT,
  `id_user` int NOT NULL,
  `id_music` int NOT NULL,
  `ecoute_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_historique`),
  UNIQUE KEY `uq_historique_user_music` (`id_user`,`id_music`),
  KEY `fk_historique_musics` (`id_music`),
  CONSTRAINT `fk_historique_musics` FOREIGN KEY (`id_music`) REFERENCES `musics` (`id_music`) ON DELETE CASCADE,
  CONSTRAINT `fk_historique_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likes` (
  `id_user` int NOT NULL,
  `id_music` int NOT NULL,
  PRIMARY KEY (`id_user`,`id_music`),
  KEY `fk_likes_musics` (`id_music`),
  CONSTRAINT `fk_likes_musics` FOREIGN KEY (`id_music`) REFERENCES `musics` (`id_music`) ON DELETE CASCADE,
  CONSTRAINT `fk_likes_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `musics` (
  `id_music` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `artist` varchar(100) NOT NULL,
  `genre` varchar(100) DEFAULT NULL,
  `src_image` varchar(255) NOT NULL,
  `src_audio` varchar(255) NOT NULL,
  `duration` int DEFAULT NULL,
  `play_count` int unsigned NOT NULL DEFAULT '0',
  `licence` varchar(50) NOT NULL COMMENT 'Code lisible, ex. "CC BY 4.0"',
  `licence_url` varchar(255) NOT NULL COMMENT 'Lien vers le deed de la licence',
  `source_url` varchar(255) DEFAULT NULL COMMENT 'Page d''origine, si elle existe',
  PRIMARY KEY (`id_music`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id_reset` int NOT NULL AUTO_INCREMENT,
  `id_user` int NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expire_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_reset`),
  UNIQUE KEY `uq_token_hash` (`token_hash`),
  KEY `fk_resets_users` (`id_user`),
  CONSTRAINT `fk_resets_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playlists` (
  `id_playlist` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `id_user` int NOT NULL,
  PRIMARY KEY (`id_playlist`),
  KEY `fk_playlists_users` (`id_user`),
  CONSTRAINT `fk_playlists_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playlists_musics` (
  `id_playlist` int NOT NULL,
  `id_music` int NOT NULL,
  PRIMARY KEY (`id_playlist`,`id_music`),
  KEY `fk_playlists_musics_musics` (`id_music`),
  CONSTRAINT `fk_playlists_musics_musics` FOREIGN KEY (`id_music`) REFERENCES `musics` (`id_music`) ON DELETE CASCADE,
  CONSTRAINT `fk_playlists_musics_playlists` FOREIGN KEY (`id_playlist`) REFERENCES `playlists` (`id_playlist`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submissions` (
  `id_submission` int NOT NULL AUTO_INCREMENT,
  `id_user` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `artist` varchar(255) NOT NULL,
  `genre` varchar(100) DEFAULT NULL,
  `fichier_audio` varchar(255) NOT NULL,
  `fichier_image` varchar(255) DEFAULT NULL,
  `duration` int unsigned DEFAULT NULL,
  `statut` enum('en_attente','approuve','refuse') NOT NULL DEFAULT 'en_attente',
  `motif_refus` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `licence` varchar(50) DEFAULT NULL COMMENT 'Licence declaree par le deposant',
  `source_url` varchar(255) DEFAULT NULL COMMENT 'Origine declaree du morceau',
  `droits_confirmes_at` datetime DEFAULT NULL COMMENT 'Date de la certification de droits',
  `id_music` int DEFAULT NULL COMMENT 'Morceau cree a l''approbation ; NULL si pas encore approuve ou retire du catalogue',
  PRIMARY KEY (`id_submission`),
  KEY `fk_submissions_users` (`id_user`),
  KEY `fk_submissions_musics` (`id_music`),
  CONSTRAINT `fk_submissions_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE,
  CONSTRAINT `fk_submissions_musics` FOREIGN KEY (`id_music`) REFERENCES `musics` (`id_music`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id_user` int NOT NULL AUTO_INCREMENT,
  `pseudo` varchar(100) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visites` (
  `id_visite` int NOT NULL AUTO_INCREMENT,
  `jour` date NOT NULL,
  `ip_hash` char(64) NOT NULL,
  `chemin` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_visite`),
  KEY `idx_visites_jour_ip` (`jour`,`ip_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET FOREIGN_KEY_CHECKS = 1;
