# Roteiro de estudos — minha parte na defesa (Felyppe)

> Vou apresentar os não-funcionais: **Database per Service, CQRS, Mensageria, SAGA orquestrada (3 sagas minhas, SEM autocadastro), Compensação, Comunicação assíncrona (command/reply), API Composition (parcial) e Logging**. (O **reset/reboot** ficou com o Paulo — ver nota no fim.)

---

# PARTE 0 — Conceitos-base (leia isso primeiro, explico do zero)

Antes de qualquer requisito, você precisa entender as "peças" do Spring Boot. Cada serviço (conta, cliente, gerente, auth, saga) é um programa **Spring Boot** (Java). O Spring monta o programa juntando classes anotadas. As principais:

### Injeção de dependência (`@Autowired`, `@Service`, `@Component`, Bean)
Você não dá `new` nas classes principais. O Spring cria os objetos (chamados **Beans**) e "injeta" onde você precisa. Quem marca a classe pra virar Bean: `@Service` (regra de negócio), `@RestController` (endpoints HTTP), `@Component` (genérico), `@Configuration` (configuração).
```java
@Service                                   // Spring cria 1 objeto dessa classe (um Bean)
public class ContaService {
    @Autowired                             // Spring INJETA o repositório aqui (não preciso dar new)
    private ContaCUDRepository contaCUDRepository;
}
```
Pra explicar na defesa: *"o Spring gerencia o ciclo de vida dos objetos; eu só declaro `@Autowired` e ele entrega a dependência pronta"*.

### Entidade (`@Entity`) = uma tabela do banco virada classe Java
Uma **entidade** é uma classe que representa uma **tabela** do banco. Cada atributo = uma coluna. O JPA/Hibernate converte automaticamente objeto ↔ linha da tabela.
```java
@Entity                          // isto é uma tabela
@Table(name = "conta")           // nome da tabela no banco
public class ContaCUD {
    @Id                          // chave primária
    private String numero;
    @Column(name = "cliente_cpf")// vira a coluna cliente_cpf
    private String clienteCpf;
    private Double saldo;        // coluna saldo
    private Double limite;       // coluna limite
    // ... getters e setters
}
```
*"Cada objeto `ContaCUD` é uma linha da tabela `conta`."*

### Repository (`JpaRepository`) = acesso ao banco sem escrever SQL
Um **repository** é uma **interface** que o Spring implementa sozinho. Só de estender `JpaRepository<Entidade, TipoDoId>` você já ganha `save()`, `findById()`, `delete()`, `findAll()`, etc. Dá pra criar consultas só pelo **nome do método** (`findByClienteCpf` → `SELECT ... WHERE cliente_cpf = ?`) ou escrever uma `@Query`.
```java
@Repository
public interface ContaRRepository extends JpaRepository<ContaR, String> {
    Optional<ContaR> findByClienteCpf(String clienteCpf);   // SELECT * FROM conta WHERE cliente_cpf=?
    List<ContaR> findByGerenteCpf(String gerenteCpf);       // SELECT * FROM conta WHERE gerente_cpf=?

    @Query("SELECT c.gerenteCpf, SUM(...) FROM ContaR c GROUP BY c.gerenteCpf") // consulta escrita à mão
    List<Object[]> resumoPorGerente();
}
```
*"Eu nunca escrevo `INSERT`/`SELECT` na mão; o repository gera. Pra casos especiais uso `@Query`."*

### Service = a regra de negócio
O **service** é onde fica a lógica (ex: "saque só se tiver saldo + limite"). Ele usa os repositories pra ler/gravar.

### Controller (`@RestController`) = a porta de entrada HTTP
O **controller** expõe as URLs (endpoints). Recebe a requisição HTTP e chama o service.
```java
@RestController
@RequestMapping("/contas")                 // prefixo das rotas
public class ContaController {
    @PostMapping("/{numero}/depositar")    // POST /contas/123/depositar
    public ResponseEntity<...> depositar(@PathVariable String numero, @RequestBody DepositoRequestDTO req) {
        return ResponseEntity.ok(contaService.depositar(numero, req)); // delega pro service
    }
}
```

### DTO = objeto que "viaja" (nunca a entidade)
**DTO (Data Transfer Object)** é uma classe simples só pra **transportar dados** (entre serviços, ou na resposta HTTP). A especificação proíbe mandar a entidade (objeto do banco) pra fora — então uso DTOs. Ex: `DepositoRequestDTO` (entra), `ContaResponseDTO` (sai), `ContaAtualizadaEvento` (vai numa fila).

