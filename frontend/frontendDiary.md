# FrontEnd Master Bank

## Hooks

- Token (Auth)

## Pages

- Home
  - Gerente
  - Administrador
  - Cliente

- Login (Geral)

- Perfil (Cliente)
- Página de transações (Cliente)
- Página de transferência (Transações -> Transferência) (Cliente)

- Crud de gerente (Administrador)

## Components

- Extrato (componente da Home Cliente)

- Consulta geral de clientes (Componente da Home Gerente)
- Consultar cliente especifico com pesquisa por cpf (Componente da Home Gerente)
- Consultar 3 melhores clientes (Componente da Home Gerente)

- Relatório de clientes (Componente da Home Administrador)

## Security

### Tokens (definição, conteúdo e tempo de vida)

- **Access Token (rotativo, JWT)**
  - Vida: **~4 minutos** (curto). Em cookies.
  - Conteúdo (claims): `sub` (userId), `role`, `jti` (token id), `tokenVersion`, `deviceId`, `iat`, `exp`.
  - Uso: autorização para chamadas API; sempre validado pelo gateway (assinatura via JWKS + `exp`/`iat`).

- **Refresh Token (rotativo, server-tracked)**
  - Vida: janela deslizante (ex.: sliding **30 dias**), com **absolute max** (ex.: 90 dias).
  - Armazenamento cliente: `HttpOnly` + `Secure` + `SameSite=strict` cookie (web).
  - Conteúdo (do lado cliente): token opaco com `refreshId`; server mantém registro com `refreshId`, `userId`, `deviceId`, `issuedAt`, `lastUsedAt`, `expiresAt`, `revoked`.
  - Rotação: a cada uso o servidor emite um novo `refresh` e invalida o anterior (one‑time‑use), para detectar replay.

- **Registro de Dispositivo / Session Record (server-side)**
  - Estrutura: `deviceId`, `deviceName`, `firstSeen`, `lastSeen`, `ipLast`, `revoked`, `blacklisted`.
  - Ligações: cada `refreshId` referencia um `deviceId` e uma `sessionId`.

### Lógica de segurança e quando exigir senha (reautenticação)

Regras que forçam reautenticação por senha:

1. **Refresh expirado (sliding window)**

- Se o `refresh` expirou (lastUsed + sliding TTL > limite) → exigir senha.

2. **Absolute max expirado**

- Se o tempo total de sessão ultrapassa o `absolute max` → exigir senha para nova sessão.

3. **Device mismatch**

- Se o `refresh` recebido não corresponde ao `deviceId` registrado (fingerprint/IP/userAgent incompatível) → bloquear e exigir reauth.
- Ação imediata: marcar o `refreshId` como `revoked` e bloquear o `deviceId` se houver suspeita.

4. **Refresh reuse (replay) detectado**

- Se um `refreshId` já inválido reaparece → sinal de comprometimento. Procedimento:
  - Invalida todos os `refreshId` da mesma `deviceId` e/ou `sessionId`.
  - Marca o `deviceId` como `blacklisted` (ou `compromised`).
  - Exige login normal com senha em todos os dispositivos do usuário.

5. **Longa inatividade**

- Se `lastUsedAt` ultrapassa threshold de inatividade (p.ex. 30 dias sem uso) → exigir senha.

6. **Sinais de risco (geolocalização/IP inesperado, mudança de comportamento)**

- Em caso de risco, exigir senha ou 2FA, e possivelmente bloquear o dispositivo até verificação manual.

### Blacklist e bloqueio de dispositivos

- Mantenha uma **blacklist de dispositivos** (`deviceId` marcado `blacklisted=true`) quando houver evidência de fraude (reuse, abuso, confirmação do usuário).
- Dispositivos blacklisted são rejeitados em qualquer tentativa de refresh/login e geram alerta administrativo.
- Ao detectar reuse, o fluxo deve: invalidar refreshs relacionados, marcar `deviceId` como `blacklisted`, revogar access tokens correspondentes (ou forçar expiração imediata), e exigir reauth por senha/2FA.

### Fluxo resumido seguro

1. Login inicial: cria `access` (JWT curto) + `refresh` (opaco rotativo); registra `refreshId` em `sessions` ligado ao `deviceId`.
2. App usa `access`. Ao expirar, chama `/auth/refresh` enviando cookie `refresh`.
3. Server valida `refreshId` + `device` → se OK: emite novo `access` e novo `refresh` (invalida antigo); atualiza `lastUsedAt`.
4. Se mismatch/reuse/suspeita: revoga sessão(s), marca `deviceId` como blacklisted, exige reauth (senha).
