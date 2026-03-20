DROP TABLE IF EXISTS movimentacao;
DROP TABLE IF EXISTS conta;

-- Banco de leitura (CQRS - lado Read)
-- Estrutura mais permissiva: sem constraints de NOT NULL em campos opcionais,
-- pois os dados chegam via eventos do RabbitMQ publicados pelo lado CUD.
-- NAO adicionar triggers de validacao aqui — regras de negocio ficam só no CUD.

CREATE TABLE conta (
    numero VARCHAR(4) PRIMARY KEY,
    cliente_cpf VARCHAR(11),
    cliente_nome VARCHAR(100),
    gerente_cpf VARCHAR(11),
    gerente_nome VARCHAR(100),
    saldo NUMERIC(12,2),
    limite NUMERIC(12,2),
    status VARCHAR(20) CHECK (status IN ('pendente','aprovado','negado')),
    data_criacao DATE NOT NULL,
    CHECK (
        (status = 'pendente' AND gerente_cpf IS NULL)
        OR
        (status IN ('aprovado','negado') AND gerente_cpf IS NOT NULL)
    )
);

CREATE TABLE movimentacao (
    id SERIAL PRIMARY KEY,
    data_hora TIMESTAMP NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('deposito','saque','transferencia')) NOT NULL,
    conta_origem VARCHAR(4),
    conta_destino VARCHAR(4),
    cliente_origem_cpf VARCHAR(11),
    cliente_destino_cpf VARCHAR(11),
    valor NUMERIC(12,2) NOT NULL
);

-- Dados mock iniciais espelhando o estado inicial do CUD
INSERT INTO conta VALUES
('1291','12912861012','Catharyna','98574307084','Geniéve',800,5000,'aprovado','2000-01-01'),
('0950','09506382000','Cleuddônio','64065268052','Godophredo',-10000,10000,'aprovado','1990-10-10'),
('8573','85733854057','Catianna','23862179060','Gyândula',-1000,1500,'aprovado','2012-12-12'),
('5887','58872160006','Cutardo','98574307084','Geniéve',150000,0,'aprovado','2022-02-22'),
('7617','76179646090','Coândrya','64065268052','Godophredo',0,1500,'aprovado','2025-01-01');

INSERT INTO movimentacao (data_hora,tipo,conta_origem,conta_destino,cliente_origem_cpf,cliente_destino_cpf,valor) VALUES
('2020-01-01 10:00','deposito',NULL,'1291',NULL,'12912861012',1000),
('2020-01-01 11:00','deposito',NULL,'1291',NULL,'12912861012',900),
('2020-01-01 12:00','saque','1291',NULL,'12912861012',NULL,550),
('2020-01-01 13:00','saque','1291',NULL,'12912861012',NULL,350),
('2020-01-10 15:00','deposito',NULL,'1291',NULL,'12912861012',2000),
('2020-01-15 08:00','saque','1291',NULL,'12912861012',NULL,500),
('2020-01-20 12:00','transferencia','1291','0950','12912861012','09506382000',1700),
('2025-01-01 12:00','deposito',NULL,'0950',NULL,'09506382000',1000),
('2025-01-02 10:00','deposito',NULL,'0950',NULL,'09506382000',5000),
('2025-01-10 10:00','saque','0950',NULL,'09506382000',NULL,200),
('2025-02-05 10:00','deposito',NULL,'0950',NULL,'09506382000',7000),
('2025-05-05 10:00','deposito',NULL,'8573',NULL,'85733854057',1000),
('2025-05-06 10:00','saque','8573',NULL,'85733854057',NULL,2000),
('2025-06-01 10:00','deposito',NULL,'5887',NULL,'58872160006',150000);