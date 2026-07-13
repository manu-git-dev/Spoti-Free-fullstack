-- Ajoute un vrai role utilisateur.
--
-- Remplace le test `idUser !== 10` qui etait code en dur dans userRoute.js, et permet de
-- proteger les routes d'administration du catalogue (ajout / modification / suppression
-- d'une musique), qui etaient jusqu'ici ouvertes a tout le monde, sans meme un token.
--
-- A jouer une fois :
--   mysql -h <host> -P <port> -u <user> -p <base> < scripts/add-role-column.sql
--
-- Note : MySQL 8 ne connait pas `ADD COLUMN IF NOT EXISTS` (c'est une syntaxe MariaDB).
-- Rejouer ce script renverra donc "Duplicate column name 'role'" : c'est sans danger.

ALTER TABLE `users`
  ADD COLUMN `role` ENUM('user','admin') NOT NULL DEFAULT 'user';

-- Le compte admin historique du projet (id_user = 10, admin@admin.fr).
UPDATE `users` SET `role` = 'admin' WHERE `id_user` = 10;
