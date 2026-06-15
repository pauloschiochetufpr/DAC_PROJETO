# Roteiro de estudos — parte do Henrique

| NF | Requisito | Quem |
|----|-----------|------|
| NF03 | Autenticação JWT | Henrique |
| NF07 | SAGA Orquestrada — Autocadastro | Henrique |
| NF12 | Criptografia de senha (BCrypt) | Henrique |

> Foco no **auth-service** (login, token, senha) + a **saga de Autocadastro** (no saga-service).
> Obs: NF13 (DTOs) e NF17 (tratamento de erros) passaram pro **Paulo** — ele é o autor da maioria. Se o professor perguntar do tratamento de erro do **auth** especificamente, você ajuda (você fez parte dele).

---

# Conceitos-base (do zero)

- **Microsserviço**: cada serviço (auth, cliente, conta, gerente, saga) é um app Spring Boot separado, com seu próprio banco e container. O **front só fala com o API Gateway** (Node.js, porta 3000), que valida o token e roteia.
- **Service** (`@Service`) = regra de negócio. **Controller** (`@RestController`) = endpoints HTTP. **DTO** = objeto simples só pra transportar dados (ver NF13).
- **JWT** = "crachá" digital que o usuário recebe ao logar e manda em toda requisição pra provar quem é.
- **BCrypt** = algoritmo de **hash** de senha (transforma a senha num código irreversível pra guardar no banco).
- **MongoDB**: o auth-service usa Mongo (não Postgres) pra guardar usuários.

---

# NF03 — Autenticação JWT

### O que é (explica assim)
Quando o usuário faz login com email/senha, o sistema gera um **token JWT** — um texto cifrado que contém "quem é o usuário" (CPF, papel, email) e uma validade. O usuário guarda esse token e o manda no cabeçalho `Authorization: Bearer <token>` em **toda** requisição protegida. Assim os serviços sabem quem está chamando **sem** pedir senha de novo.

Detalhe técnico do nosso projeto: não é um JWT comum (assinado e legível) — é um **JWE** (JWT **cifrado** com AES-256-GCM). Ou seja, o conteúdo do token é **opaco** (ninguém lê sem a chave secreta).

### Onde está
- Gera/valida o token: `auth-service/service/JwtService.java`
- Usa no login: `auth-service/service/AuthService.java`
- Valida em toda requisição protegida: `gateway/server.js`

### Código — geração do token (`JwtService.generateToken`)
```java
public String generateToken(String cpf, String email, String tipo) throws Exception {
    JWTClaimsSet claims = new JWTClaimsSet.Builder()
            .subject(cpf)                       // quem é (CPF)
            .claim("role", tipo)                // papel: CLIENTE/GERENTE/ADMINISTRADOR
            .claim("email", email)
            .issueTime(new Date())              // quando foi emitido
            .expirationTime(new Date(System.currentTimeMillis() + expiration)) // validade (expira)
            .build();

    JWEHeader header = new JWEHeader(JWEAlgorithm.DIR, EncryptionMethod.A256GCM); // CIFRAGEM AES-256
    EncryptedJWT jwt = new EncryptedJWT(header, claims);
    jwt.encrypt(new DirectEncrypter(getKey()));  // cifra com a chave derivada do secret
    return jwt.serialize();                       // texto opaco que vai pro cliente
}
```
A chave vem do `secret` (no `application.yml`), passado por SHA-256 pra virar uma chave AES de 32 bytes.

### Código — login gera o token (`AuthService`)
```java
// 1) confere a senha (BCrypt - ver NF12)
// 2) gera o token:
String token = jwtService.generateToken(usuario.getCpf(), usuario.getEmail(), usuario.getTipo());
// 3) devolve a resposta no formato exigido pela especificação:
LoginResponseDTO response = new LoginResponseDTO();
response.setAccess_token(token);     // o token
response.setToken_type("bearer");    // tipo do token
response.setTipo(tipo);              // tipo do usuário (CLIENTE/GERENTE/ADMINISTRADOR)
response.setUsuario(usuarioDTO);     // dados básicos do usuário
```

### Código — o Gateway valida o token (`gateway/server.js`)
Em toda rota protegida, o gateway:
```js
// 1) decifra/valida o token (JWE com a mesma chave secreta)
async function validateJwt(token) {
  const key = crypto.createHash("sha256").update(JWT_SECRET).digest();
  const { payload } = await jwtDecrypt(token, key, { contentEncryptionAlgorithms: ["A256GCM"] });
  return payload;
}
// 2) no middleware authenticate:
const authHeader = req.headers["authorization"];          // pega "Bearer <token>"
if (!authHeader) return res.status(401).json({error:"Token ausente"});
const payload = await validateJwt(token);                  // se inválido/expirado -> 401
const role = payload.role.toLowerCase();
// 3) checa se o papel pode acessar a rota (controle de acesso por role)
// 4) injeta a identidade pros microsserviços: x-user-cpf, x-user-role, x-user-email
```

### O que o professor pediria
- **"Onde o token é validado?"** → no **gateway**, antes de chegar no microsserviço (`validateJwt` + `authenticate`).
- **"O que tem dentro do token?"** → CPF (subject), role, email, validade. Mas é **cifrado** (JWE), então não dá pra ler sem a chave.
- **"E se o token expirar?"** → `validateToken`/`validateJwt` lança erro → gateway responde **401**.
- **"Mude a validade do token."** → `jwt.expiration` no `application.yml`.

---

# NF12 — Criptografia de senha (BCrypt)

### O que é
A senha **nunca** é guardada em texto puro. Ela passa por **BCrypt**, que gera um **hash** (código irreversível). No banco fica só o hash. Na hora do login, comparo o hash da senha digitada com o hash guardado — sem nunca "descriptografar" (não dá, é via de mão única).

