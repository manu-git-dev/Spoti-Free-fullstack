-- Remet le compteur d'ecoutes a son etat d'amorcage.
--
-- Utile apres avoir joue la suite de tests : tester le lecteur, c'est lancer des titres, et
-- lancer un titre incremente `play_count`. Le classement du Top 5 s'en trouve fausse.
--
--   mysql -h <host> -P <port> -u <user> -p <base> < scripts/reset-play-count.sql
--
-- ATTENTION : ce script efface les ecoutes REELLES. A ne pas jouer en production.

UPDATE `musics` SET `play_count` = 0;

UPDATE `musics` SET `play_count` = 5 WHERE `title` = 'Blinding Lights';
UPDATE `musics` SET `play_count` = 4 WHERE `title` = 'Bohemian Rhapsody';
UPDATE `musics` SET `play_count` = 3 WHERE `title` = 'Lose Yourself';
UPDATE `musics` SET `play_count` = 2 WHERE `title` = 'Billie Jean';
UPDATE `musics` SET `play_count` = 1 WHERE `title` = 'Get Lucky';
