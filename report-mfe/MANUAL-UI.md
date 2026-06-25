# Manual de UI — Report MFE (Grupo 5)

**Versão:** 1.0.0  
**Tecnologias:** React 18 · TypeScript · MUI v6 · MUI X Charts · Module Federation (Vite)  
**Porta de desenvolvimento:** `http://localhost:3105`  
**Documentação da API:** `http://localhost:3005/api-docs`

---

## Visão Geral

O **Report MFE** é o microfrontend de relatórios da plataforma **CHAVE**. É servido como um módulo remoto via Module Federation e consumido pelo **chave-shell**. Pode também rodar de forma standalone para desenvolvimento.

---

## Mapa de Telas

```
Usuário comum
├── Meus Relatórios   → /reports/my-reports
└── Meu Progresso     → /reports/my-progress

ADMIN
├── Dashboard         → /reports/dashboard
├── Todos os Relatórios → /reports/all-reports
├── Meus Relatórios   → /reports/my-reports
└── Meu Progresso     → /reports/my-progress
```

---

## Telas

### 1. Meus Relatórios (`/reports/my-reports`)

**Acesso:** Qualquer usuário autenticado.

**Descrição:** Lista todos os relatórios do tipo `INDIVIDUAL` e `COMPETENCY` solicitados pelo usuário. Permite criar novos relatórios, visualizar dados consolidados e exportar.

#### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Meus Relatórios                      [Atualizar] [+ Novo]│
│ Sub: Histórico dos seus relatórios...                    │
│                                                         │
│ [Todos] [Pendente] [Processando] [Prontos] [Falhou]     │
│                                                         │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│ │ INDIVIDUAL   │  │ COMPETÊNCIA  │  │ INDIVIDUAL   │   │
│ │ ✅ Pronto    │  │ ⏳ Pendente  │  │ ❌ Falhou    │   │
│ │              │  │              │  │              │   │
│ │ 01/06/2026   │  │ 02/06/2026   │  │ 30/05/2026   │   │
│ │ [PDF][CSV][XLSX] │              │  │              │   │
│ │          [👁][🗑]│          [🗑] │  │          [🗑] │  │
│ └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Interações

| Ação | Componente | Comportamento |
|---|---|---|
| **Novo Relatório** | `<Button variant="contained">` | Abre `CreateReportDialog` |
| **Atualizar** | `<Button variant="outlined">` | Refaz o fetch da lista |
| **Filtro de status** | `<ToggleButtonGroup>` | Filtra a lista sem recarregar página |
| **Ver** (👁) | `<IconButton>` | Abre `ReportDetailDrawer` lateral |
| **Exportar** | `<ExportButton>` | Cria job e faz poll → download automático |
| **Excluir** (🗑) | `<IconButton color="error">` | Confirmação via `confirm()` → DELETE |

---

### 2. Criar Relatório (Dialog)

**Componente:** `CreateReportDialog`

**Acionado por:** Botão "Novo Relatório" em qualquer tela.

#### Campos

| Campo | Tipo | Visível para | Obrigatório |
|---|---|---|---|
| Tipo de Relatório | `<Select>` | Todos | ✅ |
| ID do Grupo | `<TextField type="number">` | Apenas quando tipo = GROUP | Se GROUP |
| ID da Avaliação | `<TextField type="number">` | Apenas quando tipo = ASSESSMENT | Se ASSESSMENT |
| ID da Competência | `<TextField type="number">` | Admin quando tipo = COMPETENCY | Não |
| Data inicial | `<TextField type="date">` | Todos | Não |
| Data final | `<TextField type="date">` | Todos | Não |

**Tipos disponíveis por papel:**

- **Usuário comum:** Individual, Competências
- **ADMIN:** Individual, Grupo, Competências, Avaliação

**Comportamento:** Ao confirmar, chama `POST /reports` e retorna `202 Accepted`. O relatório começa como `PENDING` e é processado em background. O usuário pode acompanhar na lista.

