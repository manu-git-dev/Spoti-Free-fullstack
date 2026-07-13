-- Compteur d'ecoutes, pour que le "Top 5" de la Home soit un vrai classement
-- (jusqu'ici : un simple `.slice(0, 5)` de la bibliotheque triee par titre).
--
-- Pas de tache planifiee : le compteur est incremente a chaque lecture, et le Top 5 est
-- un `ORDER BY play_count DESC LIMIT 5`. Le classement est donc toujours a jour, sans cron.
--
-- A jouer une fois :
--   mysql -h <host> -P <port> -u <user> -p <base> < scripts/add-play-count.sql
--
-- Note : MySQL 8 ne connait pas `ADD COLUMN IF NOT EXISTS` (syntaxe MariaDB).
-- Rejouer ce script renverra "Duplicate column name 'play_count'" : c'est sans danger.

ALTER TABLE `musics`
  ADD COLUMN `play_count` INT UNSIGNED NOT NULL DEFAULT 0;

-- Amorcage : sans valeurs de depart, les 20 musiques seraient a 0 et le Top 5 afficherait
-- 5 titres au hasard. On amorce donc le classement sur 5 titres (5, 4, 3, 2, 1 ecoutes),
-- ce qui donne un Top 5 credible des la premiere visite. Les vraies ecoutes prennent
-- ensuite le relais et le classement evolue naturellement.
UPDATE `musics` SET `play_count` = 5 WHERE `title` = 'Blinding Lights';
UPDATE `musics` SET `play_count` = 4 WHERE `title` = 'Bohemian Rhapsody';
UPDATE `musics` SET `play_count` = 3 WHERE `title` = 'Lose Yourself';
UPDATE `musics` SET `play_count` = 2 WHERE `title` = 'Billie Jean';
UPDATE `musics` SET `play_count` = 1 WHERE `title` = 'Get Lucky';