### Onde está
- Define o encoder: `auth-service/config/SecurityConfig.java`
- Aplica o hash ao criar usuário: `auth-service/service/UsuarioService.java`
- Confere no login: `auth-service/service/AuthService.java`

### Código — o encoder (`SecurityConfig`)
```java
@Configuration
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();   // BCrypt: hash com "salt" embutido
    }
}
```

### Código — aplica o hash ao criar (`UsuarioService.hashIfNeeded`)
```java
public String hashIfNeeded(String senha) {
    if (senha == null || senha.isBlank()) return senha;
    if (senha.matches("^\\$2[aby]\\$.{56}$")) return senha;  // já está em formato bcrypt -> não faz de novo
    return passwordEncoder.encode(senha);                    // transforma a senha em hash
}
```

### Código — confere no login (`AuthService`)
```java
boolean senhaValida = passwordEncoder.matches(senhaInformada, usuario.getSenhaHash());
// matches() re-hasheia a senha digitada e compara com o hash guardado. Nunca "descriptografa".
```

### Detalhe importante (o BCrypt já tem SALT)
A especificação pede "SHA256+SALT". Nós usamos **BCrypt**, que **já inclui um salt aleatório** em cada hash (e é mais forte que SHA256 pra senha). Sei justificar: *"BCrypt é o padrão recomendado pra senhas, já embute salt por hash e é resistente a brute-force; é uma escolha mais segura que SHA256+salt manual."*

### O que o professor pediria
- **"Mostre que a senha não fica em texto puro."** → abrir o MongoDB e mostrar o campo `senhaHash` (um hash `$2a$...`).
- **"Por que não consegue voltar a senha original?"** → hash é via única; no login eu **comparo hashes**, não descriptografo.

---

# NF07 — SAGA Orquestrada: Autocadastro (R1/R10)

### O que é a saga de Autocadastro
É a transação distribuída de **aprovar um cliente**. Quando o gerente aprova, vários serviços precisam agir em conjunto: criar a **conta**, criar o **usuário** de login, escolher o **gerente**. O `saga-service` é o **orquestrador** que coordena tudo.

### Onde está
- `saga-service/service/AutocadastroSagaService.java` (o orquestrador)
- Disparada por: `cliente-service` chama `POST /saga/aprovar` quando o gerente aprova.

### As etapas (decore a ordem)
1. **MS Gerente/Conta**: descobrir o **gerente com menos clientes** (pra atribuir a conta).
2. **MS Conta**: criar a **conta** do cliente.
3. **MS Auth**: criar o **usuário** de login (com uma senha gerada).

### Código — o orquestrador (`AutocadastroSagaService.processarAprovacao`, resumo)
```java
// 1) escolhe o gerente com menos clientes
Map<String,Object> gerente = selecionarGerenteComMenosClientes();
String senhaTemporaria = gerarSenha();

SagaCompensacao compensacao = new SagaCompensacao();   // pilha de "desfazer"
try {
    // 2) ETAPA conta: cria a conta (comando assíncrono via RabbitMQ)
    criarConta(cpf, nome, gerenteCpf, gerenteNome, limite);
    compensacao.registrar("remover conta", () -> removerContaNoConta(cpf));   // como desfazer

    // 3) ETAPA auth: cria o usuário de login
    criarUsuarioNoAuthSincrono(cpf, nome, email, senhaTemporaria);
    compensacao.registrar("remover usuário auth", () -> removerUsuarioNoAuth(cpf));

    publicarUsuarioNoAuth(cpf, nome, email, senhaTemporaria); // evento extra (mensageria)
} catch (RuntimeException e) {
    compensacao.compensar();        // FALHOU: desfaz o que já foi feito (remove conta/usuário)
    publicarEventoSaga("autocadastro.falha", cpf);
    throw e;
}
```

### Compensação (NF8, mas cai junto)
Se uma etapa falhar, a saga **desfaz as anteriores** pela pilha `SagaCompensacao` (ex: se criar o usuário falha depois de criar a conta, ela **remove a conta**). Assim não fica lixo (conta sem usuário).

### Comunicação assíncrona (command/reply)
As etapas conta/auth são feitas por **comando via RabbitMQ** (`commandBus.enviarEAguardar(...)`), não HTTP direto — a comunicação orquestrador↔serviço é assíncrona via broker, mas o método espera a resposta (correlationId) pra continuar.

> ⚠️ Henrique: essa saga teve melhorias de outro integrante (compensação + comunicação assíncrona). Saiba explicar o **fluxo das 3 etapas** e que **se algo falha, a saga reverte** (compensação). Se perguntarem do command/reply, é o mesmo mecanismo das outras sagas (publica comando numa fila, espera a resposta correlacionada).

### O que o professor pediria
- **"Quais serviços participam?"** → gerente (escolher), conta (criar conta), auth (criar usuário).
- **"E se a criação do usuário falhar?"** → a saga **remove a conta** já criada (compensação) e sinaliza falha.
- **"Por que orquestrada?"** → o saga-service é o **coordenador central** que comanda as etapas (não é cada serviço reagindo sozinho = coreografia).
- **"Quando a senha é criada?"** → só na aprovação (a saga gera e manda criar o usuário no auth).

---

# Checklist do Henrique

- [ ] Sei explicar **JWT** (login gera token cifrado JWE; gateway valida em toda requisição; expira).
- [ ] Sei mostrar onde o token é **gerado** (`JwtService`) e **validado** (`gateway/server.js`).
- [ ] Sei explicar **BCrypt** (hash via única, com salt; no login comparo hashes) e justificar vs SHA256.
- [ ] Sei as **3 etapas** da saga de Autocadastro e que **falha → compensação** (remove conta/usuário).
