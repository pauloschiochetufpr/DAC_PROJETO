DROP TABLE IF EXISTS movimentacao;
DROP TABLE IF EXISTS conta;

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
        (status = 'pendente' AND gerente_cpf IS NULL)
        OR
        (status IN ('aprovado','negado') AND gerente_cpf IS NOT NULL)
    )
);

CREATE TABLE movimentacao (
    id SERIAL PRIMARY KEY,
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo VARCHAR(20) CHECK (tipo IN ('deposito','saque','transferencia')) NOT NULL,
    conta_origem VARCHAR(4),
    conta_destino VARCHAR(4),
    cliente_origem_cpf VARCHAR(11),
    cliente_destino_cpf VARCHAR(11),
    valor NUMERIC(12,2) NOT NULL
);

INSERT INTO conta VALUES
('1291','12912861012','Catharyna','98574307084','Geniéve',800,5000,'aprovado','2000-01-01'),
('0950','09506382000','Cleuddônio','64065268052','Godophredo',-10000,10000,'aprovado','1990-10-10'),
('8573','85733854057','Catianna','23862179060','Gyândula',-1000,1500,'aprovado','2012-12-12'),
('5887','58872160006','Cutardo','98574307084','Geniéve',150000,0,'aprovado','2022-02-22'),
('7617','76179646090','Coândrya','64065268052','Godophredo',0,1500,'aprovado','2025-01-01');

-- Verifica se a conta origem e destino estão aprovadas
CREATE OR REPLACE FUNCTION verificar_status_conta()
RETURNS TRIGGER AS $$
DECLARE
    status_origem TEXT;
    status_destino TEXT;
BEGIN
    IF NEW.conta_origem IS NOT NULL THEN
        SELECT status INTO status_origem FROM conta WHERE numero = NEW.conta_origem;
        IF status_origem <> 'aprovado' THEN
            RAISE EXCEPTION 'Conta origem não está aprovada';
        END IF;
    END IF;
    IF NEW.conta_destino IS NOT NULL THEN
        SELECT status INTO status_destino FROM conta WHERE numero = NEW.conta_destino;
        IF status_destino <> 'aprovado' THEN
            RAISE EXCEPTION 'Conta destino não está aprovada';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verificar_status_conta
BEFORE INSERT ON movimentacao
FOR EACH ROW EXECUTE FUNCTION verificar_status_conta();

-- Impede movimentações acima do limite da conta
CREATE OR REPLACE FUNCTION verificar_limite_conta()
RETURNS TRIGGER AS $$
DECLARE
    saldo_atual NUMERIC;
    limite_conta NUMERIC;
BEGIN
    IF NEW.conta_origem IS NOT NULL THEN
        SELECT saldo, limite INTO saldo_atual, limite_conta FROM conta WHERE numero = NEW.conta_origem;
        IF (saldo_atual - NEW.valor) < -limite_conta THEN
            RAISE EXCEPTION 'Limite da conta excedido';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verificar_limite_conta
BEFORE INSERT ON movimentacao
FOR EACH ROW EXECUTE FUNCTION verificar_limite_conta();

-- Atualiza automaticamente o saldo das contas
CREATE OR REPLACE FUNCTION atualizar_saldo_conta()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tipo = 'deposito' THEN
        UPDATE conta SET saldo = saldo + NEW.valor WHERE numero = NEW.conta_destino;
    ELSIF NEW.tipo = 'saque' THEN
        UPDATE conta SET saldo = saldo - NEW.valor WHERE numero = NEW.conta_origem;
    ELSIF NEW.tipo = 'transferencia' THEN
        UPDATE conta SET saldo = saldo - NEW.valor WHERE numero = NEW.conta_origem;
        UPDATE conta SET saldo = saldo + NEW.valor WHERE numero = NEW.conta_destino;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualizar_saldo
AFTER INSERT ON movimentacao
FOR EACH ROW EXECUTE FUNCTION atualizar_saldo_conta();

-- Garante que o valor da movimentação seja positivo
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
FOR EACH ROW EXECUTE FUNCTION validar_valor_movimentacao();

-- Preenche automaticamente data e hora da movimentação
CREATE OR REPLACE FUNCTION preencher_data_movimentacao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.data_hora IS NULL THEN
        NEW.data_hora := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_preencher_data_movimentacao
BEFORE INSERT ON movimentacao
FOR EACH ROW EXECUTE FUNCTION preencher_data_movimentacao();

-- Impede transferência para a mesma conta
CREATE OR REPLACE FUNCTION impedir_transferencia_mesma_conta()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tipo = 'transferencia' AND NEW.conta_origem = NEW.conta_destino THEN
        RAISE EXCEPTION 'Transferência para a mesma conta não é permitida';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_impedir_transferencia_mesma_conta
BEFORE INSERT ON movimentacao
FOR EACH ROW EXECUTE FUNCTION impedir_transferencia_mesma_conta();