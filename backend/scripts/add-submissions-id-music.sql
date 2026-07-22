-- Migration : relier un depot au morceau qu'il a fait entrer au catalogue.
--
-- Pourquoi
-- --------
-- L'approbation faisait deux ecritures qui ne se connaissaient pas : un INSERT dans `musics`,
-- puis un UPDATE du statut du depot. Le lien entre les deux n'existait que dans la tete de
-- celui qui lisait le code.
--
-- Consequence concrete, vue en production le 2026-07-21 : un morceau supprime du catalogue
-- laisse son depot marque `approuve`. « Mes depots » affiche donc « Approuve — tu le retrouves
-- dans la Bibliotheque » pour un morceau introuvable.
--
-- La correction n'est PAS un nouveau statut (`retire`). `statut` enregistre une decision
-- humaine — l'approbation a bien eu lieu, c'est un fait historique et irreversible. La presence
-- du morceau au catalogue est un etat COURANT, qui change sans que personne ne re-modere quoi
-- que ce soit. Ecraser le premier par le second, c'est perdre definitivement l'information
-- « ce depot a ete approuve » le jour ou le morceau disparait.
--
-- On stocke donc la RELATION (un fait) et on DEDUIT l'affichage :
--
--     statut = 'approuve' ET id_music IS NULL  =>  approuve, puis retire du catalogue
--
-- `ON DELETE SET NULL` est le coeur de la migration : c'est MySQL qui remet le lien a NULL
-- quand le morceau est supprime, quel que soit le chemin emprunte — la route d'administration,
-- un script de nettoyage, ou un DELETE tape a la main. Un invariant tenu par du JavaScript n'est
-- vrai que dans les chemins ou on a pense a l'ecrire ; celui-ci est tenu par le schema.
--
-- A rejouer sur une base existante :
--     mysql -u root -p spotifree < backend/scripts/add-submissions-id-music.sql
--
-- Sur une base NEUVE, ce fichier est inutile : ses modifications sont deja dans schema.sql.

-- ---------------------------------------------------------------------------
-- La colonne est NULLABLE, et elle le restera.
--
-- Trois situations legitimes donnent NULL : un depot `en_attente` (le morceau n'existe pas
-- encore), un depot `refuse` (il n'existera jamais), et un depot `approuve` dont le morceau a
-- ete retire. Seule la troisieme nous interesse a l'affichage — c'est le `statut` qui les
-- distingue, pas la colonne.
-- ---------------------------------------------------------------------------
ALTER TABLE `submissions`
  ADD COLUMN `id_music` int DEFAULT NULL
    COMMENT 'Morceau cree a l''approbation ; NULL si pas encore approuve ou retire du catalogue',
  ADD KEY `fk_submissions_musics` (`id_music`),
  ADD CONSTRAINT `fk_submissions_musics`
    FOREIGN KEY (`id_music`) REFERENCES `musics` (`id_music`) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Rattrapage des depots deja approuves.
--
-- Ils n'ont aucun lien enregistre : il faut le reconstituer, et le seul point commun entre les
-- deux lignes est le nom du fichier audio. Cote depot il est stocke tel quel, cote catalogue il
-- est prefixe par `musiques/` (chemin relatif a `public/`) — d'ou le CONCAT.
--
-- Cette jointure "par convention" est exactement ce que la cle etrangere ci-dessus supprime pour
-- l'avenir : rien dans le schema n'imposait que ces deux colonnes correspondent. On l'utilise
-- ici parce qu'un rattrapage est une reconciliation PONCTUELLE de donnees historiques — pas un
-- contrat permanent entre deux tables.
--
-- Les depots approuves dont le morceau a deja ete retire ne trouveront aucune correspondance et
-- resteront a NULL : c'est precisement le resultat attendu.
-- ---------------------------------------------------------------------------
UPDATE `submissions` AS s
  JOIN `musics` AS m
    ON m.`src_audio` = CONCAT('musiques/', SUBSTRING_INDEX(s.`fichier_audio`, '/', -1))
   SET s.`id_music` = m.`id_music`
 WHERE s.`statut` = 'approuve';