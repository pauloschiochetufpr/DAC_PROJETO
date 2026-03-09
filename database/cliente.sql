DROP TABLE IF EXISTS cliente;

CREATE TABLE cliente (
    cpf VARCHAR(11) PRIMARY KEY CHECK (length(cpf) = 11),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    salario NUMERIC(12,2) NOT NULL,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    status VARCHAR(20) CHECK (status IN ('ativo','inativo')) NOT NULL
);

INSERT INTO cliente VALUES
('12912861012','Catharyna','cli1@bantads.com.br',10000,'Curitiba','PR','ativo'),
('09506382000','Cleuddônio','cli2@bantads.com.br',20000,'Curitiba','PR','ativo'),
('85733854057','Catianna','cli3@bantads.com.br',3000,'Curitiba','PR','ativo'),
('58872160006','Cutardo','cli4@bantads.com.br',500,'Curitiba','PR','ativo'),
('76179646090','Coândrya','cli5@bantads.com.br',1500,'Curitiba','PR','ativo');