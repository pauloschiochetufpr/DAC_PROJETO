-- Script executado no startup do conta-service
-- Cria os dois bancos CQRS apenas se ainda não existirem
SELECT 'CREATE DATABASE conta_cud_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'conta_cud_db'
)\gexec
 
SELECT 'CREATE DATABASE conta_r_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'conta_r_db'
)\gexec
 