### Listener (`@RabbitListener`) = "ouvinte" de fila
Um **listener** é um método que fica **escutando uma fila** do RabbitMQ. Quando chega mensagem, ele roda automaticamente.
```java
@RabbitListener(queues = "conta.atualizada")     // escuta essa fila
public void onContaAtualizada(ContaAtualizadaEvento evento) { /* roda quando chega mensagem */ }
```

### Datasource = a "configuração de conexão" com um banco
Um **datasource** é o objeto que sabe **como conectar num banco** (URL, usuário, senha, driver). É a "ficha de conexão". No `application.yml` eu defino os dados; no Java o Spring monta o `DataSource` a partir disso.
```yaml
# application.yml do conta-service
spring:
  datasource:                                          # banco de ESCRITA (CUD)
    jdbc-url: jdbc:postgresql://postgres:5432/conta_cud_db
    username: dac
    password: dac
  datasource-read:                                     # banco de LEITURA (R)
    jdbc-url: jdbc:postgresql://postgres:5432/conta_r_db
    username: dac
    password: dac
```
*"O datasource é o que diz em qual banco o serviço conecta. O conta tem DOIS (um pra escrita, outro pra leitura)."*

### EntityManager e TransactionManager (importante pro CQRS)
- **EntityManager**: é o objeto do JPA que **executa as operações** no banco (salvar, buscar). Cada banco tem o seu.
- **TransactionManager**: controla a **transação** — o conjunto de operações que tem que dar certo "tudo ou nada". Ele decide quando faz `commit` (confirma) ou `rollback` (desfaz). Cada banco tem o seu.

Por que isso importa? Porque o conta tem **2 bancos**. Pra o Spring saber "esse repositório grava no banco A e aquele no banco B", cada banco precisa do **seu próprio** EntityManager e TransactionManager. É isso que as classes `DataSourceConfig` (escrita) e `DataSourceReadConfig` (leitura) montam.

### `@Transactional` = "tudo ou nada"
Quando um método tem `@Transactional`, tudo que ele grava no banco só é **confirmado no final**. Se o método **lançar uma exceção**, o Spring faz **rollback** (desfaz tudo). Eu uso isso como **compensação** nas sagas (se a saga falha e lança erro, o que o serviço gravou é desfeito sozinho).

### Termos do RabbitMQ (mensageria)
- **Broker**: o RabbitMQ em si, o "correio" entre serviços.
- **Producer (produtor)**: quem **publica** a mensagem.
- **Exchange**: o "roteador" que recebe a mensagem e decide pra qual fila mandar.
- **Routing key**: a "etiqueta" da mensagem; o exchange usa ela pra rotear.
- **Binding**: a "regra" que liga um exchange a uma fila (ex: "mande tudo com key `comando.conta.*` pra fila X").
- **Queue (fila)**: onde a mensagem fica esperando ser consumida.
- **Consumer (consumidor)**: o `@RabbitListener` que lê a fila e processa.

Fluxo: **producer → exchange → (binding/routing key) → fila → consumer**.

---

# NF4 — Database per Service (cada serviço com seu banco)

### O que é e por que existe
Cada microsserviço tem seu **próprio banco**, e **nenhum acessa o banco do outro**. Isso é "isolamento": o conta-service é o **único** dono dos dados de conta. Se precisar de um dado de cliente, ele **não faz query no banco do cliente** — recebe o dado na requisição ou por mensagem.

### Onde está
Os bancos são criados por scripts SQL, montados no Postgres pelo docker-compose:
```yaml
# docker-compose.yml — o Postgres roda os scripts na primeira subida
volumes:
  - ./services/cliente-service/.../create-cliente-db.sql:/docker-entrypoint-initdb.d/01-create-cliente-db.sql
  - ./services/gerente-service/.../create-gerente-db.sql:/docker-entrypoint-initdb.d/02-create-gerente-db.sql
  - ./services/conta-service/.../create-conta-db.sql:/docker-entrypoint-initdb.d/03-create-conta-db.sql
```
```sql
-- create-conta-db.sql: o conta tem DOIS bancos (CQRS)
CREATE DATABASE conta_cud_db;   -- escrita
CREATE DATABASE conta_r_db;     -- leitura
```
Resultado: `cliente_db`, `gerente_db`, `conta_cud_db`, `conta_r_db` no Postgres, e `auth_db` no MongoDB.

### COMO PROVAR que o conta NÃO acessa o banco do cliente (o professor pode pedir)
O caminho da prova é em 3 lugares:

**1) O `application.yml` do conta só conecta nos bancos DELE** (não tem conexão pro `cliente_db`):
```yaml
spring:
  datasource:        jdbc-url: ...conta_cud_db   # só conta
  datasource-read:   jdbc-url: ...conta_r_db     # só conta
```

