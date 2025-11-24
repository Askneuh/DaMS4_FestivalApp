CREATE TABLE IF NOT EXISTS festival (
    name TEXT PRIMARY KEY,
    nbTables NUMBER,
    creation_date date,
    begin_date date,
    end_date date
); 

CREATE TABLE IF NOT EXISTS tariffZone (
    idTZ SERIAL PRIMARY KEY,
    name TEXT,
    nbTables NUMBER,
    tablePrice NUMBER,
    squareMeterPrice NUMBER,
    festival TEXT REFERENCES festival(name)
);

CREATE TABLE IF NOT EXISTS editor (
    idEditor SERIAL PRIMARY KEY,
    name TEXT
);

CREATE TABLE IF NOT EXISTS game (
    idGame SERIAL PRIMARY KEY,
    name TEXT,
    author TEXT,
    edition NUMBER,
    idEditor SERIAL REFERENCES editor(idEditor)
);

CREATE TABLE IF NOT EXISTS reservation (
    idReservation SERIAL PRIMARY KEY,
    nbTables NUMBER,
    price NUMBER,
    remise FLOAT,
);

CREATE TABLE IF NOT EXISTS planArea (
    idPA SERIAL PRIMARY KEY,
    nbTables NUMBER,
    festivalName TEXT REFERENCES festival(name)
);

CREATE TABLE IF NOT EXISTS contact (
    idContact SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT CHECK (email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
    phone_number TEXT CHECK (phone_number ~ '^\+?[\s\-]*\(?0?([0-9]{1,4})?\)?[\s\-\.]*([0-9\s\-\.]{6,14})$')
    idEditor SERIAL REFERENCES editor(idEditor)
    
);

CREATE TABLE IF NOT EXISTS suiviReservation (
    idSuivi SERIAL PRIMARY KEY,
    status TEXT,
    modification_date date
    idReservation SERIAL REFERENCES reservation(idReservation)
);

CREATE TABLE IF NOT EXISTS game_festival (
    idGame SERIAL REFERENCES game(idGame),
    festivalName TEXT REFERENCES festival(name),
    idReservation SERIAL REFERENCES reservation(idReservation),
    idPA SERIAL REFERENCES planArea(idPA),
    PRIMARY KEY(idGame, festivalName, idReservation, idPA)
);

CREATE TABLE IF NOT EXISTS festival_tariffZone (
    festivalName TEXT REFERENCES festival(name),
    idTZ SERIAL REFERENCES tariffZone(idTZ),
    PRIMARY KEY(festivalName, idTZ)
);

CREATE TABLE IF NOT EXISTS reservation_tariffZone (
    idReservation SERIAL REFERENCES reservation(idReservation),
    idTZ SERIAL REFERENCES tariffZone(idTZ),
    PRIMARY KEY(idReservation, idTZ)
);

CREATE TABLE IF NOT EXISTS reservation_game (
    idReservation SERIAL REFERENCES reservation(idReservation),
    idGame SERIAL REFERENCES game(idGame),
    PRIMARY KEY(idReservation, idGame)
);

CREATE TABLE IF NOT EXISTS editor_planArea (
    idEditor SERIAL REFERENCES editor(idEditor),
    idPA SERIAL REFERENCES planArea(idPA),
    PRIMARY KEY(idEditor, idPA)
);

CREATE TABLE IF NOT EXISTS game_planArea (
    id SERIAL REFERENCES editor(idEditor),
    idGame SERIAL REFERENCES game(idGame),
    PRIMARY KEY(idEditor, idGame)
);
