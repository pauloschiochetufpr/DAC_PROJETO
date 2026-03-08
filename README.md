# masterBank — Como executar (Docker & Maven)

Este README descreve os passos para compilar os serviços com Maven, gerenciar os containers Docker do projeto e as obrigações do `docker-compose`.

## Pré-requisitos

- Docker e Docker Compose instalados
- Maven instalado (para compilar serviços Java)

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
