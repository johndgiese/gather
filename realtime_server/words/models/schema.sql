-- word bank

SET foreign_key_checks = 0;
DROP TABLE IF EXISTS tbResponse, tbPrompt, tbTag, tbResponseTag, tbPromptTag;
SET foreign_key_checks = 1;

CREATE TABLE tbResponse (
    resId INT NOT NULL AUTO_INCREMENT,
    resText VARCHAR(255) NOT NULL,
    resActive BOOLEAN NOT NULL DEFAULT TRUE,
    resCreatedBy INT NOT NULL,
    resCreatedOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resCreatedBy) REFERENCES tbPlayer(pId) ON DELETE SET NULL,
    PRIMARY KEY (resId)
);

CREATE TABLE tbPrompt (
    proId INT NOT NULL AUTO_INCREMENT,
    proText VARCHAR(255) NOT NULL,
    proActive BOOLEAN NOT NULL DEFAULT TRUE,
    proCreatedBy INT NOT NULL,
    proCreatedOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proCreatedBy) REFERENCES tbPlayer(pId) ON DELETE SET NULL,
    PRIMARY KEY (proId)
);

CREATE TABLE tbTag (
    tId INT NOT NULL AUTO_INCREMENT,
    tText VARCHAR(255) NOT NULL,
    tCreatedOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tCreatedBy INT NOT NULL,
    FOREIGN KEY (tCreatedBy) REFERENCES tbPlayer(pId) ON DELETE SET NULL,
    PRIMARY KEY (tId)
);


CREATE TABLE tbResponseTag (
    atId INT NOT NULL AUTO_INCREMENT,
    resId INT NOT NULL,
    atCreatedBy INT NOT NULL,
    tId INT NOT NULL,
    FOREIGN KEY (resId) REFERENCES tbResponse(resId) ON DELETE CASCADE,
    FOREIGN KEY (tId) REFERENCES tbTag(tId) ON DELETE CASCADE,
    FOREIGN KEY (atCreatedBy) REFERENCES tbPlayer(pId) ON DELETE SET NULL,
    PRIMARY KEY (atId)
);


CREATE TABLE tbPromptTag (
    qtId INT NOT NULL AUTO_INCREMENT,
    proId INT NOT NULL,
    qtCreatedBy INT NOT NULL,
    tId INT NOT NULL,
    FOREIGN KEY (proId) REFERENCES tbPrompt(proId) ON DELETE CASCADE,
    FOREIGN KEY (tId) REFERENCES tbTag(tId) ON DELETE CASCADE,
    FOREIGN KEY (qtCreatedBy) REFERENCES tbPlayer(pId) ON DELETE SET NULL,
    PRIMARY KEY (qtId)
);


-- game structure

SET foreign_key_checks = 0;
DROP TABLE IF EXISTS tbRound, tbCard, tbVote;
SET foreign_key_checks = 1;

-- a game consists of a series of rounds; each round has a prompt and a reader
CREATE TABLE tbRound (
    rId INT NOT NULL AUTO_INCREMENT,
    gId INT NOT NULL, -- the game
    proId INT NOT NULL,  -- the prompt
    pgId INT NOT NULL, -- the reader
    rNumber INT NOT NULL, -- round number
    rCreatedOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rDoneReadingPrompt TIMESTAMP NULL,
    rDoneChoosing TIMESTAMP NULL,
    rDoneReadingChoices TIMESTAMP NULL,
    rDoneVoting TIMESTAMP NULL,
    PRIMARY KEY (rId)
);

ALTER TABLE tbRound
    ADD CONSTRAINT
    FOREIGN KEY (gId) REFERENCES tbGame(gId)
    ON DELETE CASCADE;

ALTER TABLE tbRound
    ADD CONSTRAINT
    FOREIGN KEY (proId) REFERENCES tbPrompt(proId)
    ON DELETE CASCADE;

ALTER TABLE tbRound
    ADD CONSTRAINT
    FOREIGN KEY (pgId) REFERENCES tbPlayerGame(pgId)
    ON DELETE CASCADE;

ALTER TABLE tbRound
    ADD UNIQUE unRound(gId, rNumber);


-- each player has a hand of cards; they play a single card per round
CREATE TABLE tbCard (
    cId INT NOT NULL AUTO_INCREMENT,
    resId INT NOT NULL, -- the response
    rId INT DEFAULT NULL, -- round when card is played; NULL --> in hand
    pgId INT NOT NULL, -- owner of the card
    cCreatedOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- when the card was distributed
    cPlayedOn TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP, -- when the card was played
    PRIMARY KEY (cId)
);

ALTER TABLE tbCard
    ADD CONSTRAINT
    FOREIGN KEY (resId) REFERENCES tbResponse(resId)
    ON DELETE CASCADE;

ALTER TABLE tbCard
    ADD CONSTRAINT
    FOREIGN KEY (rId) REFERENCES tbRound(rId)
    ON DELETE CASCADE;

ALTER TABLE tbCard
    ADD CONSTRAINT
    FOREIGN KEY (pgId) REFERENCES tbPlayerGame(pgId)
    ON DELETE CASCADE;

-- players can vote on cards that have been played on a given round
CREATE TABLE tbVote (
    vId INT NOT NULL AUTO_INCREMENT,
    pgId INT NOT NULL, -- who is voting
    cId INT NOT NULL, -- card they are voting for
    vCreatedOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (vId)
);

ALTER TABLE tbVote
    ADD CONSTRAINT
    FOREIGN KEY (pgId) REFERENCES tbPlayerGame(pgId)
    ON DELETE CASCADE;

ALTER TABLE tbVote
    ADD CONSTRAINT
    FOREIGN KEY (cId) REFERENCES tbCard(cId)
    ON DELETE CASCADE;

