import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { deleteReport } from '../api/reportApi';
import { useMyReports } from '../hooks/useReports';
import ReportCard from '../components/ReportCard';
import CreateReportDialog from '../components/CreateReportDialog';
import ReportDetailDrawer from '../components/ReportDetailDrawer';

type Filter = 'ALL' | 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export default function MyReports() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);

  const { reports, loading, error, refetch } = useMyReports(
    filter === 'ALL' ? undefined : filter,
  );

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este relatório?')) return;
    try {
      await deleteReport(id);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir.');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Meus Relatórios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Histórico dos seus relatórios individuais e de competências.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={refetch}
            disabled={loading}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Novo Relatório
          </Button>
        </Box>
      </Box>

      {/* Filtro de status */}
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, v) => v && setFilter(v as Filter)}
        size="small"
        sx={{ mb: 3 }}
      >
        <ToggleButton value="ALL">Todos</ToggleButton>
        <ToggleButton value="PENDING">Pendente</ToggleButton>
        <ToggleButton value="PROCESSING">Processando</ToggleButton>
        <ToggleButton value="READY">Prontos</ToggleButton>
        <ToggleButton value="FAILED">Falhou</ToggleButton>
      </ToggleButtonGroup>

      {/* Content */}
      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      )}

      {error && !loading && <Alert severity="error">{error}</Alert>}

      {!loading && !error && reports.length === 0 && (
        <Alert severity="info">
          Nenhum relatório encontrado. Clique em "Novo Relatório" para gerar o primeiro.
        </Alert>
      )}

      {!loading && reports.length > 0 && (
        <Grid container spacing={2}>
          {reports.map((report) => (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <ReportCard
                report={report}
                onView={(id) => setViewId(id)}
                onDelete={handleDelete}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialogs */}
      <CreateReportDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refetch}
      />
      <ReportDetailDrawer reportId={viewId} onClose={() => setViewId(null)} />
    </Box>
  );
}
