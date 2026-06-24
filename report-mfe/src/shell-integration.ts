/**
 * INTEGRAÇÃO DO REPORT MFE NO CHAVE-SHELL
 * =========================================
 *
 * Instruções para integrar o report-mfe ao chave-shell via Module Federation.
 *
 * 1. Adicione o remote no vite.config.ts do shell:
 *
 *   federation({
 *     remotes: {
 *       reportMfe: 'http://localhost:3105/assets/remoteEntry.js',
 *       // Em produção / docker:
 *       // reportMfe: 'http://report-mfe:3105/assets/remoteEntry.js',
 *     },
 *     shared: ['react', 'react-dom', 'react-router-dom', '@mui/material', ...],
 *   })
 *
 * 2. Declare o tipo do módulo remoto (src/declarations.d.ts no shell):
 *
 *   declare module 'reportMfe/App' {
 *     import { ComponentType } from 'react';
 *     interface ReportAppProps {
 *       auth?: { token: string; userId: number; email: string; roles: string[] };
 *       basePath?: string;
 *     }
 *     const ReportApp: ComponentType<ReportAppProps>;
 *     export default ReportApp;
 *   }
 *
 * 3. Importe e use o componente no roteamento do Shell (exemplo abaixo):
 */

// ─── Exemplo de uso no Shell App ─────────────────────────────────────────────

/*
// src/pages/ReportMfeWrapper.tsx (no chave-shell)

import { Suspense, lazy } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useShellAuth } from '../hooks/useShellAuth'; // hook do próprio shell

// Importação lazy do MFE remoto
const ReportApp = lazy(() => import('reportMfe/App'));

export default function ReportMfeWrapper() {
  const { token, userId, email, roles } = useShellAuth();

  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      }
    >
      <ReportApp
        auth={{ token, userId, email, roles }}
        basePath="/reports"
      />
    </Suspense>
  );
}
*/

/*
// src/router.tsx (no chave-shell) — adicionar rota:

import ReportMfeWrapper from './pages/ReportMfeWrapper';

<Routes>
  ...rotas existentes...
  <Route path="/reports/*" element={<ReportMfeWrapper />} />
</Routes>
*/

/*
// src/components/Sidebar.tsx (no chave-shell) — adicionar item de menu:

{ label: 'Relatórios', icon: <AssessmentIcon />, path: '/reports' }
*/

export {};
