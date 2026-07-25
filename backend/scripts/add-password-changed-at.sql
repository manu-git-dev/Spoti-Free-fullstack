-- Invalide les jetons JWT emis AVANT un changement de mot de passe.
--
-- LE PROBLEME (constate le 2026-07-25 lors de l'audit de securite) : un JWT est autonome. Une
-- fois signe, il vaut jusqu'a son expiration (24h) et rien ne peut le revoquer — pas meme un
-- changement de mot de passe. Concretement : quelqu'un se fait voler sa session, fait ce qu'on
-- lui dit de faire (« mot de passe oublie »), et l'attaquant garde l'acces jusqu'a 24h. La seule
-- action de reprise de controle offerte par l'app ne reprenait donc rien du tout.
--
-- LA SOLUTION : dater le dernier changement de mot de passe. `authMiddleware` compare cette date
-- au `iat` ("issued at") que jsonwebtoken pose dans chaque jeton, et refuse tout jeton plus
-- ancien que le changement. C'est le minimum d'etat a reintroduire pour rendre une revocation
-- possible — on ne stocke pas les sessions, juste la date qui les perime.
--
-- NULL = mot de passe jamais change depuis cette migration : aucun jeton a invalider, on laisse
-- passer. Les comptes existants ne sont donc pas deconnectes par le deploiement de ce script.
--
-- A jouer une fois :
--   mysql -h <host> -P <port> -u <user> -p <base> < scripts/add-password-changed-at.sql
--
-- Note : MySQL 8 ne connait pas `ADD COLUMN IF NOT EXISTS` (syntaxe MariaDB). Rejouer ce script
-- renverra "Duplicate column name 'password_changed_at'" : c'est sans danger.

ALTER TABLE `users`
  ADD COLUMN `password_changed_at` DATETIME DEFAULT NULL
    COMMENT 'Date du dernier changement de mot de passe ; invalide les JWT emis avant';
