SET foreign_key_checks = 0;
DROP TABLE IF EXISTS tb_player_game, tb_player, tb_game;
SET foreign_key_checks = 1;

CREATE TABLE tb_player (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(1024) NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE tb_game (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(1024) NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    active_players INT NOT NULL DEFAULT FALSE,
    open BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id)
);

CREATE TABLE tb_player_game (
    id INT NOT NULL AUTO_INCREMENT,
    player_id INT NOT NULL,
    game_id INT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);


ALTER TABLE tb_player_game
    ADD CONSTRAINT fk_player_id
    FOREIGN KEY (player_id) REFERENCES tb_player(id) 
    ON DELETE CASCADE;

ALTER TABLE tb_player_game
    ADD CONSTRAINT fk_game_id
    FOREIGN KEY (game_id) REFERENCES tb_game(id) 
    ON DELETE CASCADE;

ALTER TABLE tb_game 
    ADD CONSTRAINT fk_created_by 
    FOREIGN KEY (created_by) REFERENCES tb_player(id) 
    ON DELETE CASCADE;



-- update game active player count using a trigger that is called when the
-- `tb_player_game` table is UPDATED or INSERTED

DROP PROCEDURE IF EXISTS pr_update_game_active_players;

delimiter //
CREATE PROCEDURE pr_update_game_active_players(game_id_ INT)
    BEGIN
        DECLARE active_players_ INT;
        SELECT COUNT(*) INTO active_players_ FROM tb_player_game
            WHERE game_id = game_id_ AND active = TRUE;
        UPDATE tb_game SET 
            active_players = active_players_,
            open = active_players_ > 0
                WHERE id=game_id_;
    END;
//
delimiter ;

CREATE TRIGGER tr_game_status_upd AFTER UPDATE ON tb_player_game 
    FOR EACH ROW CALL pr_update_game_active_players(NEW.game_id);

CREATE TRIGGER tr_game_status_ins AFTER INSERT ON tb_player_game 
    FOR EACH ROW CALL pr_update_game_active_players(NEW.game_id);