**2) O `ContaService` só injeta repositórios DE CONTA** (não existe um `ClienteRepository` aqui):
```java
@Service
public class ContaService {
    @Autowired private ContaCUDRepository contaCUDRepository;       // banco conta_cud_db
    @Autowired private ContaRRepository contaRRepository;           // banco conta_r_db
    @Autowired private MovimentacaoCUDRepository movimentacaoCUDRepository;
    @Autowired private MovimentacaoRRepository movimentacaoRRepository;
    @Autowired private RabbitTemplate rabbitTemplate;
    // NÃO existe nenhum repositório/conexão de cliente_db ou gerente_db aqui
}
```

**3) Quando o conta precisa de um dado de cliente, ele RECEBE o dado**, não busca no banco do cliente. Ex: ao criar a conta, o nome do cliente vem **dentro do pedido** (`CriarContaRequestDTO`), mandado pela saga:
```java
public ContaResponseDTO criarConta(CriarContaRequestDTO request) {
    String clienteNome = request.getClienteNome();   // veio NA requisição, não de query no cliente_db
    ...
}
```
*"Está provado nos 3 níveis: a config não conecta no banco do cliente; o service não injeta repo de cliente; e o dado de cliente chega por parâmetro/mensagem."*

### Lógica / impacto
Isolamento = baixo acoplamento. Se o banco do cliente cair, o conta continua funcionando com os dados que tem. É a base do CQRS (que usa 2 bancos).

---

# NF5 + NF6 — CQRS no conta-service (meu carro-chefe)

**CQRS = Command Query Responsibility Segregation.** Separo **escrita** (Command) de **leitura** (Query) em **dois bancos diferentes**:
- `conta_cud_db` (CUD = Create/Update/Delete) → toda **escrita**.
- `conta_r_db` (R = Read) → toda **leitura**.
Os dois são mantidos sincronizados — e a especificação exige que a sincronização seja por **mensageria** (RabbitMQ).

### Os 2 modelos (entidades) são separados
Tem uma entidade pra escrita e outra (igual, mas separada) pra leitura.

**Entidade de ESCRITA** — `entity/ContaCUD.java` (mapeia a tabela `conta` no `conta_cud_db`):
```java
@Entity
@Table(name = "conta")
public class ContaCUD {
    @Id private String numero;
    @Column(name="cliente_cpf") private String clienteCpf;
    private Double saldo;
    private Double limite;
    // ... getters/setters
}
```

**Entidade de LEITURA** — `read/entity/ContaR.java` (mapeia a tabela `conta` no `conta_r_db`). É uma classe **separada**, no pacote `read`, pra ficar claro que é o modelo de leitura.

### As configs que ligam cada repositório ao banco certo
Aqui está o pulo do gato do CQRS: cada banco precisa do **seu** EntityManager + TransactionManager. A classe abaixo configura o lado da **leitura**.

`config/DataSourceReadConfig.java`:
```java
@Configuration
@EnableJpaRepositories(
    basePackages = "com.dac.conta.read.repository",   // os repos DESTE pacote usam o banco de leitura
    entityManagerFactoryRef = "readEntityManagerFactory",
    transactionManagerRef   = "readTransactionManager"
)
public class DataSourceReadConfig {

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource-read") // lê a config 'datasource-read' do yml -> conta_r_db
    public DataSource readDataSource() {
        return DataSourceBuilder.create().build();              // monta a conexão com o banco de leitura
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean readEntityManagerFactory(
            @Qualifier("readDataSource") DataSource readDataSource) {
        var em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(readDataSource);                       // este EntityManager fala com o banco de leitura
        em.setPackagesToScan("com.dac.conta.read.entity");      // e enxerga só as entidades de leitura (ContaR...)
        return em;
    }

    @Bean
    public PlatformTransactionManager readTransactionManager(EntityManagerFactory readEmf) {
        return new JpaTransactionManager(readEmf);              // controla commit/rollback do banco de leitura
    }
}
```
A `config/DataSourceConfig.java` é o **espelho** disso pro banco de **escrita** (`conta_cud_db`); ela é marcada com `@Primary` (é o datasource "padrão"). Resumo: **2 datasources, 2 EntityManagers, 2 TransactionManagers** — é isso que faz `ContaCUDRepository` gravar no `conta_cud_db` e `ContaRRepository` no `conta_r_db`.

