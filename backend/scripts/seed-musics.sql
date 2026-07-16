-- Catalogue de Spoti-Free — 100 morceaux sous licence Creative Commons.
--
-- GENERE par scripts/importer-jamendo.mjs. Ne pas editer a la main : relancer le script.
--
-- A rejouer APRES schema.sql, sur une base neuve :
--     mysql -u root -p spotifree < backend/scripts/seed-musics.sql
--
-- Ne contient QUE les metadonnees des morceaux. Aucun utilisateur, aucun like, aucune visite :
-- ce sont des donnees personnelles, elles ne vont pas dans Git.
--
-- Les fichiers audio et les pochettes vivent dans backend/public/, qui est gitignore (poids).
-- Sans eux, les morceaux s'affichent mais ne se lisent pas. Deux facons de les obtenir :
--   - les rapatrier depuis Jamendo : JAMENDO_CLIENT_ID=xxx node scripts/importer-jamendo.mjs
--   - en fabriquer des factices pour les tests : node tests/preparer-medias.mjs
--
-- Chaque morceau porte sa licence et un lien vers son original : CC BY *exige* l'attribution,
-- et l'app l'affiche sur la fiche du morceau. Ces colonnes ne sont pas decoratives, elles sont
-- la condition du droit de diffusion.

-- Le catalogue precedent etait un jeu de demonstration : de vrais titres d'artistes celebres
-- poses sur cinq fichiers libres recycles. Il ne pouvait pas etre mis en ligne. On le remplace
-- integralement. La suppression fait tomber en cascade les likes et les entrees de playlists
-- qui le referencaient — c'est voulu : ils pointaient vers des morceaux qui n'ont jamais existe.
DELETE FROM `musics`;
ALTER TABLE `musics` AUTO_INCREMENT = 1;

INSERT INTO `musics`
  (`id_music`, `title`, `artist`, `genre`, `src_image`, `src_audio`, `duration`,
   `play_count`, `licence`, `licence_url`, `source_url`)
