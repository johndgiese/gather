SET GLOBAL sql_mode = 'STRICT_TRANS_TABLES';
ALTER DATABASE gather CHARACTER SET utf8 COLLATE utf8_general_ci;

SOURCE join/models/schema.sql;
SOURCE words/models/schema.sql;
