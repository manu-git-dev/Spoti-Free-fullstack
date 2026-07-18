-- Migration : table `historique` (rangee « Écoutés récemment » de l'accueil).
--
-- Modele UPSERT : une ligne par (utilisateur, titre), `ecoute_at` remis a NOW() a chaque
-- relecture (UNIQUE(id_user, id_music)). On veut des titres DISTINCTS, le plus recent en tete —
-- pas un journal append-only qui grandit sans fin. Le compte des ecoutes vit ailleurs
-- (`musics.play_count`, global).
--
-- Deja incluse dans schema.sql (source de verite). A jouer une fois sur une base EXISTANTE :
--   mysql -u root -p spotifree < backend/scripts/add-historique.sql
CREATE TABLE IF NOT EXISTS `historique` (
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