-- word bank

SET foreign_key_checks = 0;
DROP TABLE IF EXISTS tbResponse, tbPrompt, tbTag, tbResponseTag, tbPromptTag;
SET foreign_key_checks = 1;

CREATE TABLE tbResponse (
    resId INT NOT NULL AUTO_INCREMENT,
    resText VARCHAR(255) NOT NULL,
    resActive BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (resId)
);

CREATE TABLE tbPrompt (
    proId INT NOT NULL AUTO_INCREMENT,
    proText VARCHAR(255) NOT NULL,
    proActive BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (proId)
);

CREATE TABLE tbTag (
    tId INT NOT NULL AUTO_INCREMENT,
    tText VARCHAR(255) NOT NULL,
    PRIMARY KEY (tId)
);


CREATE TABLE tbResponseTag (
    atId INT NOT NULL AUTO_INCREMENT,
    resId INT NOT NULL,
    tId INT NOT NULL,
    PRIMARY KEY (atId)
);

ALTER TABLE tbResponseTag
    ADD CONSTRAINT
    FOREIGN KEY (resId) REFERENCES tbResponse(resId)
    ON DELETE CASCADE;

ALTER TABLE tbResponseTag
    ADD CONSTRAINT
    FOREIGN KEY (tId) REFERENCES tbTag(tId)
    ON DELETE CASCADE;


CREATE TABLE tbPromptTag (
    qtId INT NOT NULL AUTO_INCREMENT,
    proId INT NOT NULL,
    tId INT NOT NULL,
    PRIMARY KEY (qtId)
);

ALTER TABLE tbPromptTag
    ADD CONSTRAINT
    FOREIGN KEY (proId) REFERENCES tbPrompt(proId)
    ON DELETE CASCADE;

ALTER TABLE tbPromptTag
    ADD CONSTRAINT
    FOREIGN KEY (tId) REFERENCES tbTag(tId)
    ON DELETE CASCADE;


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

