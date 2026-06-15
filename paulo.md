# Roteiro de estudos — parte do Paulo

| NF | Requisito | Quem |
|----|-----------|------|
| NF01 | Arquitetura de Microsserviços | Paulo |
| NF11 | API Composition | Paulo |
| NF13 | DTOs (não trafegar entidades) | Paulo |
| NF17 | Tratamento global de erros | Paulo |
| NF18 | Infra de reset/reboot para testes | Paulo (orquestração é majoritariamente dele) |

> Paulo é o autor principal do **gerente-service** e da maior parte dos **DTOs** e **tratadores de erro** do projeto.

---

# Conceitos-base (do zero)

- **Microsserviço**: cada serviço (auth, cliente, conta, gerente, saga) é um app **Spring Boot** separado, com seu **próprio banco** e **container Docker**.
- **Service** (`@Service`) = regra de negócio. **Controller** (`@RestController`) = endpoints HTTP. **Repository** = acesso ao banco.
- **DTO** (Data Transfer Object) = classe simples só pra **transportar dados** (ver NF13).
- **Gateway**: ponto único de entrada (Node.js, porta 3000). O front só fala com ele.
- **HTTP vs RabbitMQ**: serviços conversam por **HTTP** (consulta direta) ou **RabbitMQ** (mensageria assíncrona).

---

# NF01 — Arquitetura de Microsserviços

### O que é (explica assim)
Em vez de **um** sistema gigante (monolito), o BANTADS é dividido em **vários serviços pequenos e independentes**, cada um responsável por um pedaço do negócio:
- **auth-service** → login/token (banco MongoDB)
- **cliente-service** → dados dos clientes (banco Postgres `cliente_db`)
- **conta-service** → contas e movimentações (Postgres, com CQRS: `conta_cud_db` + `conta_r_db`)
- **gerente-service** → gerentes (Postgres `gerente_db`)
- **saga-service** → orquestra transações que envolvem vários serviços
- **gateway** (Node.js) → porta única de entrada
- **frontend** (React)

### Como os serviços se comunicam
- **Front → Gateway**: só via HTTP-REST (o front nunca acessa um serviço direto).
- **Gateway → serviços**: HTTP-REST (roteia a requisição pro serviço certo).
- **Serviço → serviço**: por **mensageria (RabbitMQ)** quando é assíncrono (eventos, comandos de saga), ou **HTTP** quando é consulta direta.
- **Cada serviço tem seu banco** e **não acessa o banco do outro** (isolamento).

### Onde isso aparece
A estrutura está no `docker-compose.yml` — cada serviço é um container:
```yaml
services:
  postgres: ...        # banco relacional (vários databases)
  mongo: ...           # banco do auth
  rabbitmq: ...        # broker de mensageria
  auth-service: ...
  cliente-service: ...
  conta-service: ...
  gerente-service: ...
  saga-service: ...
  gateway: ...         # ponto único de entrada
  frontend: ...
```

### Princípios que dá pra citar (caem na defesa)
- **Baixo acoplamento**: serviços independentes; um pode cair sem derrubar os outros.
- **Database per Service**: cada um dono dos seus dados.
- **Padrões usados**: API Gateway, Database per Service, CQRS (no conta), SAGA orquestrada, API Composition.
- **Maturidade de Richardson nível 2**: usamos verbos HTTP (GET/POST/PUT/DELETE) e recursos (URLs tipo `/contas/{n}/saldo`).

### O que o professor pediria
- **"Por que microsserviços e não monolito?"** → escalar e manter cada parte separada; equipes independentes; falha isolada.
- **"Como dois serviços trocam dados sem acessar o banco um do outro?"** → por HTTP (consulta) ou RabbitMQ (evento/mensagem).
- **"Desenhe o fluxo de uma requisição."** → Front → Gateway (valida token, roteia) → microsserviço → (se precisar de outro serviço) HTTP/RabbitMQ → resposta.

---

# NF11 — API Composition

