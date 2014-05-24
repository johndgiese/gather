SET foreign_key_checks = 0;
DROP TABLE IF EXISTS tb_answer, tb_question, tb_tag, tb_answer_tag, tb_question_tag;
SET foreign_key_checks = 1;

CREATE TABLE tb_answer (
    id INT NOT NULL AUTO_INCREMENT,
    word VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id)
);

CREATE TABLE tb_question (
    id INT NOT NULL AUTO_INCREMENT,
    text VARCHAR(255) NOT NULL,
    type ENUM('fill', 'assoc', 'overhear') NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id)
);

CREATE TABLE tb_tag (
    id INT NOT NULL AUTO_INCREMENT,
    text VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);


CREATE TABLE tb_answer_tag (
    id INT NOT NULL AUTO_INCREMENT,
    id_answer INT NOT NULL,
    id_tag INT NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE tb_answer_tag
    ADD CONSTRAINT
    FOREIGN KEY (id_answer) REFERENCES tb_answer(id) 
    ON DELETE CASCADE;

ALTER TABLE tb_answer_tag
    ADD CONSTRAINT
    FOREIGN KEY (id_tag) REFERENCES tb_tag(id) 
    ON DELETE CASCADE;


CREATE TABLE tb_question_tag (
    id INT NOT NULL AUTO_INCREMENT,
    id_question INT NOT NULL,
    id_tag INT NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE tb_question_tag
    ADD CONSTRAINT
    FOREIGN KEY (id_question) REFERENCES tb_question(id) 
    ON DELETE CASCADE;

ALTER TABLE tb_question_tag
    ADD CONSTRAINT
    FOREIGN KEY (id_tag) REFERENCES tb_tag(id) 
    ON DELETE CASCADE;