### Como a escrita atualiza a leitura (o coração do CQRS)
Toda operação de escrita no `ContaService` (depósito, saque, etc.) faz 3 coisas em sequência:
```java
contaCUDRepository.save(conta);   // 1) grava no banco de ESCRITA (CUD)
sincronizarContaR(conta);         // 2) atualiza o banco de LEITURA na hora (síncrono) - garantia
publicarEventoConta(conta);       // 3) publica EVENTO no RabbitMQ (sincronização por mensageria)
```

O passo 3 cria um **DTO de evento** e joga numa fila. `publicarEventoConta`:
```java
private void publicarEventoConta(ContaCUD conta) {
    ContaAtualizadaEvento evento = new ContaAtualizadaEvento();  // DTO que vai viajar na fila
    evento.setNumero(conta.getNumero());
    evento.setSaldo(BigDecimal.valueOf(conta.getSaldo()));
    evento.setLimite(BigDecimal.valueOf(conta.getLimite()));
    evento.setStatus("aprovado");
    rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_CONTA_ATUALIZADA, evento); // PUBLICA na fila conta.atualizada
}
```

E o **listener** escuta essa fila e grava no banco de leitura — `listener/ContaEventoListener.java`:
```java
@RabbitListener(queues = RabbitMQConfig.FILA_CONTA_ATUALIZADA,   // escuta a fila 'conta.atualizada'
                containerFactory = "rabbitListenerContainerFactory")
public void onContaAtualizada(ContaAtualizadaEvento evento) {    // roda quando chega o evento
    ContaR contaR = contaRRepository.findById(evento.getNumero()).orElse(new ContaR());
    contaR.setSaldo(evento.getSaldo());
    contaR.setLimite(evento.getLimite());
    contaRRepository.save(contaR);     // grava no banco de LEITURA (conta_r_db)
}
```

### De onde vem o SALDO quando o cliente consulta (decore!)
**Toda leitura vem do banco R.** Ex: `consultarSaldo` usa o `contaRRepository`:
```java
public SaldoResponseDTO consultarSaldo(String numero) {
    return contaRRepository.findById(numero)   // LÊ do banco de leitura (conta_r_db)
        .map(conta -> { ... })
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta não encontrada"));
}
```

### A lógica completa (resuma assim)
- **Escreveu** (depósito/saque/transferência) → grava no `conta_cud_db` → manda evento → o listener atualiza o `conta_r_db`.
- **Leu** (saldo/extrato/conta por cliente) → sempre do `conta_r_db`.
- A sincronização **por mensageria** é o `publicarEventoConta` + `ContaEventoListener` (é o que a especificação exige). Tenho também o `sincronizarContaR` síncrono em paralelo, como **garantia** de que o teste (que consulta na hora) não pegue dado atrasado — é decisão minha de robustez.

### O que o professor pediria pra alterar (PREPARE-SE!)
- **"Adicione um campo `agencia` na conta e garanta que aparece na consulta."** Passos: criar o campo em `ContaCUD` **e** em `ContaR`; adicionar no `ContaAtualizadaEvento`; setar no `sincronizarContaR` **e** no `ContaEventoListener`. (Mostra que entende que escrita e leitura são modelos separados que precisam sincronizar.)
- **"Por que 2 bancos?"** → escala/otimização: o banco de leitura pode ser desnormalizado e otimizado pra consulta, sem atrapalhar a escrita.
- **"E se a mensagem de sincronização falhar?"** → o banco R ficaria atrasado; por isso tenho o sync síncrono de garantia, e o listener tem try/catch que relança a exceção pra mensagem ser reprocessada.

### Impacto
Sustenta R3, R5, R6, R7, R8 (saldo, operações, extrato). Se a sincronização quebrar, o cliente deposita mas o saldo não atualiza na tela.

---

# NF10 — Mensageria (RabbitMQ)

### Como funciona
RabbitMQ é o **broker** (correio). Um serviço **publica** num **exchange** com uma **routing key**; o exchange, pela regra do **binding**, entrega na **fila**; quem tem `@RabbitListener` naquela fila **consome**. As mensagens viajam como **JSON** (configurei o `Jackson2JsonMessageConverter`), então um objeto/`Map` vira JSON e volta a objeto do outro lado.

### Onde está (com código)
A topologia (filas/exchanges/bindings) fica nos `RabbitMQConfig`. Exemplo de declaração de uma fila no `conta-service/config/RabbitMQConfig.java`:
```java
public static final String FILA_CONTA_ATUALIZADA = "conta.atualizada";

@Bean
public Queue filaContaAtualizada() {        // declara a fila 'conta.atualizada'
    return new Queue(FILA_CONTA_ATUALIZADA, true);  // 'true' = durável (sobrevive a restart)
}

@Bean
public MessageConverter messageConverter() {
    return new Jackson2JsonMessageConverter();  // faz objeto <-> JSON nas mensagens
}
```
Quem **publica** é o `ContaService.publicarEventoConta` (visto acima, `rabbitTemplate.convertAndSend(...)`). Quem **consome** é o `ContaEventoListener` (o `@RabbitListener`).

