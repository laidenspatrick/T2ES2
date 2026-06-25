# Report Service — Grupo 5

Microsserviço de **Relatórios e Painel Administrativo** da plataforma CHAVE.  
ES2 / PUCRS 2026-1 — Entrega T2.

---

## Funcionalidades

| Funcionalidade | Rota |
|---|---|
| Solicitar relatório (INDIVIDUAL / GROUP / COMPETENCY / ASSESSMENT) | `POST /api/v1/reports` |
| Listar todos os relatórios *(ADMIN)* | `GET /api/v1/reports` |
| Listar meus relatórios | `GET /api/v1/reports/my` |
| Ver meu progresso de competências | `GET /api/v1/reports/my/progress` |
| Obter relatório com dados consolidados | `GET /api/v1/reports/:id` |
| Excluir relatório | `DELETE /api/v1/reports/:id` |
| Exportar relatório (PDF / CSV / XLSX) | `POST /api/v1/reports/:id/exports` |
| Listar exports de um relatório | `GET /api/v1/reports/:id/exports` |
| Consultar status de export job | `GET /api/v1/exports/:jobId` |
| Painel administrativo *(ADMIN)* | `GET /api/v1/dashboard/summary` |
| Top performers por competência *(ADMIN)* | `GET /api/v1/dashboard/top-performers` |
| Taxas de conclusão por avaliação *(ADMIN)* | `GET /api/v1/dashboard/completion-rates` |

---

## Stack

- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Express 5
- **ORM:** TypeORM + PostgreSQL 16
- **Auth:** JWT (mesma secret do MS Auth G7)
- **Documentação:** Swagger/OpenAPI 3.0 (`swagger.yaml`)
- **CI/CD:** GitHub Actions → Docker Hub

---

## Pré-requisitos

- Node.js 20+
- Docker + Docker Compose
- Variáveis de ambiente (veja `.env.example`)

---

## Rodando localmente

### 1. Copiar variáveis de ambiente

```bash
cp .env.example .env
# edite .env com a JWT_SECRET correta do MS Auth G7
```

### 2. Subir com Docker Compose

```bash
docker compose up --build
```

O serviço estará disponível em `http://localhost:3005`.  
Swagger em `http://localhost:3005/api-docs`.

### 3. Rodando em modo dev (sem Docker)

```bash
npm install
npm run dev
```

> Requer PostgreSQL rodando localmente com as credenciais do `.env`.

---

## Testes

```bash
npm test               # roda os testes unitários
npm run test:coverage  # com relatório de cobertura
```

Os testes mocam os repositórios TypeORM e o cliente de serviços externos — nenhum banco ou rede é necessária.

---

## Integração com Ministack (chave-infra)

No `docker-compose.yml` da infra, adicione:

```yaml
report-service:
  image: <dockerhub-user>/chave-report-service:latest
  environment:
    JWT_SECRET: ${JWT_SECRET}
    DB_HOST: report-db
    ASSESSMENT_SERVICE_URL: http://assessment-service:3002/api/v1
    COMPETENCY_SERVICE_URL: http://competency-service:3003/api/v1
    USER_GROUP_SERVICE_URL: http://user-group-service:3004/api/v1
  depends_on:
    - report-db
  ports:
    - "3005:3005"
```

---

## CI/CD

O pipeline (`.github/workflows/ci-cd.yml`) executa automaticamente:

1. **Testes unitários** com cobertura
2. **Build TypeScript**
3. **Publicação da imagem Docker no Docker Hub** (apenas branch `main`)
4. **Criação de release GitHub** com tag versionada

### Secrets necessários no repositório

| Secret | Descrição |
|---|---|
| `DOCKERHUB_USERNAME` | Usuário Docker Hub |
| `DOCKERHUB_TOKEN` | Token de acesso Docker Hub |

---

## Estrutura do projeto

```
report-service/
├── src/
│   ├── app/
│   │   ├── controllers/       # ReportsController, DashboardController, ExportsController
│   │   ├── entities/          # Report, ReportSnapshot, ExportJob
│   │   ├── interfaces/        # DTOs e tipos
│   │   ├── middlewares/       # authMiddleware, adminMiddleware, errorHandler, rateLimiter
│   │   ├── repositories/      # ReportRepository, ExportJobRepository
│   │   ├── routes/            # Routes.ts
│   │   └── services/
│   │       ├── ReportService.ts
│   │       ├── DashboardService.ts
│   │       ├── ExportService.ts
│   │       ├── ExternalServiceClient.ts
│   │       └── __tests__/
│   │           └── ReportService.test.ts
│   ├── database/
│   │   └── database-config.ts
│   ├── server.ts
│   └── swagger.ts
├── swagger.yaml
├── ADR-001-report-service.md
├── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci-cd.yml
```

---

## Arquitetura de Decisões

Ver [ADR-001-report-service.md](./ADR-001-report-service.md).
