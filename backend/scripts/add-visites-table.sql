-- Suivi de frequentation.
--
-- Une ligne par page consultee. Le front (SPA) signale lui-meme chaque changement de route :
-- cote serveur, on ne verrait que des appels API, et une seule page en declenche plusieurs —
-- on compterait donc 5 "visites" pour une seule page vue.
--
-- L'IP n'est JAMAIS stockee en clair : c'est une donnee personnelle (RGPD). On garde un hash
-- (SHA-256 + sel secret), ce qui suffit a compter des visiteurs DISTINCTS sans pouvoir remonter
-- a quelqu'un. Sans le sel, un hash d'IP se casserait en quelques secondes : il n'y a que
-- ~4 milliards d'adresses IPv4, on peut toutes les hacher.
--
-- A jouer une fois :
--   mysql -h <host> -P <port> -u <user> -p <base> < scripts/add-visites-table.sql

CREATE TABLE IF NOT EXISTS `visites` (
  `id_visite`  INT NOT NULL AUTO_INCREMENT,

  -- Le jour, en clair : c'est sur lui qu'on agrege (visiteurs uniques par jour).
  `jour`       DATE NOT NULL,

  -- SHA-256 (64 caracteres hexa) de l'IP + sel.
  `ip_hash`    CHAR(64) NOT NULL,

  -- La route consultee ("/", "/bibliotheque"...), pour savoir quelles pages sont vues.
  `chemin`     VARCHAR(255) NOT NULL,

  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id_visite`),

  -- Index sur (jour, ip_hash) : c'est exactement la paire qu'on agrege pour compter les
  -- visiteurs uniques par jour. Sans lui, la requete du dashboard scannerait toute la table.
  KEY `idx_visites_jour_ip` (`jour`, `ip_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