### O que o professor pediria
- **"Crie uma nova fila/evento."** → declarar `@Bean Queue` (e `@Bean Binding` se usar exchange) no `RabbitMQConfig`, criar o `@RabbitListener` que consome, e publicar com `rabbitTemplate.convertAndSend(...)`.
- **"Exchange Topic × Direct?"** → uso **Topic** (routing key com curingas `#`/`*`, ex: `comando.conta.#`). Direct casa a key exata.
- **"Mostre uma mensagem trafegando."** → abrir o console do RabbitMQ (`localhost:15672`, user/senha `guest`) e mostrar as filas com mensagens/consumers.

### Impacto
É a espinha dorsal: sincroniza o CQRS e conecta as sagas aos serviços.

---

# NF7 — SAGA Orquestrada (minhas 3 sagas)

**SAGA** = uma transação que envolve **vários serviços/bancos**. Como não existe um "commit único" entre bancos diferentes, a saga faz **etapas** (uma em cada serviço) e, se alguma falhar, **desfaz** as anteriores (compensação). **Orquestrada** = tem um **coordenador central** (o `saga-service`) que comanda as etapas — diferente de **coreografada**, onde cada serviço reagiria a eventos sozinho, sem coordenador.

### Quem dispara as sagas — `saga-service/controller/SagaOperacoesController.java`
```java
@RestController
@RequestMapping("/saga")
public class SagaOperacoesController {
    @PostMapping("/alterar-perfil")
    public ResponseEntity<?> alterarPerfil(@RequestBody Map<String,Object> body) {
        alteracaoPerfilSaga.executar((String) body.get("cpf"), /* novoSalario */ ...);
        return ResponseEntity.ok(Map.of("status", "perfil_atualizado"));
    }
    @PostMapping("/inserir-gerente") public ... { insercaoGerenteSaga.executar(cpf, nome, email, senha, tipo); }
    @PostMapping("/remover-gerente") public ... { remocaoGerenteSaga.executar(cpf); }
}
```
Os serviços `cliente-service` (perfil) e `gerente-service` (inserir/remover) fazem um **POST HTTP** pra essas rotas pra iniciar a saga.

## SAGA 1 — Alteração de Perfil (R4)
**Etapas:** (1) o cliente-service altera os dados do cliente; (2) a saga manda o conta-service recalcular o limite.

`saga-service/service/AlteracaoPerfilSagaService.java`:
```java
public void executar(String cpf, Double novoSalario) {
    publicarEvento("perfil.iniciada", cpf, novoSalario);    // evento de acompanhamento
    try {
        Map<String,Object> payload = new HashMap<>();
        payload.put("clienteCpf", cpf);
        payload.put("novoSalario", novoSalario);
        // ETAPA conta: manda recalcular o limite, via comando assíncrono no RabbitMQ
        commandBus.enviarEAguardar("comando.conta.limite", "atualizar_limite", payload);
    } catch (Exception e) {
        publicarEvento("perfil.falha", cpf, novoSalario);
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "..."); // propaga -> cliente faz rollback
    }
    publicarEvento("perfil.concluida", cpf, novoSalario);
}
```
**Fluxo:** `cliente-service.atualizarPerfil` altera os dados do cliente (no banco dele) e chama `POST /saga/alterar-perfil`. A saga manda o conta recalcular o limite. **Compensação:** se o recálculo falhar, a saga lança erro; como o `atualizarPerfil` do cliente é `@Transactional`, a alteração dos dados do cliente é **desfeita automaticamente** (rollback). 
> Regra do limite (no conta): se salário ≥ 2000, limite = salário/2; se o saldo está negativo e o novo limite ficaria menor que o saldo negativo, o limite vira o valor do saldo negativo.

## SAGA 2 — Inserção de Gerente (R17)
**Etapas:** (1) gerente-service insere o gerente; (2) a saga cria o usuário no auth; (3) a saga acha o gerente com **MAIS** contas e transfere **1 conta** pro novo gerente.

