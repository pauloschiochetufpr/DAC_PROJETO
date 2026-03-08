-- Reset
DROP TABLE IF EXISTS movimentacao;
DROP TABLE IF EXISTS conta;
DROP TABLE IF EXISTS cliente;
DROP TABLE IF EXISTS gerente;

-- Create
CREATE TABLE gerente (
    cpf VARCHAR(11) PRIMARY KEY CHECK (length(cpf) = 11),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    senha VARCHAR(120) NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('gerente','administrador')) NOT NULL
);

CREATE TABLE cliente (
    cpf VARCHAR(11) PRIMARY KEY CHECK (length(cpf) = 11),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    senha VARCHAR(120) NOT NULL,
    salario NUMERIC(12,2) NOT NULL,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    status VARCHAR(20) CHECK (status IN ('ativo','inativo')) NOT NULL,
    gerente_cpf VARCHAR(11),
    gerente_nome VARCHAR(100)
);

CREATE TABLE conta (
    numero VARCHAR(4) PRIMARY KEY,
    cliente_cpf VARCHAR(11) UNIQUE NOT NULL,
    cliente_nome VARCHAR(100),
    gerente_cpf VARCHAR(11),
    gerente_nome VARCHAR(100),
    saldo NUMERIC(12,2) NOT NULL,
    limite NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pendente','aprovado','negado')) NOT NULL,
    data_criacao DATE NOT NULL,

    CHECK (
        (status = 'pendente' AND gerente_cpf IS NULL) OR
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

-- Insert
INSERT INTO gerente VALUES
('98574307084','Geniéve','ger1@bantads.com.br','tads','gerente'),
('64065268052','Godophredo','ger2@bantads.com.br','tads','gerente'),
('23862179060','Gyândula','ger3@bantads.com.br','tads','gerente'),
('40501740066','Adamântio','adm1@bantads.com.br','tads','administrador');

INSERT INTO cliente VALUES
('12912861012','Catharyna','cli1@bantads.com.br','tads',10000,'Curitiba','PR','ativo',NULL,NULL),
('09506382000','Cleuddônio','cli2@bantads.com.br','tads',20000,'Curitiba','PR','ativo',NULL,NULL),
('85733854057','Catianna','cli3@bantads.com.br','tads',3000,'Curitiba','PR','ativo',NULL,NULL),
('58872160006','Cutardo','cli4@bantads.com.br','tads',500,'Curitiba','PR','ativo',NULL,NULL),
('76179646090','Coândrya','cli5@bantads.com.br','tads',1500,'Curitiba','PR','ativo',NULL,NULL);

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

-- Triggers

-- 1) Validar email do cliente
CREATE OR REPLACE FUNCTION validar_email_cliente()
RETURNS TRIGGER AS $$
BEGIN
    IF POSITION('@' IN NEW.email) = 0 THEN
        RAISE EXCEPTION 'Email inválido. Deve conter @';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_email_cliente
BEFORE INSERT OR UPDATE ON cliente
FOR EACH ROW
EXECUTE FUNCTION validar_email_cliente();

-- 2) Impedir movimentação em conta não aprovada
CREATE OR REPLACE FUNCTION verificar_status_conta()
RETURNS TRIGGER AS $$
DECLARE
    status_conta TEXT;
BEGIN
    SELECT status INTO status_conta
    FROM conta
    WHERE numero = NEW.conta_numero;

    IF status_conta <> 'aprovado' THEN
        RAISE EXCEPTION 'Movimentação permitida apenas em contas aprovadas';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verificar_status_conta
BEFORE INSERT ON movimentacao
FOR EACH ROW
EXECUTE FUNCTION verificar_status_conta();

-- 3) Impedir saque acima do limite
CREATE OR REPLACE FUNCTION verificar_limite_conta()
RETURNS TRIGGER AS $$
DECLARE
    saldo_atual NUMERIC;
    limite_conta NUMERIC;
BEGIN

    SELECT saldo, limite INTO saldo_atual, limite_conta
    FROM conta
    WHERE numero = NEW.conta_numero;

    IF NEW.tipo = 'saque' THEN
        IF saldo_atual - NEW.valor < -limite_conta THEN
            RAISE EXCEPTION 'Limite da conta excedido';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verificar_limite_conta
BEFORE INSERT ON movimentacao
FOR EACH ROW
EXECUTE FUNCTION verificar_limite_conta();

-- 4) Atualizar saldo automaticamente
CREATE OR REPLACE FUNCTION atualizar_saldo_conta()
RETURNS TRIGGER AS $$
BEGIN

    IF NEW.tipo = 'deposito' THEN
        UPDATE conta
        SET saldo = saldo + NEW.valor
        WHERE numero = NEW.conta_numero;

    ELSIF NEW.tipo = 'saque' THEN
        UPDATE conta
        SET saldo = saldo - NEW.valor
        WHERE numero = NEW.conta_numero;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualizar_saldo
AFTER INSERT ON movimentacao
FOR EACH ROW
EXECUTE FUNCTION atualizar_saldo_conta();

-- 5) Preencher data automaticamente
CREATE OR REPLACE FUNCTION adicionar_data_movimentacao()
RETURNS TRIGGER AS $$
BEGIN

    IF NEW.data_movimentacao IS NULL THEN
        NEW.data_movimentacao = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_data_movimentacao
BEFORE INSERT ON movimentacao
FOR EACH ROW
EXECUTE FUNCTION adicionar_data_movimentacao();

-- 6) Validar valor da movimentação
CREATE OR REPLACE FUNCTION validar_valor_movimentacao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.valor <= 0 THEN
        RAISE EXCEPTION 'Valor da movimentação deve ser positivo';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_valor_movimentacao
BEFORE INSERT ON movimentacao
FOR EACH ROW
EXECUTE FUNCTION validar_valor_movimentacao();