### O que é
Algumas telas precisam de dados **espalhados em vários serviços**. Como cada serviço tem seu banco (e não dá pra fazer `JOIN` entre bancos diferentes), um serviço **compositor** chama os outros e **junta** os dados numa resposta só. É o padrão **API Composition**.

No nosso caso: a **tela do administrador (R15)** precisa, por gerente: dados do gerente + nº de clientes + soma de saldos positivos + soma de saldos negativos. Gerente está no gerente-service; contas/saldos no conta-service. O **gerente-service compõe** isso.

### Onde está
- `gerente-service/service/GerenteService.java` → método `dashboardGerentes()` (a composição)
- Ele consome endpoints de agregação do conta-service: `/contas/saldo-positivo-por-gerente`, `/saldo-negativo-por-gerente`, `/por-gerente/{cpf}`

### Código — a composição (`GerenteService.dashboardGerentes`)
```java
public List<Map<String, Object>> dashboardGerentes() {
    List<DadoGerente> gerentes = listarTodos();                 // 1) pega os gerentes (banco do gerente)

    // 2) pega as somas de saldo por gerente NO CONTA-SERVICE (via HTTP)
    String posJson = httpGet(contaUrl + "/contas/saldo-positivo-por-gerente");
    Map<String,Double> saldoPos = objectMapper.readValue(posJson, ...);
    String negJson = httpGet(contaUrl + "/contas/saldo-negativo-por-gerente");
    Map<String,Double> saldoNeg = objectMapper.readValue(negJson, ...);

    // 3) pra cada gerente, JUNTA tudo num item
    List<Map<String,Object>> dashboard = gerentes.stream().map(g -> {
        Map<String,Object> item = new HashMap<>();
        item.put("gerente", /* cpf, nome, email */);
        // lista de clientes (contas) desse gerente, também do conta-service
        String contasJson = httpGet(contaUrl + "/contas/por-gerente/" + g.getCpf());
        item.put("clientes", objectMapper.readValue(contasJson, ...));
        item.put("saldo_positivo", saldoPos.getOrDefault(g.getCpf(), 0.0));   // dado do conta
        item.put("saldo_negativo", saldoNeg.getOrDefault(g.getCpf(), 0.0));   // dado do conta
        return item;
    }).collect(Collectors.toList());

    // 4) ordena por saldo positivo decrescente (exigência do R15)
    dashboard.sort((a, b) -> Double.compare((Double) b.get("saldo_positivo"), (Double) a.get("saldo_positivo")));
    return dashboard;
}
```

### Como funciona (resuma)
O gerente-service é o **compositor**: ele pega os gerentes do banco dele, **chama o conta-service** (HTTP) pra pegar os saldos/contas por gerente, e **junta tudo** numa lista. Por fim ordena por saldo positivo (regra do R15). Cada serviço continua dono do seu banco — a junção é **na aplicação**, não no banco.

### O que o professor pediria
- **"Por que não um JOIN no banco?"** → são bancos separados (Database per Service); não dá pra fazer JOIN entre eles. Por isso compõe na aplicação.
- **"De onde vem cada pedaço?"** → gerente (gerente-service), saldos/contas (conta-service via HTTP).
- **"Adicione um dado novo no dashboard."** → buscar mais um endpoint do serviço dono e incluir no `item`.

---

# NF13 — DTOs (não trafegar entidades)

### O que é
**DTO (Data Transfer Object)** é uma classe simples, só com campos + getters/setters, usada pra **transportar dados** (na resposta HTTP ou entre serviços). A regra: **nunca mandar a entidade do banco pra fora** — sempre converto a entidade num DTO.

Por quê?
- **Não vazar dados internos** (ex: hash de senha, campos que o cliente não deve ver).
- **Desacoplar** a API do banco: se eu mudar a tabela, não quebro o contrato da API.
- **Moldar a resposta** ao que a tela precisa (ex: juntar nome do gerente + saldo num DTO só).