`saga-service/service/InsercaoGerenteSagaService.java`:
```java
SagaCompensacao compensacao = new SagaCompensacao();   // pilha de "desfazer"
try {
    // ETAPA auth: cria o usuário do gerente
    criarUsuarioNoAuth(cpf, nome, email, senha, tipoNorm);
    compensacao.registrar("remover usuário auth", () -> removerUsuarioNoAuth(cpf)); // como desfazer essa etapa

    // ETAPA conta: transfere 1 conta do gerente com mais contas pro novo
    if ("gerente".equals(tipoNorm)) {
        redistribuirContaParaNovoGerente(cpf, nome);
    }
} catch (Exception e) {
    compensacao.compensar();   // deu erro: desfaz o que já foi feito (remove o usuário criado)
    throw ...;                 // propaga -> gerente-service faz rollback do registro do gerente
}
```
Como ela escolhe a conta a transferir (dentro de `redistribuirContaParaNovoGerente`):
```java
// pergunta ao conta quantas contas cada gerente tem (comando)
RespostaComando resp = commandBus.enviarEAguardar("comando.conta.consultar-contagem", "consultar_contagem", ...);
long maxContas = ...;                                   // maior nº de contas
if (maxContas <= 1 && contagem.size() == 1) return;     // 1º/único gerente -> novo fica sem conta
// origem = gerente com MAIS contas (empate: menor CPF). Transfere quantidade=1
commandBus.enviarEAguardar("comando.conta.redistribuir", "redistribuir", payload /* quantidade=1 */);
```

## SAGA 3 — Remoção de Gerente (R18)
**Etapas:** (1) acha o gerente com **MENOS** contas; (2) transfere **TODAS** as contas do removido pra ele; (3) gerente-service remove o gerente.

`saga-service/service/RemocaoGerenteSagaService.java`:
```java
// 1) pega a contagem de contas por gerente (comando ao conta)
RespostaComando resp = commandBus.enviarEAguardar("comando.conta.consultar-contagem", "consultar_contagem", ...);
contagem.remove(gerenteRemovidoCpf);                    // tira o que está sendo removido
if (contagem.isEmpty()) { ...; return; }                // não há outro gerente

// 2) destino = gerente com MENOS contas
String destino = contagem.entrySet().stream().min(Map.Entry.comparingByValue())...;
String nomeDestino = buscarNomeGerente(destino);        // comando ao gerente pra pegar o nome
// 3) transfere TODAS (quantidade = -1)
commandBus.enviarEAguardar("comando.conta.redistribuir", "redistribuir", payload /* quantidade=-1 */);
```
**Fluxo:** `gerente-service.remover` valida (não pode remover o último gerente), chama `POST /saga/remover-gerente`, e **só depois** que a saga redistribui é que ele deleta o gerente. **Compensação:** a redistribuição roda **antes** da deleção; se falhar, a exceção propaga e o gerente **não é deletado** (compensação por "gating" = aborta antes da ação destrutiva).

### O que o professor pediria pra alterar (PREPARE-SE!)
- **"Na inserção, transfira do gerente com MENOS contas."** → inverter o critério em `redistribuirContaParaNovoGerente` (trocar o `max` por `min`).
- **"E se a etapa 2 falhar?"** → mostrar a pilha `SagaCompensacao` e o `throw` que dispara o rollback transacional.
- **"Adicione uma etapa nova."** → mais um `commandBus.enviarEAguardar(...)` + registrar a compensação dela.
- **"Por que orquestrada e não coreografada?"** → tenho um **coordenador central** (saga-service) que decide a ordem das etapas e as compensações; na coreografada não haveria coordenador, cada serviço reagiria a eventos.

### Impacto
São R4, R17 e R18. A compensação evita inconsistência (gerente criado sem conta, conta órfã, etc.).

---

# NF8 — Compensação de etapas (rollback)

Como não existe transação única entre bancos diferentes, eu "desfaço" manualmente as etapas já feitas se a saga falhar no meio.

### A pilha de compensação — `saga-service/util/SagaCompensacao.java`
```java
public class SagaCompensacao {
    private final Deque<Acao> acoes = new ArrayDeque<>();   // pilha (LIFO)

    public void registrar(String descricao, Runnable undo) {  // cada etapa registra COMO se desfazer
        acoes.push(new Acao(descricao, undo));
    }
    public void compensar() {                  // executa os "desfazer" de trás pra frente
        while (!acoes.isEmpty()) {
            Acao acao = acoes.pop();           // pega o último registrado primeiro
            try { acao.undo.run(); }           // roda a reversão
            catch (Exception e) { System.err.println("falha ao compensar: " + e.getMessage()); }
        }
    }
}
```
É uma **pilha**: a última etapa feita é a primeira a ser desfeita (igual desempilhar).

