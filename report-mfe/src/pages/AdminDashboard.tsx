import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import {
  getDashboardSummary,
  getCompletionRates,
} from '../api/reportApi';
import {
  DashboardSummary,
  CompletionRate,
} from '../types';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={700} lineHeight={1}>
            {value.toLocaleString('pt-BR')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [completionRates, setCompletionRates] = useState<CompletionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getDashboardSummary(), getCompletionRates()])
      .then(([s, c]) => {
        if (cancelled) return;
        setSummary(s);
        setCompletionRates(c);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!summary) return null;

  // Dados para gráfico de barras (grupos)
  const groupLabels = summary.groupProgress.slice(0, 8).map((g) => g.groupName ?? `#${g.groupId}`);
  const groupValues = summary.groupProgress.slice(0, 8).map((g) => g.assessmentsCompleted);

  // Dados para pizza (1ª competência com mais de 1 nível)
  const firstComp = summary.competencyDistributions.find((c) => c.levelDistribution.length > 0);
  const pieData = (firstComp?.levelDistribution ?? []).map((ld, i) => ({
    id: i,
    value: ld.count,
    label: `Nível ${ld.levelId}`,
  }));

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Painel Administrativo
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visão consolidada da plataforma CHAVE.
        </Typography>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Usuários" value={summary.totalUsers} icon={<PeopleIcon />} color="#1976d2" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Grupos" value={summary.totalGroups} icon={<GroupsIcon />} color="#7b1fa2" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Avaliações" value={summary.totalAssessments} icon={<AssignmentIcon />} color="#388e3c" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Competências" value={summary.totalCompetencies} icon={<PsychologyIcon />} color="#f57c00" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Avaliações concluídas por grupo */}
        {groupLabels.length > 0 && (
          <Grid item xs={12} md={7}>
            <Card variant="outlined">
              <CardHeader title="Avaliações concluídas por grupo" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }} />
              <CardContent>
                <BarChart
                  xAxis={[{ data: groupLabels, scaleType: 'band' }]}
                  series={[{ data: groupValues, label: 'Avaliações', color: '#1976d2' }]}
                  height={240}
                  margin={{ top: 8, right: 8, bottom: 40, left: 32 }}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Distribuição de níveis (1ª competência) */}
        {pieData.length > 0 && (
          <Grid item xs={12} md={5}>
            <Card variant="outlined">
              <CardHeader
                title={`Distribuição — ${firstComp?.competencyName ?? 'Competência'}`}
                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              />
              <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart series={[{ data: pieData, innerRadius: 40 }]} height={220} width={280} />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Taxa de conclusão por avaliação */}
        {completionRates.length > 0 && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardHeader
                title="Taxa de conclusão por avaliação"
                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              />
              <CardContent>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Avaliação</TableCell>
                      <TableCell align="right">Iniciados</TableCell>
                      <TableCell align="right">Concluídos</TableCell>
                      <TableCell sx={{ minWidth: 160 }}>Taxa</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {completionRates.map((r) => (
                      <TableRow key={r.assessmentId}>
                        <TableCell>{r.assessmentTitle ?? `#${r.assessmentId}`}</TableCell>
                        <TableCell align="right">{r.totalStarted}</TableCell>
                        <TableCell align="right">{r.totalCompleted}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={r.completionRate}
                              sx={{ flex: 1, height: 8, borderRadius: 4 }}
                              color={r.completionRate >= 70 ? 'success' : r.completionRate >= 40 ? 'warning' : 'error'}
                            />
                            <Chip
                              label={`${r.completionRate}%`}
                              size="small"
                              color={r.completionRate >= 70 ? 'success' : r.completionRate >= 40 ? 'warning' : 'error'}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Distribuições de competências */}
        {summary.competencyDistributions.length > 0 && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardHeader
                title="Distribuição de níveis por competência"
                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  {summary.competencyDistributions.slice(0, 6).map((comp) => {
                    const total = comp.levelDistribution.reduce((s, l) => s + l.count, 0);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={comp.competencyId}>
                        <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>
                          {comp.competencyName}
                        </Typography>
                        {comp.levelDistribution.map((ld) => (
                          <Box key={ld.levelId} mb={0.5}>
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="caption" color="text.secondary">
                                Nível {ld.levelId}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {total > 0 ? Math.round((ld.count / total) * 100) : 0}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={total > 0 ? (ld.count / total) * 100 : 0}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        ))}
                        <Divider sx={{ mt: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          {total} respondentes
                        </Typography>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