### Onde está (Paulo é o autor da maioria)
Tem DTO de **request** (entra) e de **response** (sai) em todo serviço. Exemplos do Paulo:
- `conta/dto/response/ContaResponseDTO`, `SaldoResponseDTO`, `ExtratoResponseDTO`, `OperacaoResponseDTO`, `TransferenciaResponseDTO`, `ItemExtratoResponseDTO`
- `conta/dto/request/DepositoRequestDTO`, `SaqueRequestDTO`, `TransferenciaRequestDTO`
- `cliente/dto/response/DadosClienteResponseDTO`
- `gerente/dto/...`: `DadoGerente`, `GerenteResponse`, `GerenteInsercao`, `GerenteAtt`, `ClienteParaAprovar`, `ItemDashboardResponse`

### Código — exemplo de DTO de resposta (`ContaResponseDTO`)
```java
public class ContaResponseDTO {
    private String cliente;        // cpf do cliente
    private String numero;         // número da conta
    private Double saldo;
    private Double limite;
    private String gerente;        // cpf do gerente
    private LocalDateTime criacao;
    // só getters e setters - é uma classe "burra" de transporte
}
```

### Código — exemplo de DTO de request (`DepositoRequestDTO`)
```java
public class DepositoRequestDTO {
    private Double valor;          // o corpo do POST /contas/{n}/depositar é { "valor": 100 }
    // getter/setter
}
```

### Como funciona no fluxo (resuma)
Entidade (objeto do banco) → o **service converte** num DTO → o **DTO** é o que vira JSON na resposta / vai na mensagem. A entidade **nunca** sai do serviço. Ex: o conta tem a entidade `ContaCUD`, mas devolve um `ContaResponseDTO`.

### O que o professor pediria
- **"Por que não devolver a entidade direto?"** → acoplaria a API ao banco e poderia vazar campos internos.
- **"Mostre a conversão entidade → DTO."** → no service, onde monta o `ContaResponseDTO` a partir da `ContaCUD`.
- **"Adicione um campo na resposta."** → novo campo no DTO + setar na conversão.

---

# NF17 — Tratamento global de erros

### O que é
Em vez de cada controller tratar erro do seu jeito, existe **um lugar central** por serviço que captura as exceções de **todos** os endpoints e devolve uma resposta padronizada (status HTTP certo + mensagem JSON). Usa `@RestControllerAdvice` (um "interceptador" global de exceções do Spring).

### Onde está (Paulo fez quase todos)
- `cliente-service/exception/GlobalExceptionHandler.java` (100% Paulo)
- `conta-service/exception/GlobalExceptionHandler.java` (100% Paulo)
- `gerente-service/exception/GlobalExceptionHandler.java` (100% Paulo)
- `auth-service/config/GlobalExceptionHandler.java` (Paulo + Henrique)
- Formato da resposta: `ErrorResponseDTO` em cada serviço

### Código — `GlobalExceptionHandler`
```java
@RestControllerAdvice                                  // captura exceções de TODOS os controllers do serviço
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthenticationException.class)   // se um endpoint lançar essa exceção...
    public ResponseEntity<ErrorResponseDTO> handleAuthentication(AuthenticationException ex) {
        return buildResponse(ex.getStatus(), ex.getMessage());   // ...responde com o status dela (ex: 401)
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponseDTO> handleBadRequest(BadRequestException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());   // 400
    }

    @ExceptionHandler(Exception.class)                 // "rede de segurança": qualquer erro não previsto
    public ResponseEntity<ErrorResponseDTO> handleGeneric(Exception ex) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno do servidor"); // 500 limpo
    }

    private ResponseEntity<ErrorResponseDTO> buildResponse(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new ErrorResponseDTO(status.value(), message));
    }
}
```

### Como funciona / por que é bom
Quando um endpoint lança uma exceção, o Spring **desvia** automaticamente pro `@ExceptionHandler` que casa com o tipo do erro. Vantagens:
- **Não repito try/catch** em todo controller.
- O erro sai sempre no **mesmo formato** (`{ "status": ..., "message": ... }`) — bom pro front.
- O `@ExceptionHandler(Exception.class)` é a **rede de segurança**: qualquer erro inesperado vira um **500 limpo** (sem vazar stacktrace pro cliente).

