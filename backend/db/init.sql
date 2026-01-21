DROP TABLE IF EXISTS "game_planArea" CASCADE;
DROP TABLE IF EXISTS "editor_planArea" CASCADE;
DROP TABLE IF EXISTS "reservation_game" CASCADE;
DROP TABLE IF EXISTS "reservation_tariffZone" CASCADE;
DROP TABLE IF EXISTS "festival_tariffZone" CASCADE;
DROP TABLE IF EXISTS "game_festival" CASCADE;
DROP TABLE IF EXISTS "game_mechanism" CASCADE;
DROP TABLE IF EXISTS "suiviReservation" CASCADE;
DROP TABLE IF EXISTS "contact" CASCADE;
DROP TABLE IF EXISTS "planArea" CASCADE;
DROP TABLE IF EXISTS "reservation" CASCADE;
DROP TABLE IF EXISTS "mechanism" CASCADE;
DROP TABLE IF EXISTS "gameType" CASCADE;
DROP TABLE IF EXISTS "game" CASCADE;
DROP TABLE IF EXISTS "editor" CASCADE;
DROP TABLE IF EXISTS "tariffZone" CASCADE;
DROP TABLE IF EXISTS "festival" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;




CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "login" TEXT UNIQUE NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS "festival" (
    "name" TEXT PRIMARY KEY,
    "nbSmallTables" INTEGER NOT NULL,
    "nbLargeTables" INTEGER NOT NULL,
    "nbCityHallTables" INTEGER NOT NULL,
    "remainingSmallTables" INTEGER NOT NULL,
    "remainingLargeTables" INTEGER NOT NULL,
    "remainingCityHallTables" INTEGER NOT NULL,
    "creation_date" DATE,
    "begin_date" DATE,
    "end_date" DATE,
    "isCurrent" BOOLEAN DEFAULT FALSE
);

-- Index unique partiel pour garantir qu'un seul festival peut être courant
CREATE UNIQUE INDEX "unique_current_festival_idx" ON "festival" ("isCurrent") WHERE "isCurrent" = TRUE;


CREATE TABLE IF NOT EXISTS "mechanism" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT
);

CREATE TABLE IF NOT EXISTS "gameType" (
    "id" SERIAL PRIMARY KEY,
    "gameTypeLabel" TEXT NOT NULL,
    "idZone" INTEGER -- idZone dans l'interface, mais la FK n'est pas claire, donc laissé comme simple colonne
);

CREATE TABLE IF NOT EXISTS "editor" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "exposant" BOOLEAN NOT NULL DEFAULT FALSE,
    "distributeur" BOOLEAN NOT NULL DEFAULT FALSE,
    "logo" TEXT
);



CREATE TABLE IF NOT EXISTS "tariffZone" (
    "idTZ" SERIAL PRIMARY KEY,
    "name" TEXT,
    "nbSmallTables" INTEGER,
    "nbLargeTables" INTEGER,
    "nbCityHallTables" INTEGER,
    "remainingSmallTables" INTEGER,
    "remainingLargeTables" INTEGER,
    "remainingCityHallTables" INTEGER,
    "smallTablePrice" INTEGER,
    "largeTablePrice" INTEGER,
    "cityHallTablePrice" INTEGER,
    "squareMeterPrice" INTEGER,
    "festivalName" TEXT REFERENCES "festival"("name") ON DELETE CASCADE NOT NULL
);

CREATE TABLE IF NOT EXISTS "game" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL, 
    "author" TEXT NOT NULL,
    "nbMinPlayer" INTEGER NOT NULL,
    "nbMaxPlayer" INTEGER NOT NULL,
    "gameNotice" TEXT,
    "idGameType" INTEGER REFERENCES "gameType"("id") ON DELETE RESTRICT NOT NULL,
    "minimumAge" INTEGER NOT NULL,
    "prototype" BOOLEAN NOT NULL DEFAULT FALSE,
    "duration" INTEGER NOT NULL,
    "theme" TEXT,
    "description" TEXT,
    "gameImage" TEXT,
    "rulesTutorial" TEXT,
    "edition" INTEGER,
    "idEditor" INTEGER REFERENCES "editor"("id") ON DELETE CASCADE NOT NULL
);

