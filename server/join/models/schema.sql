SET foreign_key_checks = 0;
DROP TABLE IF EXISTS tbPlayerGame, tbPlayer, tbGame;
SET foreign_key_checks = 1;

CREATE TABLE tbPlayer (
    pId INT NOT NULL AUTO_INCREMENT,
    pName VARCHAR(255) NOT NULL,
    pCreatedOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (pId)
);

CREATE TABLE tbGame (
    gId INT NOT NULL AUTO_INCREMENT,
    gHash VARCHAR(255) UNIQUE,
    gCreatedOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gCreatedBy INT,
    gActivePlayers INT NOT NULL DEFAULT FALSE,
    gOpen BOOLEAN NOT NULL DEFAULT TRUE,
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


DROP PROCEDURE IF EXISTS prUpdateGameActivePlayers;

delimiter //
CREATE PROCEDURE prUpdateGameActivePlayers(gId_ INT)
    BEGIN
        DECLARE gActivePlayers_ INT;
        SELECT COUNT(*) INTO gActivePlayers_ FROM tbPlayerGame
            WHERE gId=gId_ AND pgActive=TRUE;
        UPDATE tbGame SET 
            gActivePlayers = gActivePlayers_,
            gOpen = gActivePlayers_ > 0
            WHERE gId=gId_;
    END;
//
delimiter ;

CREATE TRIGGER trGameStatusUpd AFTER UPDATE ON tbPlayerGame 
    FOR EACH ROW CALL prUpdateGameActivePlayers(NEW.gId);

CREATE TRIGGER trGameStatusIns AFTER INSERT ON tbPlayerGame 
    FOR EACH ROW CALL prUpdateGameActivePlayers(NEW.gId);

