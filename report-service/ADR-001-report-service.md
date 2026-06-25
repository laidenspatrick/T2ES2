# ADR-001 — Arquitetura do Report Service

**Status:** Aceito  
**Data:** 2026-06  
**Grupo:** 5 — Report Service  
**Contexto:** ES2 / PUCRS 2026-1 — Entrega T2

---

## Contexto

O **Report Service** é o microsserviço responsável por relatórios e painel administrativo na plataforma CHAVE. Ele não possui domínio próprio de avaliações ou competências: consome dados de outros microsserviços (Assessment, Competency, User/Group) via HTTP e consolida snapshots persistentes em banco próprio. Precisa funcionar integrado ao MS Auth eleito na T1 (Grupo 7, JWT) e rodar em Ministack (Docker + LocalStack).

---

## Decisões e Justificativas

### 1. Node.js + TypeScript + Express 5

**Decisão:** Manter o mesmo stack do MS Auth boilerplate (Node.js, TypeScript, Express 5).

**Justificativa:**
- Consistência com os demais microsserviços da turma, facilitando revisão e integração.
- Express 5 traz suporte nativo a `async/await` sem necessidade de `express-async-errors`.
- TypeScript garante contratos tipados nas interfaces entre camadas (controller → service → repository).

**Trade-off:** Node.js é single-threaded; operações de consolidação pesadas (relatórios GROUP com muitos membros) podem travar o event loop se síncronas. Mitigação: processamento assíncrono via fire-and-forget + status polling.

---

### 2. Padrão de Relatório Assíncrono (Status Polling)

**Decisão:** O endpoint `POST /reports` retorna HTTP 202 imediatamente com status `PENDING` e processa a consolidação em background.

**Justificativa:**
- A consolidação exige múltiplas chamadas HTTP a serviços externos; responder de forma síncrona elevaria o tempo de resposta a vários segundos.
- O cliente faz polling em `GET /reports/:id` até `status=READY`.
- Alternativa considerada: webhooks/callbacks. Descartada pela necessidade de configuração extra no cliente e maior complexidade.

**Trade-off:** O cliente precisa fazer polling; aumenta o número de requisições. Aceitável para o escopo acadêmico.

---

### 3. Snapshot Imutável por Relatório (ReportSnapshot)

**Decisão:** Ao concluir o processamento, os dados consolidados são salvos em `report_snapshots.data` (JSONB) como snapshot imutável.

**Justificativa:**
- Relatórios históricos não devem mudar quando os dados-fonte mudam (ex.: avaliações reprocessadas).
- JSONB no PostgreSQL permite armazenar estruturas flexíveis (INDIVIDUAL, GROUP, COMPETENCY, ASSESSMENT têm shapes diferentes) sem proliferação de tabelas.
- Exportações (PDF/CSV) leem o snapshot, não fazem novas chamadas externas.

**Trade-off:** O relatório pode ficar desatualizado; por isso, há campo `expiresAt` e o usuário pode solicitar novo relatório.

---

### 4. TypeORM com synchronize:true (desenvolvimento)

**Decisão:** Usar `synchronize: true` no DataSource durante desenvolvimento/Ministack.

**Justificativa:**
- Elimina a necessidade de gerenciar migrations manualmente em ambiente acadêmico com schema ainda volátil.
- Em produção AWS (ponto extra), `synchronize` deve ser desativado e migrations explícitas criadas.

**Trade-off:** Risco de perda de dados em drops acidentais de coluna. Aceitável em ambiente de desenvolvimento.

---

### 5. Integração com MS Auth via JWT (stateless)

**Decisão:** Validar o JWT localmente usando a mesma `JWT_SECRET` configurada no MS Auth G7; não chamar o serviço de auth a cada request.

**Justificativa:**
- Evita latência adicional e dependência de disponibilidade do MS Auth em cada requisição.
- O payload do JWT já contém `idUser` e `roles`, suficientes para autorização.
- Tokens revogados serão invalidados após expiração natural.

**Trade-off:** Sem lista de revogação em tempo real. Mitigação: tokens com expiração curta configurada no MS Auth.

---

### 6. Exportação via Data URI (Ministack) / S3 (Produção)

**Decisão:** No ambiente Ministack, o `downloadUrl` do ExportJob é um Data URI base64. Em produção, substituir por upload para S3 (LocalStack) com URL pré-assinada.

**Justificativa:**
- Evita dependência de S3/LocalStack obrigatória para o ambiente de desenvolvimento básico.
- A abstração está no `ExportService.processExportJob`; trocar a implementação não afeta a API.

**Trade-off:** Data URIs são grandes para arquivos extensos. Limite prático: relatórios com poucos registros no contexto acadêmico.

---

### 7. Organização em Camadas (Controller → Service → Repository)

**Decisão:** Seguir a mesma estrutura de camadas do MS Auth boilerplate.

```
src/
├── app/
│   ├── controllers/   # HTTP request/response
│   ├── services/      # regras de negócio + chamadas externas
│   ├── repositories/  # acesso ao banco (TypeORM)
│   ├── entities/      # entidades TypeORM
│   ├── middlewares/   # auth, rate limit, error handler
│   └── routes/        # wiring de rotas
├── database/          # DataSource config
└── server.ts          # bootstrap
```

**Justificativa:** Separação de responsabilidades clara; facilita testes unitários (mock de repositories e ExternalServiceClient sem banco real).

---

## Consequências

- O microsserviço é **stateless** em relação a autenticação.
- O banco de dados `report_service` é **exclusivo** do serviço (não compartilhado).
- Novos tipos de relatório podem ser adicionados incluindo um `case` em `ReportService.processReport` e um schema correspondente no Swagger, sem alterar a API externa.
- O pipeline CI/CD (GitHub Actions) garante que toda PR passe em testes antes de publicar imagem no Docker Hub.
