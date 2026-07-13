-- Reinitialisation de mot de passe.
--
-- Le jeton n'est PAS stocke en clair : on garde son empreinte SHA-256.
--
-- Pourquoi ? Ce jeton vaut un mot de passe : celui qui le possede peut changer le mot de passe
-- du compte. Si la base fuitait et que les jetons y etaient en clair, un attaquant pourrait
-- reinitialiser tous les comptes ayant une demande en cours. Stocker l'empreinte suffit : on
-- compare l'empreinte du jeton recu a celle en base.
--
-- (Pas besoin de bcrypt ici, contrairement aux mots de passe : un jeton de 32 octets aleatoires
-- a une entropie enorme, il est insensible aux attaques par dictionnaire. bcrypt sert a ralentir
-- le cassage de secrets FAIBLES choisis par des humains.)
--
-- A jouer une fois :
--   mysql -h <host> -P <port> -u <user> -p <base> < scripts/add-password-resets-table.sql

CREATE TABLE IF NOT EXISTS `password_resets` (
  `id_reset`   INT NOT NULL AUTO_INCREMENT,
  `id_user`    INT NOT NULL,

  -- SHA-256 du jeton envoye par mail (64 caracteres hexa).
  `token_hash` CHAR(64) NOT NULL,

  -- Duree de vie courte : un lien de reinitialisation qui traine dans une boite mail est un
  -- risque permanent.
  `expire_at`  DATETIME NOT NULL,

  -- Usage UNIQUE : une fois le mot de passe change, le lien ne doit plus rien pouvoir faire
  -- (le mail reste dans la boite de reception, et peut etre lu par quelqu'un d'autre).
  `used_at`    DATETIME DEFAULT NULL,

  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id_reset`),
  UNIQUE KEY `uq_token_hash` (`token_hash`),
  KEY `fk_resets_users` (`id_user`),
  CONSTRAINT `fk_resets_users`
    FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