---

### 3. Detalhe do Relatório (Drawer)

**Componente:** `ReportDetailDrawer`

**Acionado por:** Botão 👁 nos cards/tabela. Disponível apenas quando `status = READY`.

#### Layout

```
┌──────────────────────────────────┐
│ Relatório #42                [✕] │
├──────────────────────────────────┤
│ [INDIVIDUAL] [✅ Pronto]          │
│                                  │
│ Dados Consolidados               │
│ ─────────────────────────────    │
│ Avaliações concluídas: 5         │
│                                  │
│ Competência     Último nível  Nº │
│ Comunicação     Intermediário  3 │
│ Liderança       Básico         2 │
│ Tecnologia      Avançado       4 │
│                                  │
│ ─────────────────────────────    │
│ [PDF] [CSV] [XLSX]               │
└──────────────────────────────────┘
```

**Renderização por tipo:**

- **INDIVIDUAL:** Tabela de competências com último nível e contagem de avaliações.
- **GROUP:** Participação do grupo e médias por competência.
- **ASSESSMENT:** Taxa de conclusão da avaliação.
- **COMPETENCY / outros:** JSON formatado como fallback.

---

### 4. Meu Progresso (`/reports/my-progress`)

**Acesso:** Qualquer usuário autenticado.

**Descrição:** Exibe a evolução cronológica do nível do usuário em cada competência avaliada, com gráficos de linha.

#### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Meu Progresso                                           │
│ Sub: Evolução cronológica...                            │
│                                                         │
│ [Data inicial ▽]  [Data final ▽]                        │
│                                                         │
│ ┌──────┐  ┌──────────────┐                              │
│ │  4   │  │      8       │                              │
│ │ comp.│  │  avaliações  │                              │
│ └──────┘  └──────────────┘                              │
│                                                         │
│ ┌─────────────────┐  ┌─────────────────┐               │
│ │ Comunicação [3] │  │ Liderança [1]   │               │
│ │  📈 gráfico     │  │  📈 gráfico     │               │
│ │ 3 avaliações    │  │ 1 avaliação     │               │
│ └─────────────────┘  └─────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

**Gráficos:** `LineChart` do MUI X Charts. Eixo X = datas das avaliações, eixo Y = ID do nível atingido. Área preenchida azul.

**Comportamento com 1 avaliação:** Mostra card simples com o chip do nível (sem gráfico — necessário mínimo 2 pontos).

---

### 5. Dashboard Administrativo (`/reports/dashboard`)

**Acesso:** Apenas ADMIN.

**Descrição:** Painel consolidado com métricas globais da plataforma.

#### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Painel Administrativo                                   │
│                                                         │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│ │ 128    │ │  12    │ │   8    │ │   5    │            │
│ │Usuários│ │Grupos  │ │Avaliac.│ │Compet. │            │
│ └────────┘ └────────┘ └────────┘ └────────┘            │
│                                                         │
│ ┌─────────────────────────┐  ┌──────────────────────┐  │
│ │ Avaliações por grupo    │  │ Distribuição níveis  │  │
│ │ 📊 BarChart             │  │ 🍩 PieChart          │  │
│ └─────────────────────────┘  └──────────────────────┘  │
│                                                         │
│ ┌──────────────────────────────────────────────────┐    │
│ │ Taxa de conclusão por avaliação                  │    │
│ │ Avaliação A    10 / 12    ████████░░  83% ✅     │    │
│ │ Avaliação B     5 / 15    ████░░░░░░  33% ⚠     │    │
│ └──────────────────────────────────────────────────┘    │
│                                                         │
│ ┌──────────────────────────────────────────────────┐    │
│ │ Distribuição por competência (barras de progresso)│   │
│ │ Comunicação  Nível 1 ██ 20%  Nível 2 ████ 50%   │    │
│ └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

### 6. Todos os Relatórios (`/reports/all-reports`)