### Os 3 tipos de compensação que eu uso (sei explicar a diferença!)
1. **Pilha explícita** (`SagaCompensacao`) — inserção de gerente: se a transferência de conta falha, **remove o usuário** que já tinha sido criado no auth.
2. **Rollback transacional local** (`@Transactional`) — alteração de perfil: se a saga lança erro, o `@Transactional` do cliente **desfaz** a alteração dos dados do cliente sozinho.
3. **Gating (abortar antes do destrutivo)** — remoção de gerente: só deleto o gerente **depois** que a redistribuição deu certo; se ela falha, nem deleto.

### O que o professor pediria
- **"Force uma falha e mostre o rollback."** → derrubar o conta-service e tentar inserir gerente: a compensação remove o usuário criado no auth e o gerente é revertido.
- **"Adicione compensação a uma etapa."** → após a etapa: `compensacao.registrar("desc", () -> desfazerX())`.

### Impacto
Garante **consistência** na transação distribuída (sem deixar lixo pela metade).

---

# NF9 — Comunicação assíncrona via broker (command/reply)

### O problema que resolve
A especificação exige que a saga fale com os serviços de forma **assíncrona via RabbitMQ** (não HTTP direto). Mas o **teste é síncrono** (chama e já confere o resultado). Minha solução: **command/reply com correlationId** — a comunicação entre serviços é 100% por filas, mas o método da saga **bloqueia** esperando a resposta, então quem chamou recebe o resultado pronto.

### O barramento — `saga-service/bus/SagaCommandBus.java`
```java
public RespostaComando enviarEAguardar(String routingKey, String tipo, Map<String,Object> payload) {
    String correlationId = UUID.randomUUID().toString();      // id único pra casar pergunta/resposta
    CompletableFuture<RespostaComando> futuro = new CompletableFuture<>(); // "promessa" de resposta
    pendentes.put(correlationId, futuro);                     // guarda o aguardo indexado pelo id
    try {
        Map<String,Object> comando = Map.of("correlationId", correlationId, "tipo", tipo, "payload", payload);
        rabbitTemplate.convertAndSend(COMANDO_EXCHANGE, routingKey, comando); // PUBLICA o comando na fila
        RespostaComando resp = futuro.get(TIMEOUT_MS, MILLISECONDS);          // BLOQUEIA até a resposta chegar (máx 10s)
        if (!resp.isSucesso()) throw new RuntimeException("Comando falhou: " + resp.getErro());
        return resp;
    } finally { pendentes.remove(correlationId); }
}

public void completar(RespostaComando resposta) {             // chamado quando a resposta chega
    CompletableFuture<RespostaComando> f = pendentes.get(resposta.getCorrelationId());
    if (f != null) f.complete(resposta);                      // LIBERA o método que estava bloqueado
}
```

### O serviço executa o comando e responde — `conta-service/listener/ComandoContaListener.java`
```java
@RabbitListener(queues = RabbitMQConfig.FILA_COMANDO_CONTA, containerFactory = "rabbitListenerContainerFactory")
public void onComando(Map<String,Object> msg) {
    String tipo = (String) msg.get("tipo");
    Map<String,Object> resposta = new HashMap<>();
    resposta.put("correlationId", msg.get("correlationId"));   // devolve o MESMO id
    try {
        switch (tipo) {                                        // decide o que fazer pelo 'tipo'
            case "criar_conta":       ...; break;
            case "atualizar_limite":  ...; break;
            case "redistribuir":      ...; break;
            case "consultar_contagem": dados.put("contagem", contaService.contagemPorGerente()); break;
        }
        resposta.put("sucesso", true); resposta.put("dados", dados);
    } catch (Exception e) { resposta.put("sucesso", false); resposta.put("erro", e.getMessage()); }
    rabbitTemplate.convertAndSend(RESPOSTA_EXCHANGE, "resposta.conta", resposta); // RESPONDE na fila de resposta
}
```
E o `RespostaSagaListener` escuta a fila `saga.resposta.queue` e chama `bus.completar(resposta)`, que libera o `CompletableFuture`.

### O ciclo completo (decore essa sequência)
1. Saga chama `enviarEAguardar(...)` → cria `correlationId` + `CompletableFuture`, publica o **comando** na fila e **trava** no `futuro.get(timeout)`.
2. O serviço consome o comando, executa, e publica a **resposta** com o **mesmo** `correlationId`.
3. O `RespostaSagaListener` recebe a resposta e completa o future → o `enviarEAguardar` **destrava** e devolve o resultado.
4. Se a resposta não chega em 10s → **timeout** → exceção → a saga compensa.

### O que o professor pediria
- **"Adicione um novo tipo de comando."** → novo `case` no listener + chamar `commandBus.enviarEAguardar("comando.X.y", "meu_tipo", payload)`.
- **"E se o serviço não responder?"** → o `futuro.get(TIMEOUT_MS)` estoura → vira erro → compensação.
- **"Se o método espera, por que é assíncrono?"** → a **comunicação entre serviços** é por filas RabbitMQ (desacoplada); o bloqueio é só pra encaixar no teste síncrono. O `correlationId` é o que casa a pergunta com a resposta certa.

