SET foreign_key_checks = 0;
DROP TABLE IF EXISTS tbAnswer, tbQuestion, tbTag, tbAnswerTag, tbQuestionTag;
SET foreign_key_checks = 1;

CREATE TABLE tbAnswer (
    aId INT NOT NULL AUTO_INCREMENT,
    aText VARCHAR(255) NOT NULL,
    aActive BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (aId)
);

CREATE TABLE tbQuestion (
    qId INT NOT NULL AUTO_INCREMENT,
    qText VARCHAR(255) NOT NULL,
    qType ENUM('fill', 'assoc', 'overhear') NOT NULL,
    qActive BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (qId)
);

CREATE TABLE tbTag (
    tId INT NOT NULL AUTO_INCREMENT,
    tText VARCHAR(255) NOT NULL,
    PRIMARY KEY (tId)
);


CREATE TABLE tbAnswerTag (
    atId INT NOT NULL AUTO_INCREMENT,
    aId INT NOT NULL,
    tId INT NOT NULL,
    PRIMARY KEY (atId)
);

ALTER TABLE tbAnswerTag
    ADD CONSTRAINT
    FOREIGN KEY (aId) REFERENCES tbAnswer(aId)
    ON DELETE CASCADE;

ALTER TABLE tbAnswerTag
    ADD CONSTRAINT
    FOREIGN KEY (tId) REFERENCES tbTag(tId)
    ON DELETE CASCADE;


CREATE TABLE tbQuestionTag (
    qtId INT NOT NULL AUTO_INCREMENT,
    qId INT NOT NULL,
    tId INT NOT NULL,
    PRIMARY KEY (qtId)
);

ALTER TABLE tbQuestionTag
    ADD CONSTRAINT
    FOREIGN KEY (qId) REFERENCES tbQuestion(qId)
    ON DELETE CASCADE;

ALTER TABLE tbQuestionTag
    ADD CONSTRAINT
    FOREIGN KEY (tId) REFERENCES tbTag(tId)
    ON DELETE CASCADE;