VALUES
  (1,'What Is Love','Melanie Ungar','Pop','images/jamendo-1204669.jpg','musiques/jamendo-1204669.mp3',212,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1204669'),
  (2,'Love Will Come Back Again','Chaz Robinson','Pop','images/jamendo-1141572.jpg','musiques/jamendo-1141572.mp3',236,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1141572'),
  (3,'In Tune (J. Glaze Remix)','Kellee Maize','Pop','images/jamendo-1161940.jpg','musiques/jamendo-1161940.mp3',346,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1161940'),
  (4,'Energy','Pokki DJ','Electro','images/jamendo-1129271.jpg','musiques/jamendo-1129271.mp3',230,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1129271'),
  (5,'Boys, Girls, Toys & Words','Modern Pitch','Rock','images/jamendo-1165005.jpg','musiques/jamendo-1165005.mp3',357,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1165005'),
  (6,'Struttin''','Tryad','Hip-hop','images/jamendo-26736.jpg','musiques/jamendo-26736.mp3',242,0,'CC BY-SA 2.5','https://creativecommons.org/licenses/by-sa/2.5/','https://www.jamendo.com/track/26736'),
  (7,'Skydiving (feat. Jasmine Kara)','Jonay','Pop','images/jamendo-354778.jpg','musiques/jamendo-354778.mp3',247,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/354778'),
  (8,'I Want You','Neon NiteClub','Pop','images/jamendo-1187780.jpg','musiques/jamendo-1187780.mp3',248,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1187780'),
  (9,'Leave and Never Look Back','madelyn munsell','Pop','images/jamendo-1174817.jpg','musiques/jamendo-1174817.mp3',249,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1174817'),
  (10,'Horizons','Train Room','Folk','images/jamendo-1321406.jpg','musiques/jamendo-1321406.mp3',219,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1321406'),
  (11,'Dreams','Manhat10','Pop','images/jamendo-1215808.jpg','musiques/jamendo-1215808.mp3',212,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1215808'),
  (12,'Stitches ft. Shane MauX','Lilly Wolf','Pop','images/jamendo-1093607.jpg','musiques/jamendo-1093607.mp3',270,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1093607'),
  (13,'Over Me','Jemex','Pop','images/jamendo-135660.jpg','musiques/jamendo-135660.mp3',208,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/135660'),
  (14,'Fire','Seth Power','Pop','images/jamendo-1483587.jpg','musiques/jamendo-1483587.mp3',212,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1483587'),
  (15,'Gnarly (feat. Devyn Rush)','David Amber','Pop','images/jamendo-1243462.jpg','musiques/jamendo-1243462.mp3',196,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1243462'),
  (16,'100 Days','Ilona Akimova / Juice Big City','Rock','images/jamendo-598270.jpg','musiques/jamendo-598270.mp3',293,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/598270'),
  (17,'Give U My Name','Jyant','Soul','images/jamendo-1305161.jpg','musiques/jamendo-1305161.mp3',242,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1305161'),
  (18,'Paris La Nuit','A Virtual Friend','Pop','images/jamendo-1217479.jpg','musiques/jamendo-1217479.mp3',258,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1217479'),
  (19,'I''ll Wait','Jonathan Dimmel','Pop','images/jamendo-938331.jpg','musiques/jamendo-938331.mp3',174,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/938331'),
  (20,'beautiful','Hiroumi','Folk','images/jamendo-337998.jpg','musiques/jamendo-337998.mp3',210,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/337998'),
  (21,'The Feel','Backnbloom','Pop','images/jamendo-1071004.jpg','musiques/jamendo-1071004.mp3',191,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1071004'),
  (22,'see you again','Rexo','Soul','images/jamendo-975249.jpg','musiques/jamendo-975249.mp3',282,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/975249'),
  (23,'look up','This Public Life','Rock','images/jamendo-875005.jpg','musiques/jamendo-875005.mp3',204,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/875005'),
  (24,'Behind The Walls','Non Camera','Pop','images/jamendo-1111313.jpg','musiques/jamendo-1111313.mp3',286,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1111313'),
  (25,'Breathe','Axl & Arth','Electro','images/jamendo-1342479.jpg','musiques/jamendo-1342479.mp3',233,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1342479'),
  (26,'Memory Replaced','Josh Woodward','Folk','images/jamendo-1063105.jpg','musiques/jamendo-1063105.mp3',259,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1063105'),
  (27,'Tonight','Olga Zhilkova','Pop','images/jamendo-724513.jpg','musiques/jamendo-724513.mp3',226,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/724513'),
  (28,'Beautiful Girl','Babypaul','Pop','images/jamendo-11216.jpg','musiques/jamendo-11216.mp3',204,0,'CC BY-SA 2.5','https://creativecommons.org/licenses/by-sa/2.5/','https://www.jamendo.com/track/11216'),
  (29,'I Had it All','The Monster Brothers','Rock','images/jamendo-856136.jpg','musiques/jamendo-856136.mp3',175,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/856136'),
  (30,'The Saymory - The Mirror Of You(Dr.Synthetique mix) wav','the saymory',NULL,'images/jamendo-380962.jpg','musiques/jamendo-380962.mp3',198,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/380962'),
  (31,'Waves','studyBreak','Chill','images/jamendo-1234661.jpg','musiques/jamendo-1234661.mp3',252,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1234661'),
  (32,'Star Fall','Sunwill','Pop','images/jamendo-1086545.jpg','musiques/jamendo-1086545.mp3',184,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1086545'),
  (33,'From Here','Danielle Helena','Soul','images/jamendo-1358662.jpg','musiques/jamendo-1358662.mp3',298,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1358662'),
  (34,'Mr.&Mrs Rains','Intoxicated Piano','Pop','images/jamendo-1070219.jpg','musiques/jamendo-1070219.mp3',205,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1070219'),
  (35,'Games','The Windy City',NULL,'images/jamendo-767990.jpg','musiques/jamendo-767990.mp3',237,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/767990'),
  (36,'The Soundtrack Of Our Summer','The League','Rock','images/jamendo-319978.jpg','musiques/jamendo-319978.mp3',143,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/319978'),
  (37,'Just to be OK','NODREAMS',NULL,'images/jamendo-802591.jpg','musiques/jamendo-802591.mp3',201,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/802591'),
  (38,'the state i''m in','Blakeley Walker Band',NULL,'images/jamendo-860387.jpg','musiques/jamendo-860387.mp3',257,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/860387'),
  (39,'To the Death','Andre Rodriguez',NULL,'images/jamendo-740100.jpg','musiques/jamendo-740100.mp3',271,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/740100'),
  (40,'To The Roofs','Colaars','Rock','images/jamendo-1443264.jpg','musiques/jamendo-1443264.mp3',239,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1443264'),
  (41,'Winter Sunlight (airtone feat. Leza2unes)','Snowflake & ccMixter','Pop','images/jamendo-472893.jpg','musiques/jamendo-472893.mp3',160,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/472893'),
  (42,'Make Believe','Felixjd','Electro','images/jamendo-366748.jpg','musiques/jamendo-366748.mp3',283,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/366748'),
  (43,'My Love','MODUS','Pop','images/jamendo-1891977.jpg','musiques/jamendo-1891977.mp3',233,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1891977'),
  (44,'Sorry','Dayung','Rock','images/jamendo-1057482.jpg','musiques/jamendo-1057482.mp3',228,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1057482'),
  (45,'Les files d''attente','Law''','Jazz','images/jamendo-964535.jpg','musiques/jamendo-964535.mp3',195,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/964535'),
  (46,'Dropping out of School','Brad Sucks','Rock','images/jamendo-210907.jpg','musiques/jamendo-210907.mp3',223,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/210907'),
  (47,'All I Ever Wanted','Devon Elizabeth','Pop','images/jamendo-1227197.jpg','musiques/jamendo-1227197.mp3',214,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1227197'),
  (48,'Restored Soul','Keffy Kay','Chill','images/jamendo-489242.jpg','musiques/jamendo-489242.mp3',318,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/489242'),
  (49,'Tortoise','Julius Nox - Giulio''s Page','Electro','images/jamendo-1510652.jpg','musiques/jamendo-1510652.mp3',212,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1510652'),
  (50,'A Common Tale','Radio Star','Rock','images/jamendo-744648.jpg','musiques/jamendo-744648.mp3',191,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/744648'),
  (51,'Fill the Space','Wordsmith','Hip-hop','images/jamendo-1490068.jpg','musiques/jamendo-1490068.mp3',184,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1490068'),
  (52,'Heathrow','Slim','Rock','images/jamendo-22265.jpg','musiques/jamendo-22265.mp3',233,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/22265'),
  (53,'Casa Noir','Quantum Jazz','Jazz','images/jamendo-355486.jpg','musiques/jamendo-355486.mp3',296,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/355486'),
  (54,'Dile Cuanto la Quiero','Igmar','Reggae','images/jamendo-1892110.jpg','musiques/jamendo-1892110.mp3',174,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1892110'),
  (55,'Meine Matrix','Peter Pumberger','Rock','images/jamendo-1092251.jpg','musiques/jamendo-1092251.mp3',170,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1092251'),
  (56,'Shine','Circa Vitae','Rock','images/jamendo-248375.jpg','musiques/jamendo-248375.mp3',170,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/248375'),
  (57,'Wake Up','Square a Saw','Pop','images/jamendo-1672835.jpg','musiques/jamendo-1672835.mp3',162,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1672835'),
  (58,'26 Spyhnx ( House Mix )','Hasenchat','Folk','images/jamendo-1212705.jpg','musiques/jamendo-1212705.mp3',394,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1212705'),
  (59,'Love You Anymore (feat. Seven)','Tom Orlando','Pop','images/jamendo-2180016.jpg','musiques/jamendo-2180016.mp3',156,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/2180016'),
  (60,'ON SALE','Golden Duck Orchestra','Rock','images/jamendo-1357553.jpg','musiques/jamendo-1357553.mp3',220,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1357553'),
  (61,'Under My Red Carpet','The Morning Light','Rock','images/jamendo-793728.jpg','musiques/jamendo-793728.mp3',220,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/793728'),
  (62,'Sugar','The Lxst','Soul','images/jamendo-1221203.jpg','musiques/jamendo-1221203.mp3',268,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1221203'),
  (63,'I''m Walking Away','Luigi Talluto','Electro','images/jamendo-1059814.jpg','musiques/jamendo-1059814.mp3',220,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1059814'),
  (64,'Ambient Flight (Electro Vocal Mix)','Zeropage','Chill','images/jamendo-20237.jpg','musiques/jamendo-20237.mp3',264,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/20237'),
  (65,'Dirty angel','The Phase','Electro','images/jamendo-108580.jpg','musiques/jamendo-108580.mp3',222,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/108580'),
  (66,'By the one coin laundrette','K4MMERER',NULL,'images/jamendo-570073.jpg','musiques/jamendo-570073.mp3',313,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/570073'),
  (67,'Même','Paul & Manuel','Folk','images/jamendo-2037486.jpg','musiques/jamendo-2037486.mp3',213,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/2037486'),
  (68,'Athens','Pierce Murphy','Soul','images/jamendo-1860165.jpg','musiques/jamendo-1860165.mp3',249,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1860165'),
  (69,'stuck on you t1','Emmanuel1','Pop','images/jamendo-1666163.jpg','musiques/jamendo-1666163.mp3',176,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1666163'),
  (70,'The Accident','Paper Plane Pilots','Rock','images/jamendo-186949.jpg','musiques/jamendo-186949.mp3',83,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/186949'),
  (71,'Paris_at_night','Offenbach Project','Electro','images/jamendo-435966.jpg','musiques/jamendo-435966.mp3',224,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/435966'),
  (72,'Lazy Duck','Martin Eigenmann','Soul','images/jamendo-1078326.jpg','musiques/jamendo-1078326.mp3',242,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1078326'),
  (73,'Three Kisses','Jake Gordon','Folk','images/jamendo-1329500.jpg','musiques/jamendo-1329500.mp3',165,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1329500'),
  (74,'My Little World','Other Noises','Pop','images/jamendo-1126699.jpg','musiques/jamendo-1126699.mp3',242,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1126699'),
  (75,'A Lil Sumhin'' Sumhin''','The Good Lawdz','Jazz','images/jamendo-947857.jpg','musiques/jamendo-947857.mp3',505,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/947857'),
  (76,'Thunder God','Ivan Tregub (BER)','Folk','images/jamendo-1465419.jpg','musiques/jamendo-1465419.mp3',368,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1465419'),
  (77,'09 Fubu - Entre Nos','Dj Fubu G our Fubu G','Hip-hop','images/jamendo-1172514.jpg','musiques/jamendo-1172514.mp3',151,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1172514'),
  (78,'Runaway','Alyssa Riley','Folk','images/jamendo-1413928.jpg','musiques/jamendo-1413928.mp3',223,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1413928'),
  (79,'Quand je serai grand - INSTRUMENTAL VERSION','Löhstana David','Reggae','images/jamendo-785434.jpg','musiques/jamendo-785434.mp3',191,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/785434'),
  (80,'The Storm','The woods','Folk','images/jamendo-1430937.jpg','musiques/jamendo-1430937.mp3',256,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1430937'),
  (81,'Show Me','AIRE','Rock','images/jamendo-1658149.jpg','musiques/jamendo-1658149.mp3',300,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1658149'),
  (82,'Spasm','Suedey','Chill','images/jamendo-1182292.jpg','musiques/jamendo-1182292.mp3',208,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1182292'),
  (83,'Time To Split (take 04)','The James Quintet',NULL,'images/jamendo-382415.jpg','musiques/jamendo-382415.mp3',445,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/382415'),
  (84,'Ghosts','Lyvo','Electro','images/jamendo-1267753.jpg','musiques/jamendo-1267753.mp3',173,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1267753'),
  (85,'Round The Twist','The Aluminium Tough','Electro','images/jamendo-1418676.jpg','musiques/jamendo-1418676.mp3',234,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1418676'),
  (86,'Paradise (Featuring Scolla)','Kidd Young','Hip-hop','images/jamendo-1157594.jpg','musiques/jamendo-1157594.mp3',229,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1157594'),
  (87,'Heart Loss','Thoola','Rock','images/jamendo-1125525.jpg','musiques/jamendo-1125525.mp3',265,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1125525'),
  (88,'Stefan The Poker Player','REC','Electro','images/jamendo-1199532.jpg','musiques/jamendo-1199532.mp3',303,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1199532'),
  (89,'Martin Oakson- Summer Soon (Original Mix)','Martin Oakson',NULL,'images/jamendo-985809.jpg','musiques/jamendo-985809.mp3',225,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/985809'),
  (90,'Language','YUTY','Chill','images/jamendo-1403281.jpg','musiques/jamendo-1403281.mp3',171,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1403281'),
  (91,'Walk alone (The Red Stone and The Last Stop)','Ground & Leaves','Folk','images/jamendo-1018531.jpg','musiques/jamendo-1018531.mp3',198,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1018531'),
  (92,'Brand New Life','Café Del Chillia','Rock','images/jamendo-1047954.jpg','musiques/jamendo-1047954.mp3',233,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1047954'),
  (93,'The Outer Banks of Love','Bruce H. McCosar',NULL,'images/jamendo-33490.jpg','musiques/jamendo-33490.mp3',225,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/33490'),
  (94,'Make Believe','VITNE','Rock','images/jamendo-1419659.jpg','musiques/jamendo-1419659.mp3',192,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1419659'),
  (95,'Gypsy Queen','Avi Rosenfeld','Jazz','images/jamendo-884112.jpg','musiques/jamendo-884112.mp3',264,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/884112'),
  (96,'Shines in Blue','Secret Babies','Jazz','images/jamendo-736472.jpg','musiques/jamendo-736472.mp3',180,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/736472'),
  (97,'TU EN MI','Mariana Contreras','Pop','images/jamendo-440950.jpg','musiques/jamendo-440950.mp3',188,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/440950'),
  (98,'Highway','Jahzzar','Soul','images/jamendo-606295.jpg','musiques/jamendo-606295.mp3',277,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/606295'),
  (99,'So High','Caroline','Pop','images/jamendo-1533251.jpg','musiques/jamendo-1533251.mp3',267,0,'CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','https://www.jamendo.com/track/1533251'),
  (100,'Kid At Heart - Hello','J.C.Vogt','Pop','images/jamendo-1022386.jpg','musiques/jamendo-1022386.mp3',295,0,'CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','https://www.jamendo.com/track/1022386');
