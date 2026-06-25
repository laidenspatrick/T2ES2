import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { LineChart } from '@mui/x-charts/LineChart';
import { useMyProgress } from '../hooks/useReports';
import { CompetencyProgress } from '../types';

function ProgressChartCard({ cp }: { cp: CompetencyProgress }) {
  if (cp.entries.length < 2) {
    // Apenas um ponto — mostra card simples
    const entry = cp.entries[0];
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {cp.competencyName ?? `Competência #${cp.competencyId}`}
          </Typography>
          <Chip
            label={entry?.levelName ?? `Nível ${entry?.levelId ?? '—'}`}
            color="primary"
            size="small"
          />
          <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
            {entry ? new Date(entry.achievedAt).toLocaleDateString('pt-BR') : '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Apenas 1 avaliação — gráfico disponível com 2 ou mais pontos.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const dates = cp.entries.map((e) => new Date(e.achievedAt).toLocaleDateString('pt-BR'));
  const levels = cp.entries.map((e) => e.levelId);
  const latestLevel = cp.entries[cp.entries.length - 1];

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle2" fontWeight={600}>
            {cp.competencyName ?? `Competência #${cp.competencyId}`}
          </Typography>
          <Chip
            label={latestLevel?.levelName ?? `Nível ${latestLevel?.levelId ?? '—'}`}
            color="primary"
            size="small"
          />
        </Box>

        <LineChart
          xAxis={[{ data: dates, scaleType: 'band', label: 'Data' }]}
          series={[{ data: levels, label: 'Nível', area: true, color: '#1976d2' }]}
          height={180}
          margin={{ top: 10, right: 16, bottom: 40, left: 32 }}
        />

        <Typography variant="caption" color="text.secondary">
          {cp.entries.length} avaliações registradas
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function MyProgress() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { progress, loading, error } = useMyProgress(
    undefined,
    dateFrom || undefined,
    dateTo || undefined,
  );

  const totalAssessments = progress.reduce((acc, cp) => acc + cp.entries.length, 0);
  const competenciesEvaluated = progress.length;

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Meu Progresso
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Evolução cronológica do seu nível em cada competência avaliada.
        </Typography>
      </Box>

      {/* Filtros de data */}
      <Stack direction="row" spacing={2} mb={3}>
        <TextField
          label="Data inicial"
          type="date"
          size="small"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Data final"
          type="date"
          size="small"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      {/* Summary cards */}
      {!loading && progress.length > 0 && (
        <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
          <Card variant="outlined" sx={{ minWidth: 140 }}>
            <CardContent sx={{ pb: '12px !important', pt: 1.5 }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {competenciesEvaluated}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Competências avaliadas
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ minWidth: 140 }}>
            <CardContent sx={{ pb: '12px !important', pt: 1.5 }}>
              <Typography variant="h4" fontWeight={700} color="secondary">
                {totalAssessments}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avaliações concluídas
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Charts */}
      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      )}

      {error && !loading && <Alert severity="error">{error}</Alert>}

      {!loading && !error && progress.length === 0 && (
        <Alert severity="info">
          Nenhuma avaliação submetida encontrada no período. Complete avaliações para ver seu
          progresso aqui.
        </Alert>
      )}

      {!loading && progress.length > 0 && (
        <Grid container spacing={2}>
          {progress.map((cp) => (
            <Grid item xs={12} sm={6} md={4} key={cp.competencyId}>
              <ProgressChartCard cp={cp} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