### Impacto
É o que deixa a comunicação saga↔serviços **assíncrona via broker** (exigência), sem quebrar os testes síncronos.

---

# NF11 — API Composition (minha parte)

### O que é
A tela do **administrador (R15)** precisa, por gerente: nº de clientes e soma dos saldos positivos/negativos. Esses dados estão **espalhados** (gerente no gerente-service, contas/saldos no conta-service). **API Composition** = juntar dados de vários serviços numa resposta só. Minha parte são os endpoints de **agregação por gerente** no conta.

### Onde está (com código)
A query agregada fica no repositório, e o service só formata. Ex `ContaService.saldoPositivoPorGerente()`:
```java
public Map<String, Double> saldoPositivoPorGerente() {
    List<Object[]> rows = contaCUDRepository.somarSaldosPositivosPorGerente(); // GROUP BY gerente no banco
    Map<String, Double> resultado = new HashMap<>();
    for (Object[] row : rows)                       // row[0]=cpf do gerente, row[1]=soma
        resultado.put((String) row[0], ((Number) row[1]).doubleValue());
    return resultado;                                // { "cpfGerente": somaSaldoPositivo, ... }
}
```
O controller expõe isso em `/contas/saldo-positivo-por-gerente`. O gerente-service/admin consome esses endpoints e junta com os dados de gerente pra montar o dashboard. *(A junção final tem partes de colega — por isso "parcialmente".)*

### O que o professor pediria
- **"Some também por estado."** → nova `@Query` com `GROUP BY estado` + novo método/endpoint, no mesmo padrão.

---

# NF18 — Logging no Gateway (extra meu)

### O que é
Um **middleware** do Express (gateway Node.js) é uma função que roda em **toda requisição** que passa pelo gateway. O meu loga entrada e saída de cada chamada.

### Código — `gateway/middlewares/logger.js`
```js
const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  // loga a ENTRADA: método, URL e IP mascarado
  const requestLog = `[INFO] ${getTimestamp()} ${req.method} ${req.originalUrl} IP:${maskIp(req.ip)}\n`;
  console.log(requestLog.trim());  writeLog(requestLog);

  res.on("finish", () => {                  // quando a RESPOSTA termina de ser enviada
    const duration = Date.now() - start;    // tempo total
    const responseLog = `[INFO] ${getTimestamp()} ${req.method} ${req.originalUrl} STATUS:${res.statusCode} TIME:${duration}ms\n`;
    console.log(responseLog.trim());  writeLog(responseLog);
  });
  next();   // deixa a requisição seguir pro próximo passo
};
```
Grava em `logs/access.log` e no console. O `maskIp` esconde o último número do IP (privacidade). Uso `res.on('finish')` pra logar a resposta só depois de enviada e medir o tempo total.

### O que o professor pediria
- **"Logue também o usuário."** → ler o header/token e incluir no log.

---

# NF18 (reset/reboot) — NÃO é minha apresentação (foi pro Paulo)

O **reset/reboot** ficou com o **Paulo**: a **orquestração** (coordenar o reset de todos os serviços, no `ResetService`) é majoritariamente dele, então ele apresenta o tópico inteiro. Eu fiz a **execução por serviço** (o `RebootListener` + `DevService` que recriam os mocks em cada serviço), então se o professor perguntar especificamente "como cada serviço recria os dados", eu ajudo — mas a apresentação é do Paulo.

---

# Checklist de prontidão (revise antes de apresentar)

- [ ] Sei explicar do zero: entidade, repository, service, controller, DTO, listener, datasource, EntityManager/TransactionManager.
- [ ] Sei mostrar os **2 bancos** do CQRS e provar o **isolamento** (conta não acessa banco do cliente).
- [ ] Sei o caminho da **sincronização** CUD→R (escrita → evento → `ContaEventoListener` → banco R).
- [ ] Sei de onde vem o **saldo** numa consulta (`contaRRepository`, banco R).
- [ ] Sei explicar as **3 sagas** (etapas + compensação de cada) sem olhar.
- [ ] Sei a diferença **orquestrada × coreografada** (tenho coordenador central).
- [ ] Sei o **command/reply** (correlationId + CompletableFuture + timeout).
- [ ] Sei os **3 tipos de compensação** (pilha, transacional, gating).
- [ ] Sei abrir o **console do RabbitMQ** (`localhost:15672`) e mostrar as filas.
