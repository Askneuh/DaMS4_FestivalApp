DROP TABLE IF EXISTS game_planArea CASCADE;
DROP TABLE IF EXISTS editor_planArea CASCADE;
DROP TABLE IF EXISTS reservation_game CASCADE;
DROP TABLE IF EXISTS reservation_tariffZone CASCADE;
DROP TABLE IF EXISTS festival_tariffZone CASCADE;
DROP TABLE IF EXISTS game_festival CASCADE;
DROP TABLE IF EXISTS suiviReservation CASCADE;
DROP TABLE IF EXISTS contact CASCADE;
DROP TABLE IF EXISTS planArea CASCADE;
DROP TABLE IF EXISTS reservation CASCADE;
DROP TABLE IF EXISTS mechanism CASCADE;
DROP TABLE IF EXISTS gameType CASCADE;
DROP TABLE IF EXISTS game CASCADE;
DROP TABLE IF EXISTS editor CASCADE;
DROP TABLE IF EXISTS tariffZone CASCADE;
DROP TABLE IF EXISTS festival CASCADE;
DROP TABLE IF EXISTS users CASCADE;



CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    login TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS festival (
    name TEXT PRIMARY KEY,
    nbTables INTEGER NOT NULL,
    creation_date DATE,
    begin_date DATE,
    end_date DATE
);

CREATE TABLE IF NOT EXISTS mechanism (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS gameType (
    id SERIAL PRIMARY KEY,
    gameTypeLabel TEXT NOT NULL,
    idZone INTEGER -- idZone dans l'interface, mais la FK n'est pas claire, donc laissé comme simple colonne
);

CREATE TABLE IF NOT EXISTS editor (
    idEditor SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    exposant BOOLEAN NOT NULL DEFAULT FALSE,
    distributeur BOOLEAN NOT NULL DEFAULT FALSE,
    logo TEXT
);



CREATE TABLE IF NOT EXISTS tariffZone (
    idTZ SERIAL PRIMARY KEY,
    name TEXT,
    nbTables INTEGER,
    tablePrice NUMERIC,
    squareMeterPrice NUMERIC,
    festivalName TEXT REFERENCES festival(name) NOT NULL
);

CREATE TABLE IF NOT EXISTS game (
    idGame SERIAL PRIMARY KEY,
    name TEXT NOT NULL, 
    author TEXT NOT NULL,
    nbMinPlayer INTEGER NOT NULL,
    nbMaxPlayer INTEGER NOT NULL,
    gameNotice TEXT,
    idGameType INTEGER REFERENCES gameType(id) NOT NULL,
    minimumAge INTEGER NOT NULL,
    prototype BOOLEAN NOT NULL DEFAULT FALSE,
    duration INTEGER NOT NULL, --A voir
    theme TEXT,
    description TEXT,
    gameImage TEXT, --a voir
    rulesTutorial TEXT,
    edition INTEGER,
    idEditor INTEGER REFERENCES editor(idEditor) NOT NULL
);

CREATE TABLE IF NOT EXISTS reservation (
    idReservation SERIAL PRIMARY KEY,
    idEditor INTEGER REFERENCES editor(idEditor) NOT NULL,
    nbTables INTEGER,
    price NUMERIC,
    remise FLOAT
    -- La colonne 'editeur' dans reservation.ts est implicite via la FK idEditor
);

CREATE TABLE IF NOT EXISTS planArea (
    idPA SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    nbTables INTEGER NOT NULL,
    festivalName TEXT REFERENCES festival(name) NOT NULL
);

CREATE TABLE IF NOT EXISTS contact (
    idContact SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL CHECK (email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
    phone TEXT, -- phone dans Contact.ts est optionnel ???
    role TEXT, -- role dans Contact.ts est optionnel ???
    idEditor INTEGER REFERENCES editor(idEditor) NOT NULL
);

CREATE TABLE IF NOT EXISTS suiviReservation (
    idSuivi SERIAL PRIMARY KEY,
    status TEXT NOT NULL,
    modification_date DATE NOT NULL,
    idReservation INTEGER REFERENCES reservation(idReservation) NOT NULL
);



CREATE TABLE IF NOT EXISTS game_mechanism (
    idGame INTEGER REFERENCES game(idGame),
    idMechanism INTEGER REFERENCES mechanism(id),
    PRIMARY KEY(idGame, idMechanism)
);

CREATE TABLE IF NOT EXISTS festival_tariffZone (
    festivalName TEXT REFERENCES festival(name),
    idTZ INTEGER REFERENCES tariffZone(idTZ),
    PRIMARY KEY(festivalName, idTZ)
);

CREATE TABLE IF NOT EXISTS reservation_tariffZone (
    idReservation INTEGER REFERENCES reservation(idReservation),
    idTZ INTEGER REFERENCES tariffZone(idTZ),
    PRIMARY KEY(idReservation, idTZ)
);

CREATE TABLE IF NOT EXISTS reservation_game (
    idReservation INTEGER REFERENCES reservation(idReservation),
    idGame INTEGER REFERENCES game(idGame),
    PRIMARY KEY(idReservation, idGame)
);

-- Représente les éditeurs qui animent sur une zone
CREATE TABLE IF NOT EXISTS editor_planArea (
    idEditor INTEGER REFERENCES editor(idEditor),
    idPA INTEGER REFERENCES planArea(idPA),
    PRIMARY KEY(idEditor, idPA)
);

-- Représente les jeux présentés sur une zone
CREATE TABLE IF NOT EXISTS game_planArea (
    idGame INTEGER REFERENCES game(idGame),
    idPA INTEGER REFERENCES planArea(idPA),
    PRIMARY KEY(idGame, idPA)
);

-- Représente un jeu présenté lors d'un festival, lié à une réservation et une zone
CREATE TABLE IF NOT EXISTS game_festival (
    idGame INTEGER REFERENCES game(idGame),
    festivalName TEXT REFERENCES festival(name),
    idReservation INTEGER REFERENCES reservation(idReservation),
    idPA INTEGER REFERENCES planArea(idPA),
    PRIMARY KEY(idGame, festivalName, idReservation, idPA)
);