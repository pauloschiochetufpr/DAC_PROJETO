# Minha participação nos requisitos (Felyppe)

Legenda: **Eu** = fiz a parte principal · **Parcialmente** = fiz parte (geralmente o backend; front/outras camadas de colega) · **Outros** = não fui eu.
Base: `git blame` da versão final.

## Requisitos Funcionais

| Req | Nome | Quem |
|-----|------|------|
| R1  | Autocadastro | Parcialmente (cliente-service meu; saga base de colega; front de outros) |
| R2  | Login / Logout | Outros (auth/JWT) |
| R3  | Tela Inicial do Cliente (saldo) | Parcialmente (saldo no conta-service meu; tela de outros) |
| R4  | Alteração de Perfil | Parcialmente (backend meu: cliente + saga + limite; front de outros) |
| R5  | Depositar | Parcialmente (backend meu no conta-service; front de outros) |
| R6  | Saque | Parcialmente (backend meu no conta-service; front de outros) |
| R7  | Transferência | Parcialmente (backend meu no conta-service; front de outros) |
| R8  | Consulta de Extrato | Parcialmente (backend meu no conta-service; front de outros) |
| R9  | Tela Inicial do Gerente | Parcialmente (listagem backend; tela de outros) |
| R10 | Aprovar Cliente | Parcialmente (backend meu: cliente aprovar + saga + criar conta; front de outros) |
| R11 | Rejeitar Cliente | Parcialmente (backend cliente meu; front de outros) |
| R12 | Consultar Todos os Clientes | Parcialmente (backend cliente meu; front de outros) |
| R13 | Consultar Cliente | Parcialmente (backend cliente meu; front de outros) |
| R14 | Consultar 3 Melhores Clientes | Parcialmente (backend cliente meu; front de outros) |
| R15 | Tela Inicial do Administrador | Parcialmente (agregação por gerente no conta-service meu; resto de outros) |
| R16 | Relatório de Clientes | Parcialmente (cliente meu; composição com gerente de outros) |
| R17 | Inserção de Gerente | Parcialmente (saga + redistribuição minhas; CRUD do gerente de outros) |
| R18 | Remoção de Gerente | Parcialmente (saga + redistribuição minhas; CRUD do gerente de outros) |
| R19 | Listagem de Gerentes | Outros (CRUD do gerente-service) |
| R20 | Alteração de Gerente | Outros (CRUD do gerente-service) |

## Requisitos Não-Funcionais / Padrões de Arquitetura

| # | Requisito | Quem |
|---|-----------|------|
| NF1 | Arquitetura de Microsserviços | Parcialmente (fiz conta, sagas, parte de cliente) |
| NF2 | API Gateway | Outros |
| NF3 | Autenticação JWT | Outros |
| NF4 | Database per Service (BD por serviço) | Eu |
| NF5 | CQRS (microsserviço de Conta) | Eu |
| NF6 | Sincronização CQRS via mensageria | Eu |
| NF7 | SAGA Orquestrada | Eu (3 sagas inteiras + compensação/async na de autocadastro) |
| NF8 | Compensação de etapas (rollback) | Eu |
| NF9 | Comunicação assíncrona via broker (command/reply) | Eu |
| NF10 | Mensageria RabbitMQ (filas/exchanges/eventos) | Eu (grande parte) |
| NF11 | API Composition | Parcialmente (endpoints de agregação no conta-service) |
| NF12 | Criptografia de senha (BCrypt) | Outros |
| NF13 | DTOs (não trafegar entidades) | Parcialmente (DTOs do conta/saga meus) |
| NF14 | Conteinerização (Docker) | Outros |
| NF15 | Orquestração Docker Compose | Parcialmente (contribuí no docker-compose) |
| NF16 | Shell script de automação (DevOps) | Outros |
| NF17 | Tratamento global de erros | Outros |
| NF18 | Infra de reset/reboot para testes — extra | Eu |

Inteiro Eu: 4, 5, 6, 7(menos de autocadastro), 8, 9, 10, 18, 19
Parcialmente EU: 1, 7(autocadastro), 11, 13, 15
Outros: 2, 3, 12, 14, 16, 17

7,13,17

| NF01 | Arquitetura de Microsserviços | Paulo
| NF02 | API Gateway | João 
| NF03 | Autenticação JWT | Henrique 
| NF04 | Database per Service (BD por serviço) | Felyppe
| NF05 | CQRS (microsserviço de Conta) | Felyppe
| NF06 | Sincronização CQRS via mensageria | Felyppe
| NF07 | SAGA Orquestrada | Autocad - Henrique, outros 3 - Felyppe
| NF08 | Compensação de etapas (rollback) | Felyppe
| NF09 | Comunicação assíncrona via broker (command/reply) | Felyppe
| NF10 | Mensageria RabbitMQ (filas/exchanges/eventos) | Felyppe
| NF11 | API Composition | Paulo
| NF12 | Criptografia de senha (BCrypt) | henrique
| NF13 | DTOs (não trafegar entidades) | Paulo
| NF14 | Conteinerização (Docker) | João
| NF15 | Orquestração Docker Compose | João
| NF16 | Shell script de automação (DevOps) | João
| NF17 | Tratamento global de erros | Paulo
| NF18 | Infra de reset/reboot para testes — extra | Paulo 