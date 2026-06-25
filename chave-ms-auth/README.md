# chave-ms-auth

Microsserviço de autenticação e gerenciamento de usuários do projeto **Chave**.

Expõe uma API REST com autenticação via JWT (token stateful — logout invalida o token via blocklist no banco). Persiste dados em PostgreSQL usando TypeORM, com sincronização automática de schema.

---

## Tecnologias

- Node.js 20 + Express 5
- TypeScript
- TypeORM — mapeamento objeto-relacional com PostgreSQL
- JWT (`jsonwebtoken`) — token de acesso com expiração de 4 horas
- bcrypt — hash de senhas
- express-rate-limit — proteção contra força bruta e abuso
- swagger-ui-express — documentação interativa em `/api-docs`

---

## Estrutura

```
src/
├── app/
│   ├── controllers/
│   │   ├── AuthController.ts     # rotas /api/auth
│   │   └── UsersController.ts    # rotas /api/users
│   ├── entities/
│   │   ├── Users.ts              # tabela users
│   │   ├── Roles.ts              # tabela roles
│   │   └── RevokedToken.ts       # tabela revoked_tokens (blocklist)
│   ├── interfaces/
│   │   ├── iUsers.ts
│   │   └── iRoles.ts
│   ├── middlewares/
│   │   ├── authMiddleware.ts     # validação do Bearer token + blocklist
│   │   ├── rateLimiter.ts        # limitadores por rota
│   │   └── errorHandler.ts      # handler global de erros
│   ├── repositories/
│   │   ├── UserRepository.ts
│   │   ├── RoleRepository.ts
│   │   └── RevokedTokenRepository.ts
│   ├── routes/
│   │   └── Routes.ts
│   └── services/
│       ├── AuthService.ts        # login, geração e revogação de JWT
│       └── UsersService.ts       # cadastro, atualização e gestão de roles
├── database/
│   └── database-config.ts       # DataSource TypeORM
├── server.ts
└── swagger.ts
```

---

## Endpoints

Todos os endpoints estão sob o prefixo `/api`.

### Autenticação (`/api/auth`)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/login` | — | Autentica com email e senha; retorna `token` JWT |
| POST | `/auth/logout` | Bearer | Revoga o token atual (adiciona à blocklist) |
| GET | `/auth/me` | Bearer | Retorna os dados completos do usuário autenticado |

### Usuários (`/api/users`)

| Método | Rota | Auth | Admin | Descrição |
|---|---|---|---|---|
| POST | `/users/sign-up` | — | — | Cadastra novo usuário com a role padrão `geral` |
| PUT | `/users/save` | Bearer | Sim | Atualiza dados de qualquer usuário pelo `idUser` |
| GET | `/users/all` | Bearer | Sim | Lista todos os usuários cadastrados |
| PUT | `/users/copy-roles` | Bearer | Sim | Copia as roles do admin para o usuário informado |
| PUT | `/users/downgrade-roles` | Bearer | Sim | Reverte as roles do usuário para somente `geral` |

### Outros

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api-docs` | Documentação Swagger interativa |

---

## Regras de negócio

**Cadastro (`/users/sign-up`)**
- Nome: somente letras e espaços (acentos permitidos)
- Data de nascimento: deve ser uma data no passado
- Email: formato válido e único no sistema
- Senha: mínimo 10 caracteres, ao menos 1 maiúscula, 1 minúscula, 1 dígito e 1 caractere especial
- Confirmação deve ser idêntica à senha
- Usuário criado com `active = true` e role `geral` por padrão

**JWT**
- Expiração: 4 horas
- Logout é stateful: o token é inserido na tabela `revoked_tokens` e rejeitado pelo middleware em todas as requisições subsequentes

**Controle de acesso**
- Rotas de gestão (`/users/save`, `/users/all`, `/users/copy-roles`, `/users/downgrade-roles`) exigem que o usuário autenticado possua a role de ID `2` (administrador)

---

## Rate limiting

| Limitador | Rota | Janela | Limite |
|---|---|---|---|
| `globalLimiter` | todas | 1 minuto | 100 req/IP |
| `loginLimiter` | `POST /auth/login` | 5 minutos | 10 tentativas falhas/IP |
| `signUpLimiter` | `POST /users/sign-up` | 1 hora | 5 cadastros/IP |

---

## Variáveis de ambiente

Copie `.env.example` e ajuste conforme necessário:

```bash
cp .env.example .env
```

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3001` | Porta do servidor |
| `JWT_SECRET` | `change-me` | Segredo para assinar os tokens JWT |
| `DB_HOST` | `localhost` | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_USER` | `chave` | Usuário do banco |
| `DB_PASSWORD` | `chave_secret` | Senha do banco |
| `DB_NAME` | `chave_auth` | Nome do banco |
| `AWS_ENDPOINT` | `http://localhost:4566` | Endpoint do LocalStack (Ministack) |

---

## Desenvolvimento local

```bash
npm install
npm run dev      # inicia com nodemon (hot-reload)
```

> Requer PostgreSQL disponível na porta configurada em `.env`.
> O TypeORM sincroniza o schema automaticamente ao iniciar (`synchronize: true`).

Para rodar com a stack completa, utilize `make setup` no repositório `chave-infra`.

---

## Build e produção

```bash
npm run build    # compila TypeScript → dist/
npm run start    # build + node dist/server.js
```

---

## Docker

```bash
docker build -t chave-ms-auth .
docker run -p 3001:3001 --env-file .env chave-ms-auth
```

---

## Documentação interativa

Com o servidor rodando, acesse `http://localhost:3001/api-docs` para explorar e testar todos os endpoints via Swagger UI.
