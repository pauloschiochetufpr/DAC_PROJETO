# masterBank — Como executar (Docker & Maven)

Este README descreve os passos para compilar os serviços com Maven, gerenciar os containers Docker do projeto e as obrigações do `docker-compose`.

## Pré-requisitos

- Docker e Docker Compose instalados
- Maven instalado (para compilar serviços Java)

---

Script para inicialização completa funcional. Rode na raiz do projeto:

```bash
wsl bash ./start.sh
```

---

## 1) Compilar com Maven

Para compilar um serviço Spring Boot (ex.: `auth-service`):

```bash
cd services/auth-service
mvn clean package -DskipTests
```

> Faça isso para cada serviço em seu respectivo terminal (Nunca use o terminal do projeto)

## 2) Derrubar o container atual

> Agora é em um terminal na raiz do projeto.

Parar e remover os containers gerenciados pelo compose do projeto:

```bash
# estando na raiz do repositório
docker compose down
```

Parar e remover um container específico (ex.: `auth-service`):

```bash
docker stop auth-service
docker rm auth-service
```

Observação: `docker compose down --volumes` remove volumes associados (use com cuidado).

## 3) Rodar os containers em segundo plano

Construir e subir os serviços em background (modo detach):

```bash
# na raiz do repositório (onde está docker-compose.yml)
docker compose up -d --build
```

Para ver logs de um serviço:

```bash
docker compose logs -f auth-service
```

## 4) Comandos de listagem

- Listar volumes:

```bash
docker volume ls
```

- Listar imagens:

```bash
docker images
# ou
# docker image ls
```

- Listar containers (ativos e parados):

```bash
docker ps -a
# ou
# docker compose ps
```

## 5) Eliminar volumes anônimos (prune)

Remover volumes não utilizados (anonimos) com confirmação:

```bash
docker volume prune
```

Remover tudo (imagens, containers, volumes não usados):

```bash
docker system prune --volumes
```

Use com cuidado: comandos de prune removem dados que podem ser irrecuperáveis.

## 6) Obrigações do `docker-compose` para este projeto

- Healthchecks: cada serviço que fornece dependência (BD, broker, etc.) deve declarar `healthcheck` para que serviços dependentes possam aguardar startup estável.

  Exemplo (Postgres):

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U dac"]
  interval: 10s
  timeout: 5s
  retries: 5
```

- `depends_on` entre serviços interdependentes deve usar condição de saúde (quando disponível), por exemplo:

```yaml
depends_on:
  mongo:
    condition: service_healthy
  rabbitmq:
    condition: service_healthy
```

- Endpoints de saúde (Actuator): serviços Spring Boot devem expor o endpoint de `health` (como em `auth-service`) para que o `healthcheck` do container possa validar prontidão.

## 7) Portas que devem estar abertas no host (recomendado)

Observação: Por ser um projeto de faculdadee, expor portas de bancod e dados e afins é deliberado e usado para análise dos dados e resultados.

- Banco de dados PostgreSQL: `5432` - acessar o BD a partir do host.
- MongoDB: `27017` - o mesmo motivo do de cima.
- RabbitMQ Management UI: `15672` - útil para inspeção via browser.
- Frontend: `5173` - Sempre aberto, tem que ser acessado pelo cliente.
- Gateway: `8080` - Interface de acesso aos MS's.

---

## 8) Script `start.sh` — inicialização interativa completa

O `start.sh` é o ponto de entrada recomendado para subir o ambiente do zero. Ele gerencia compilação Maven, build das imagens Docker e inicialização dos containers através de menus interativos.

### Pré-requisitos

- Docker em execução (daemon ativo)
- WSL funcional e acessível no terminal Windows
- `docker compose` disponível dentro do WSL (plugin V2 ou standalone)
- Maven + JDK 17 instalados no WSL (opcional — se ausentes, o script compila via container `maven:3.9-eclipse-temurin-17` automaticamente)
- O arquivo `docker-compose.yml` deve estar na raiz do projeto

### Como rodar

A partir de um terminal Windows, na raiz do projeto:

```bash
wsl bash ./start.sh
```

### Fluxo ao iniciar

Ao rodar, o script exibe dois menus em sequência antes de subir o ambiente:

**1. Menu de compilação — preparação dos JARs Java**

| Opção | Ação                                        |
| ----- | ------------------------------------------- |
| `[1]` | Compila apenas os serviços sem JAR gerado   |
| `[2]` | Recompila todos os serviços Java            |
| `[3]` | Escolhe um serviço específico para compilar |
| `[4]` | Pula a compilação (JARs já estão prontos)   |

**2. Menu de inicialização — como subir o ambiente**

| Opção | Ação                                                                      |
| ----- | ------------------------------------------------------------------------- |
| `[1]` | Sobe normalmente aproveitando cache de imagens existente                  |
| `[2]` | Rebuild completo — derruba tudo, recompila e reconstrói imagens sem cache |
| `[3]` | Sai sem fazer nada                                                        |

### Menu principal (pós-boot)

Após o ambiente estar no ar, o script entra em loop com o menu principal:

| Opção | Ação                                                                              |
| ----- | --------------------------------------------------------------------------------- |
| `[1]` | Ver logs em tempo real de todos os containers (`Ctrl+C` volta ao menu)            |
| `[2]` | Exibir status atual dos containers                                                |
| `[3]` | Gerenciar um serviço individual (subir ou derrubar)                               |
| `[4]` | Rebuild completo com confirmação (derruba tudo e recria imagens)                  |
| `[5]` | Recompilar serviços Java (abre o menu de compilação novamente)                    |
| `[6]` | Apagar todos os volumes persistentes com confirmação (dados do banco, fila, etc.) |
| `[7]` | Sair e derrubar todos os containers (`Ctrl+C` tem o mesmo efeito)                 |

### Observações

- Se a compilação falhar em qualquer serviço, o script exibe o output do erro e interrompe o processo.
- A rede `dac-network` é criada automaticamente caso não exista.
- Volumes Maven são cacheados no volume `masterbank-maven-cache` para evitar download repetido de dependências ao compilar via Docker.
- `Ctrl+C` a qualquer momento executa teardown e derruba os containers limpo.

---
