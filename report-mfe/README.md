# Report MFE — Grupo 5

Microfrontend de **Relatórios** da plataforma CHAVE.  
ES2 / PUCRS 2026-1 — Entrega T2.

## Stack

- **React 18** + **TypeScript**
- **MUI v6** (design system)
- **MUI X Charts** (gráficos)
- **Vite** + **@originjs/vite-plugin-federation** (Module Federation)
- **Vitest** + **Testing Library** (testes)

## Rodando localmente (standalone)

```bash
cp .env.example .env.local
# ajuste VITE_REPORT_SERVICE_URL e VITE_DEV_TOKEN
npm install
npm run dev
# → http://localhost:3105
```

## Testes

```bash
npm test             # roda os testes
npm run test:coverage  # com cobertura
```

## Build

```bash
npm run build
# gera dist/ com o remoteEntry.js para Module Federation
```

## Integração com Shell App

O Shell precisa declarar o remote no `vite.config.ts`:

```js
federation({
  remotes: {
    reportMfe: 'http://localhost:3105/assets/remoteEntry.js',
  },
  shared: ['react', 'react-dom', 'react-router-dom', '@mui/material', ...]
})
```

E usar o componente exposto:

```tsx
const ReportApp = lazy(() => import('reportMfe/App'));

<ReportApp auth={{ token, userId, email, roles }} basePath="/reports" />
```

Ver [`src/shell-integration.ts`](./src/shell-integration.ts) para o exemplo completo.

## Evidências de uso de IA

Ver [`.cognitrace/README.md`](./.cognitrace/README.md).
