DROP TABLE IF EXISTS gerente;

CREATE TABLE gerente (
    cpf VARCHAR(11) PRIMARY KEY CHECK (length(cpf) = 11),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('gerente','administrador')) NOT NULL
);

INSERT INTO gerente VALUES
('98574307084','Geniéve','ger1@bantads.com.br','gerente'),
('64065268052','Godophredo','ger2@bantads.com.br','gerente'),
('23862179060','Gyândula','ger3@bantads.com.br','gerente'),
('40501740066','Adamântio','adm1@bantads.com.br','administrador');