CREATE TABLE IF NOT EXISTS "reservation" (
    "idReservation" SERIAL PRIMARY KEY,
    "idEditor" INTEGER REFERENCES "editor"("id") ON DELETE CASCADE NOT NULL,
    "status" TEXT NOT NULL,
    "nbSmallTables" INTEGER,
    "nbLargeTables" INTEGER,
    "nbCityHallTables" INTEGER,
    "remise" INTEGER, --on indique directement le montant de la remise
    "typeAnimateur" INTEGER, -- 0 = a besoin de bénévoles, 1 = n'a pas besoin de bénévoles
    "listeDemandee" BOOLEAN,
    "listeRecue" BOOLEAN,
    "jeuxRecus" BOOLEAN,
    "festivalName" TEXT REFERENCES "festival"("name") ON DELETE CASCADE NOT NULL,
    "idTZ" INTEGER REFERENCES "tariffZone"("idTZ") ON DELETE CASCADE,
    "m2" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "planArea" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nbSmallTables" INTEGER NOT NULL,
    "nbLargeTables" INTEGER NOT NULL,
    "nbCityHallTables" INTEGER NOT NULL,
    "festivalName" TEXT REFERENCES "festival"("name") ON DELETE CASCADE NOT NULL,
    "idTZ" INTEGER REFERENCES "tariffZone"("idTZ") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "contact" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL CHECK ("email" ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
    "phone" TEXT,
    "role" TEXT,
    "priority" BOOLEAN,
    "idEditor" INTEGER REFERENCES "editor"("id") ON DELETE CASCADE NOT NULL
);

CREATE TABLE IF NOT EXISTS "suiviReservation" (
    "id" SERIAL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "commentaire" TEXT,
    "date" TIMESTAMP NOT NULL,
    "idReservation" INTEGER REFERENCES "reservation"("idReservation") ON DELETE CASCADE NOT NULL
);

CREATE TABLE IF NOT EXISTS "editor_festival" (
    "idEditor" INTEGER REFERENCES "editor"("id") ON DELETE CASCADE NOT NULL,
    "festivalName" TEXT REFERENCES "festival"("name") ON DELETE CASCADE NOT NULL,
    PRIMARY KEY("idEditor", "festivalName")
);


CREATE TABLE IF NOT EXISTS "game_mechanism" (
    "id" SERIAL PRIMARY KEY,
    "idGame" INTEGER REFERENCES "game"("id") ON DELETE CASCADE,
    "idMechanism" INTEGER REFERENCES "mechanism"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "festival_tariffZone" (
    "festivalName" TEXT REFERENCES "festival"("name") ON DELETE CASCADE,
    "idTZ" INTEGER REFERENCES "tariffZone"("idTZ") ON DELETE CASCADE,
    PRIMARY KEY("festivalName", "idTZ")
);


CREATE TABLE IF NOT EXISTS "reservation_game" (
    "idReservation" INTEGER REFERENCES "reservation"("idReservation") ON DELETE CASCADE,
    "idGame" INTEGER REFERENCES "game"("id") ON DELETE CASCADE,
    "isGamePlaced" BOOLEAN DEFAULT FALSE,
    "quantity" INTEGER DEFAULT 1,
    PRIMARY KEY("idReservation", "idGame")
);

-- Représente les éditeurs qui animent sur une zone
CREATE TABLE IF NOT EXISTS "editor_planArea" (
    "idEditor" INTEGER REFERENCES "editor"("id") ON DELETE CASCADE,
    "idPA" INTEGER REFERENCES "planArea"("id") ON DELETE CASCADE,
    PRIMARY KEY("idEditor", "idPA")
);

-- Représente les jeux présentés sur une zone
CREATE TABLE IF NOT EXISTS "game_planArea" (
    "idGame" INTEGER REFERENCES "game"("id") ON DELETE CASCADE,
    "idPA" INTEGER REFERENCES "planArea"("id") ON DELETE CASCADE,
    "idReservation" INTEGER REFERENCES "reservation"("idReservation") ON DELETE CASCADE,
    "quantity" INTEGER DEFAULT 1,
    PRIMARY KEY("idGame", "idPA", "idReservation")
);

-- Représente un jeu présenté lors d'un festival, lié à une réservation et une zone
CREATE TABLE IF NOT EXISTS "game_festival" (
    "idGame" INTEGER REFERENCES "game"("id") ON DELETE CASCADE,
    "festivalName" TEXT REFERENCES "festival"("name") ON DELETE CASCADE,
    "idReservation" INTEGER REFERENCES "reservation"("idReservation") ON DELETE CASCADE,
    "idPA" INTEGER REFERENCES "planArea"("id") ON DELETE CASCADE,
    "isGamePlaced" BOOLEAN DEFAULT FALSE,
    PRIMARY KEY("idGame", "festivalName", "idReservation", "idPA")
);

-- ============================================
-- DONNÉES DE TEST / SEED DATA
-- ============================================

-- Insérer les festivals de test
INSERT INTO "festival" ("name", "nbSmallTables", "nbLargeTables", "nbCityHallTables", "remainingSmallTables", "remainingLargeTables", "remainingCityHallTables", "creation_date", "begin_date", "end_date", "isCurrent") VALUES
('Festival 2025', 50, 30, 20, 50, 30, 20, '2024-01-01', '2025-06-01', '2025-06-03', TRUE),
('Festival-Rose', 30, 15, 5, 30, 15, 5, CURRENT_DATE, '2026-05-15', '2026-05-17', FALSE),
('Festival-Batman', 60, 30, 10, 60, 30, 10, CURRENT_DATE, '2026-07-10', '2026-07-12', FALSE),
('Festival-Nouveau', 40, 20, 10, 40, 20, 10, CURRENT_DATE, '2026-09-20', '2026-09-22', FALSE)
ON CONFLICT ("name") DO NOTHING;

-- Insérer les zones tarifaires pour chaque festival
INSERT INTO "tariffZone" ("name", "nbSmallTables", "nbLargeTables", "nbCityHallTables", "remainingSmallTables", "remainingLargeTables", "remainingCityHallTables", "smallTablePrice", "largeTablePrice", "cityHallTablePrice", "squareMeterPrice", "festivalName") VALUES
-- Zones pour Festival-Rose
('Zone A', 12, 6, 2, 12, 6, 2, 80, 120, 150, 50, 'Festival-Rose'),
('Zone B', 18, 9, 3, 18, 9, 3, 100, 150, 200, 75, 'Festival-Rose'),
-- Zones pour Festival-Batman
('Zone C', 30, 15, 5, 30, 15, 5, 150, 200, 250, 100, 'Festival-Batman'),
('Zone D', 30, 15, 5, 30, 15, 5, 180, 250, 300, 125, 'Festival-Batman'),
-- Zones pour Festival-Nouveau
('Zone E', 20, 10, 5, 20, 10, 5, 200, 300, 400, 150, 'Festival-Nouveau'),
('Zone F', 20, 10, 5, 20, 10, 5, 250, 350, 450, 175, 'Festival-Nouveau')
ON CONFLICT DO NOTHING;

-- Insérer les types de jeux
INSERT INTO "gameType" ("id", "gameTypeLabel", "idZone") VALUES
(1, 'ambiance', 12),
(2, 'cartes', 13),
(3, 'stratégie', 14),
(4, 'puzzle', 15)
ON CONFLICT ("id") DO NOTHING;

-- Insérer les éditeurs
INSERT INTO "editor" ("id", "name", "exposant", "distributeur", "logo") VALUES
(1, 'Asmodee', false, true, 'whatever'),
(2, 'Days of Wonder', false, false, ''),
(3, 'Gigamic', false, false, ''),
(4, 'Iello', false, false, ''),
(5, 'Blackrock Games', false, false, '')
ON CONFLICT ("id") DO NOTHING;

-- Insérer les contacts
INSERT INTO "contact" ("id", "name", "email", "phone", "role", "idEditor") VALUES
(1, 'Marie Dupont', 'marie.dupont@asmodee.com', '+33 1 23 45 67 89', 'prioritaire', 1),
(2, 'Pierre Martin', 'pierre.martin@asmodee.com', '+33 1 23 45 67 90', 'Directeur Marketing', 1),
(3, 'Sophie Bernard', 'sophie.bernard@daysofwonder.com', '+33 1 34 56 78 90', 'prioritaire', 2),
(4, 'Laurent Petit', 'laurent.petit@gigamic.com', '+33 1 45 67 89 01', 'prioritaire', 3),
(5, 'Julie Moreau', 'julie.moreau@gigamic.com', NULL, 'Assistante Commercial', 3),
(6, 'Thomas Lefebvre', 'thomas.lefebvre@iello.fr', '+33 1 56 78 90 12', 'prioritaire', 4),
(7, 'Alexandre Noir', 'alexandre.noir@blackrockgames.fr', NULL, 'prioritaire', 5),
(8, 'Camille Rousseau', 'camille.rousseau@blackrockgames.fr', '+33 1 67 89 01 23', 'Responsable Communication', 5)
ON CONFLICT ("id") DO NOTHING;

-- Insérer les jeux
INSERT INTO "game" ("id", "name", "author", "nbMinPlayer", "nbMaxPlayer", "gameNotice", "idGameType", "minimumAge", "prototype", "duration", "theme", "description", "gameImage", "rulesTutorial", "edition", "idEditor") VALUES
(1, 'Dobble', 'Denis Blanchot', 2, 8, 'Repérez le symbole commun le plus vite possible !', 1, 6, false, 15, 'Observation', 'Le jeu qui met vos réflexes à rude épreuve.', 'https://exemple.com/dobble.jpg', 'https://youtube.com/video-dobble', 2009, 1),
(2, 'Dixit', 'Jean-Louis Roubira', 3, 6, 'Une image vaut mille mots.', 2, 8, false, 30, 'Poésie / Onirique', 'Utilisez votre imagination pour deviner la carte du conteur.', 'https://exemple.com/dixit.jpg', 'https://youtube.com/video-dixit', 2008, 1),
(3, 'Splendor', 'Marc André', 2, 4, 'Devenez le plus riche marchand de la Renaissance.', 3, 10, false, 30, 'Renaissance / Joyaux', 'Collectez des gemmes pour acquérir des développements.', 'https://exemple.com/splendor.jpg', 'https://youtube.com/video-splendor', 2014, 1),
(4, 'Les Aventuriers du Rail', 'Alan R. Moon', 2, 5, 'Voyagez à travers l''Amérique en train !', 3, 8, false, 45, 'Train / Voyage', 'Prenez le contrôle des rails pour relier les villes et gagner des points.', 'https://exemple.com/ttr.jpg', 'https://youtube.com/video-ttr', 2004, 2),
(5, 'Small World', 'Philippe Keyaerts', 2, 5, 'C''est un monde trop petit pour tout le monde !', 3, 8, false, 60, 'Fantaisie / Conquête', 'Choisissez des combinaisons de peuples et de pouvoirs pour conquérir le territoire.', 'https://exemple.com/smallworld.jpg', 'https://youtube.com/video-smallworld', 2009, 2),
(6, 'Quarto', 'Blaise Müller', 2, 2, 'Alignez quatre pièces ayant au moins un point commun.', 2, 8, false, 15, 'Abstrait', 'Un jeu de réflexion pur où c''est l''adversaire qui choisit la pièce que vous devez jouer.', 'https://exemple.com/quarto.jpg', 'https://youtube.com/video-quarto', 1991, 3),
(7, 'Quoridor', 'Mirko Marchesi', 2, 4, 'Atteignez la ligne adverse en posant des barrières.', 2, 8, false, 15, 'Abstrait / Labyrinthe', 'Un jeu tactique intense : allez-vous avancer ou bloquer votre adversaire ?', 'https://exemple.com/quoridor.jpg', 'https://youtube.com/video-quoridor', 1997, 3),
(8, 'Pylos', 'David G. Royffe', 2, 2, 'Soyez celui qui pose la dernière bille au sommet de la pyramide.', 2, 8, false, 15, 'Abstrait / Construction', 'Économisez vos billes pour dominer la pyramide dans ce duel vertical.', 'https://exemple.com/pylos.jpg', 'https://youtube.com/video-pylos', 1994, 3),
(9, 'Katamino', 'André Perriolat', 1, 2, 'Réalisez des ensembles appelés Penthas.', 4, 3, false, 10, 'Casse-tête / Géométrie', 'Un puzzle évolutif qui aide à comprendre la géométrie dans l''espace.', 'https://exemple.com/katamino.jpg', 'https://youtube.com/video-katamino', 2003, 3),
(10, 'King of Tokyo', 'Richard Garfield', 2, 6, 'Devenez le roi de la ville en écrasant vos adversaires !', 1, 8, false, 30, 'Monstres / Science-Fiction', 'Incarnez des monstres géants qui se battent pour le contrôle de Tokyo à coups de dés.', 'https://exemple.com/king-of-tokyo.jpg', 'https://youtube.com/video-kot', 2011, 4),
(11, 'Biblios', 'Steve Finn', 2, 4, 'Constituez la plus prestigieuse bibliothèque du monastère.', 2, 10, false, 30, 'Médiéval / Monastère', 'Un jeu d''enchères et de gestion de main où vous devez accumuler des ressources sacrées.', 'https://exemple.com/biblios.jpg', 'https://youtube.com/video-biblios', 2007, 4),
(12, 'Kingdomino', 'Bruno Cathala', 2, 4, 'Développez le plus beau royaume en connectant vos dominos.', 2, 8, false, 15, 'Médiéval / Construction de territoire', 'Un jeu de pose de dominos où vous devez construire un royaume de 5x5 cases en optimisant vos types de terrains.', 'https://exemple.com/kingdomino.jpg', 'https://youtube.com/video-kingdomino', 2016, 5)
ON CONFLICT ("id") DO NOTHING;

-- Insérer des réservations d'exemple
INSERT INTO "reservation" ("idReservation", "idEditor", "status", "nbSmallTables", "nbLargeTables", "nbCityHallTables", "remise", "typeAnimateur", "listeDemandee", "listeRecue", "jeuxRecus", "festivalName", "idTZ") VALUES
(1, 1, 'Confirmée', 3, 2, 0, 10.0, 0, true, true, true, 'Festival 2025', 1),
(2, 2, 'En attente', 2, 1, 1, 5.0, 1, true, false, false, 'Festival 2025', 2),
(3, 3, 'Confirmée', 4, 0, 0, 0.0, 0, true, true, false, 'Festival 2025', 1),
(4, 4, 'Discussion', 1, 1, 0, 15.0, 1, false, false, false, 'Festival 2025', 2),
(5, 5, 'Confirmée', 2, 2, 1, 0.0, 0, true, true, true, 'Festival 2025', 1)
ON CONFLICT ("idReservation") DO NOTHING;

-- Insérer des jeux dans les réservations (reservation_game)
INSERT INTO "reservation_game" ("idReservation", "idGame") VALUES
-- Réservation 1 (Asmodee) présente 3 jeux
(1, 1),  -- Dobble
(1, 2),  -- Dixit
(1, 3),  -- Splendor
-- Réservation 2 (Days of Wonder) présente 2 jeux
(2, 4),  -- Les Aventuriers du Rail
(2, 5),  -- Small World
-- Réservation 3 (Gigamic) présente 4 jeux
(3, 6),  -- Quarto
(3, 7),  -- Quoridor
(3, 8),  -- Pylos
(3, 9),  -- Katamino
-- Réservation 4 (Iello) présente 2 jeux
(4, 10), -- King of Tokyo
(4, 11), -- Biblios
-- Réservation 5 (Blackrock Games) présente 1 jeu
(5, 12)  -- Kingdomino
ON CONFLICT ("idReservation", "idGame") DO NOTHING;


-- Réinitialiser les séquences pour éviter les conflits d'ID
SELECT setval(pg_get_serial_sequence('"editor"', 'id'), (SELECT MAX("id") FROM "editor"));
SELECT setval(pg_get_serial_sequence('"contact"', 'id'), (SELECT MAX("id") FROM "contact"));
SELECT setval(pg_get_serial_sequence('"game"', 'id'), (SELECT MAX("id") FROM "game"));
SELECT setval(pg_get_serial_sequence('"gameType"', 'id'), (SELECT MAX("id") FROM "gameType"));
SELECT setval(pg_get_serial_sequence('"reservation"', 'idReservation'), (SELECT MAX("idReservation") FROM "reservation"));
SELECT setval(pg_get_serial_sequence('"tariffZone"', 'idTZ'), (SELECT MAX("idTZ") FROM "tariffZone"));
