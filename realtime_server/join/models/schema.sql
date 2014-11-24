SET foreign_key_checks = 0;
DROP TABLE IF EXISTS tbPlayerGame, tbPlayer, tbGame;
SET foreign_key_checks = 1;

CREATE TABLE tbPlayer (

    -- these fields are created by django abstract base user class (hence
    -- difference name scheme)
    password varchar(128), -- null if no account created
    last_login DATETIME NOT NULL,
    is_superuser bool NOT NULL DEFAULT FALSE,

    pEmail varchar(255) UNIQUE, -- null if no account created
    pActive bool NOT NULL DEFAULT TRUE,
    pAdmin bool NOT NULL DEFAULT FALSE,
    pId INT NOT NULL AUTO_INCREMENT,
    pName VARCHAR(255) NOT NULL,
    pCreatedOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pResetToken VARCHAR(255) NULL,
    pResetTokenTimeout TIMESTAMP NULL,
    pOnEmailList bool NOT NULL DEFAULT TRUE,
    PRIMARY KEY (pId)
);

CREATE TABLE tbGame (
    gId INT NOT NULL AUTO_INCREMENT,
    gParty VARCHAR(255) DEFAULT NULL,
    gCreatedOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gStartedOn TIMESTAMP NULL,
    gCreatedBy INT NOT NULL,
    gType VARCHAR(255) NOT NULL,
    gMaster INT DEFAULT NULL,
    PRIMARY KEY (gId)
);

CREATE TABLE tbPlayerGame (
    pgId INT NOT NULL AUTO_INCREMENT,
    pId INT NOT NULL,
    gId INT NOT NULL,
    pgActive BOOLEAN NOT NULL DEFAULT TRUE,
    pgCreatedOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (pgId)
);


ALTER TABLE tbPlayerGame
    ADD CONSTRAINT
    FOREIGN KEY (pId) REFERENCES tbPlayer(pId)
    ON DELETE CASCADE;

ALTER TABLE tbPlayerGame
    ADD CONSTRAINT
    FOREIGN KEY (gId) REFERENCES tbGame(gId)
    ON DELETE CASCADE;

ALTER TABLE tbGame
    ADD CONSTRAINT
    FOREIGN KEY (gCreatedBy) REFERENCES tbPlayer(pId)
    ON DELETE CASCADE;

ALTER TABLE tbGame
    ADD CONSTRAINT
    FOREIGN KEY (gMaster) REFERENCES tbPlayerGame(pgId)
    ON DELETE SET NULL;