**Acesso:** Apenas ADMIN.

**Descrição:** Tabela paginada com todos os relatórios da plataforma. Filtros por tipo e status.

#### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Todos os Relatórios          [Atualizar] [+ Novo]       │
│                                                         │
│ [Tipo ▽]  [Status ▽]                                    │
│                                                         │
│ ID    Tipo         Status    Usuário  Criado   Pronto   │
│ ─────────────────────────────────────────────────────── │
│ #42  [Individual] [✅Pronto]  #7      01/06   01/06  👁🗑│
│ #41  [Grupo]      [⏳Process] #1      02/06   —      🗑  │
│ #40  [Avaliação]  [❌Falhou]  #3      30/05   —      🗑  │
│                                                         │
│ Linhas por página: [20▽]    1–20 de 87    [< >]        │
└─────────────────────────────────────────────────────────┘
```

---

## Exportação de Relatórios

**Componente:** `ExportButton`

**Formatos:** PDF · CSV · XLSX

**Fluxo:**
1. Usuário clica no formato desejado.
2. `POST /reports/:id/exports` cria o job.
3. MFE faz polling em `GET /exports/:jobId` a cada 2s (máx 30 tentativas).
4. Quando `status = DONE`, o `downloadUrl` é usado para download automático via `<a>` tag.
5. Em caso de falha, exibe mensagem de erro via `Tooltip`.

**Bloqueio:** Botões desabilitados enquanto um export está em andamento (spinner no botão ativo).

---

## Componentes Reutilizáveis

| Componente | Descrição | Props principais |
|---|---|---|
| `StatusChip` | Chip colorido de status | `status: ReportStatus \| ExportStatus` |
| `ReportTypeChip` | Chip com ícone do tipo de relatório | `type: ReportType` |
| `ExportButton` | Grupo de botões PDF/CSV/XLSX com polling | `reportId`, `disabled` |
| `ReportCard` | Card de relatório com ações | `report`, `onView`, `onDelete` |
| `CreateReportDialog` | Dialog de criação de relatório | `open`, `onClose`, `onCreated` |
| `ReportDetailDrawer` | Drawer lateral com dados consolidados | `reportId`, `onClose` |

---

## Design System

| Token | Valor | Uso |
|---|---|---|
| `primary.main` | `#1565C0` | Botões principais, chips de tipo INDIVIDUAL, gráficos |
| `secondary.main` | `#6a1b9a` | Chips de tipo GROUP |
| `success` | MUI default green | Status READY/DONE |
| `error` | MUI default red | Status FAILED |
| `warning` | MUI default orange | Status PENDING / chips ASSESSMENT |
| `info` | MUI default blue | Status PROCESSING |
| `fontFamily` | `Inter, Roboto, ...` | Todo o MFE |
| `Card elevation` | `0` (outlined) | Cards sem sombra |

---

## Integração com Shell

O MFE é consumido pelo shell com:

```tsx
// chave-shell: pages/ReportMfeWrapper.tsx
const ReportApp = lazy(() => import('reportMfe/App'));

<ReportApp
  auth={{ token, userId, email, roles }}
  basePath="/reports"
/>
```

O componente `App` aceita as props `auth` (objeto com `token`, `userId`, `email`, `roles`) e `basePath` (prefixo de rota). Quando rodando standalone (sem shell), usa valores de desenvolvimento via `import.meta.env.VITE_DEV_TOKEN`.

---

## Rodando em Desenvolvimento Standalone

```bash
cd report-mfe
cp .env.example .env.local
# Edite VITE_REPORT_SERVICE_URL e VITE_DEV_TOKEN
npm install
npm run dev
# → http://localhost:3105
```

**Variáveis de ambiente:**

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_REPORT_SERVICE_URL` | `http://localhost:3005/api/v1` | URL do backend |
| `VITE_DEV_TOKEN` | `dev-token` | JWT para desenvolvimento standalone |