### O que o professor pediria
- **"Adicione tratamento pra um erro novo."** → criar `@ExceptionHandler(MinhaException.class)` retornando o status desejado.
- **"O que acontece com um erro não previsto?"** → cai no `handleGeneric` → 500 padronizado.
- **"Por que `@RestControllerAdvice`?"** → é global: trata os erros de todos os controllers num lugar só.

---

# NF18 — Infra de Reset/Reboot para testes

### O que é
Um endpoint `POST /reboot` que **zera o sistema** e recria os **dados mock** da especificação, usado antes de rodar o `test_dac`. O **saga-service orquestra** o reset de todos os serviços; **cada serviço executa** o reset do seu próprio banco.

> ⚠️ A **orquestração** (coordenar o reset de todos) é majoritariamente do Paulo (`ResetService`). Por isso é melhor o **Paulo apresentar o reset inteiro** — ele explica tanto a coordenação quanto o resultado. (A execução por serviço — recriar os mocks — teve contribuição de outro integrante, mas o ponto central é a orquestração.)

### Onde está
- `saga-service/service/ResetService.java` → **orquestra** (dispara o reset de todos em paralelo) — Paulo
- `saga-service/controller/RebootController.java` → expõe `POST /reboot`
- Em cada serviço: `listener/RebootListener.java` + `service/DevService.java` → recriam os dados mock

### Código — a orquestração (`ResetService.solicitarResetOrquestrado`)
```java
public void solicitarResetOrquestrado() {
    // dispara o reset de TODOS os serviços em PARALELO
    List<CompletableFuture<Void>> tarefas = List.of(
        CompletableFuture.runAsync(() -> postReset(authUrl    + "/reboot")),
        CompletableFuture.runAsync(() -> postReset(clienteUrl + "/reboot")),
        CompletableFuture.runAsync(() -> postReset(gerenteUrl + "/reboot")),
        CompletableFuture.runAsync(() -> postReset(contaUrl   + "/reboot"))
    );
    CompletableFuture.allOf(tarefas.toArray(new CompletableFuture[0])).join(); // espera TODOS terminarem
}
```

### Código — a execução em cada serviço (`RebootListener` → `DevService`)
```java
@Component
public class RebootListener {
    @Autowired private DevService devService;

    @RabbitListener(queues = "${rabbitmq.fila.reset:saga.reset}", containerFactory = "rabbitListenerContainerFactory")
    public void onReboot(String mensagem) {
        devService.resetComMocks();   // recria os dados mock daquele serviço
    }
}
```

### Como funciona / impacto
Quando chega `POST /reboot`, o `ResetService` dispara o reset em **paralelo** (`CompletableFuture.runAsync`) pra todos os serviços; cada um recria seu banco com os dados mock da especificação. O `.join()` espera todos terminarem antes de responder. É o que zera o sistema antes do `test_dac`.

### O que o professor pediria
- **"Isso é uma saga?"** → **Não.** É só coordenação de resets pra teste; não tem transação de negócio nem compensação.
- **"Por que paralelo?"** → os serviços são independentes, não precisam de ordem; fica mais rápido.

---

# Checklist do Paulo

- [ ] Sei desenhar a **arquitetura** (front → gateway → serviços; cada um com seu banco; HTTP/RabbitMQ entre eles).
- [ ] Sei explicar **API Composition** (juntar dados de vários serviços porque não dá JOIN entre bancos) e mostrar o `dashboardGerentes`.
- [ ] Sei explicar **DTO** (transporte; não trafegar entidade; não vazar senha) e mostrar a conversão.
- [ ] Sei explicar o **GlobalExceptionHandler** (`@RestControllerAdvice` + `@ExceptionHandler` + rede de segurança 500).
- [ ] Sei explicar o **reset** (orquestração em paralelo no `ResetService` + execução por serviço) e que **não é saga**.
