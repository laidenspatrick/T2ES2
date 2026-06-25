import { useMemo } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { AuthContext } from './hooks/useAuth';
import { initApiClient } from './api/reportApi';
import { ShellAuthContext } from './types';
import MyReports from './pages/MyReports';
import MyProgress from './pages/MyProgress';
import AdminDashboard from './pages/AdminDashboard';
import AdminReports from './pages/AdminReports';

const theme = createTheme({
  palette: {
    primary: { main: '#1565C0' },
    secondary: { main: '#6a1b9a' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: { defaultProps: { elevation: 0 } },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});

interface AppProps {
  /** Injetado pelo Shell via Module Federation (opcional) */
  auth?: ShellAuthContext;
  /** Prefixo de rota do Shell */
  basePath?: string;
}

// ---------------------------------------------------------------------------
// Lê o JWT do localStorage (onde o chave-mfe-auth armazena após o login)
// e decodifica o payload SEM verificar assinatura — verificação já foi feita
// pelo backend. Retorna null se não houver token ou se estiver malformado.
// ---------------------------------------------------------------------------
function getAuthFromLocalStorage(): ShellAuthContext | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // JWT = header.payload.signature — payload é base64url
    const payloadB64 = token.split('.')[1];
    if (!payloadB64) return null;

    // base64url → base64 → JSON
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as {
      idUser?: number;
      email?: string;
      roles?: string[];
      exp?: number;
    };

    // Rejeita token expirado
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return null;
    }

    return {
      token,
      userId: payload.idUser ?? 0,
      email: payload.email ?? '',
      // Normaliza para UPPERCASE para corresponder ao adminMiddleware
      roles: (payload.roles ?? []).map((r) => r.toUpperCase()),
    };
  } catch {
    return null;
  }
}

const USER_TABS = [
  { label: 'Meus Relatórios', icon: <AssessmentIcon />, path: 'my-reports' },
  { label: 'Meu Progresso', icon: <TrendingUpIcon />, path: 'my-progress' },
];

const ADMIN_TABS = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: 'dashboard' },
  { label: 'Todos os Relatórios', icon: <ListAltIcon />, path: 'all-reports' },
  { label: 'Meus Relatórios', icon: <AssessmentIcon />, path: 'my-reports' },
  { label: 'Meu Progresso', icon: <TrendingUpIcon />, path: 'my-progress' },
];

function NavTabs({ isAdmin, basePath }: { isAdmin: boolean; basePath: string }) {
  const location = useLocation();
  const tabs = isAdmin ? ADMIN_TABS : USER_TABS;
  const currentTab = tabs.findIndex((t) => location.pathname.includes(t.path));

  return (
    <Tabs
      value={currentTab === -1 ? 0 : currentTab}
      sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      variant="scrollable"
      scrollButtons="auto"
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.path}
          label={tab.label}
          icon={tab.icon}
          iconPosition="start"
          component={Link}
          to={`${basePath}/${tab.path}`}
          sx={{ minHeight: 48, textTransform: 'none', fontWeight: 500 }}
        />
      ))}
    </Tabs>
  );
}

export default function App({ auth, basePath = '/reports' }: AppProps) {
  // Prioridade: prop do shell → localStorage → fallback de dev
  const resolvedAuth: ShellAuthContext =
    auth ??
    getAuthFromLocalStorage() ?? {
      // Só chega aqui em modo dev standalone (npm run dev no report-mfe)
      token: import.meta.env.VITE_DEV_TOKEN ?? '',
      userId: 1,
      email: 'dev@chave.local',
      roles: ['ADMIN'],
    };

  const isAdmin = resolvedAuth.roles.includes('ADMIN');

  useMemo(() => {
    if (resolvedAuth.token) {
      initApiClient(resolvedAuth.token);
    }
  }, [resolvedAuth.token]);

  // Se não há token algum, redireciona para o login do shell
  if (!resolvedAuth.token) {
    window.location.href = '/login';
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext.Provider value={resolvedAuth}>
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
          <NavTabs isAdmin={isAdmin} basePath={basePath} />

          <Routes>
            <Route path={`${basePath}/my-reports`} element={<MyReports />} />
            <Route path={`${basePath}/my-progress`} element={<MyProgress />} />

            {isAdmin && (
              <>
                <Route path={`${basePath}/dashboard`} element={<AdminDashboard />} />
                <Route path={`${basePath}/all-reports`} element={<AdminReports />} />
              </>
            )}

            <Route
              path={basePath}
              element={
                <Navigate
                  to={isAdmin ? `${basePath}/dashboard` : `${basePath}/my-reports`}
                  replace
                />
              }
            />
            <Route
              path="*"
              element={
                <Navigate
                  to={isAdmin ? `${basePath}/dashboard` : `${basePath}/my-reports`}
                  replace
                />
              }
            />
          </Routes>
        </Box>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
