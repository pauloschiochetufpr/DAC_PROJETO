-- Script executado no startup do gerente-service
-- Cria o banco apenas se ainda não existir
SELECT 'CREATE DATABASE gerente_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'gerente_db'
)\gexec