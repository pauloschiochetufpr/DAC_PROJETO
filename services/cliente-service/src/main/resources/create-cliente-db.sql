-- Script executado no startup do cliente-service
-- Cria o banco apenas se ainda não existir
SELECT 'CREATE DATABASE cliente_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'cliente_db'
)\gexec
 