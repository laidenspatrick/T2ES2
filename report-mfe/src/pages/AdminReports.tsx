import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import { deleteReport } from '../api/reportApi';
import { useAllReports } from '../hooks/useReports';
import { ReportType, ReportStatus } from '../types';
import StatusChip from '../components/StatusChip';
import ReportTypeChip from '../components/ReportTypeChip';
import CreateReportDialog from '../components/CreateReportDialog';
import ReportDetailDrawer from '../components/ReportDetailDrawer';

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os tipos' },
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'GROUP', label: 'Grupo' },
  { value: 'COMPETENCY', label: 'Competência' },
  { value: 'ASSESSMENT', label: 'Avaliação' },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'PROCESSING', label: 'Processando' },
  { value: 'READY', label: 'Pronto' },
  { value: 'FAILED', label: 'Falhou' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AdminReports() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);

  const { data: reports, total, loading, error, refetch } = useAllReports(
    page + 1,
    rowsPerPage,
    typeFilter || undefined,
    statusFilter || undefined,
  );

  const handleDelete = async (id: number) => {
    if (!confirm(`Excluir relatório #${id}?`)) return;
    try {
      await deleteReport(id);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir.');
    }
  };

  const handleFilterChange = () => {
    setPage(0);
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Todos os Relatórios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visão administrativa de todos os relatórios da plataforma.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={refetch} disabled={loading}>
            Atualizar
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Novo Relatório
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            value={typeFilter}
            label="Tipo"
            onChange={(e) => { setTypeFilter(e.target.value); handleFilterChange(); }}
          >
            {TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => { setStatusFilter(e.target.value); handleFilterChange(); }}
          >
            {STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Table */}
      <Paper variant="outlined">
        {loading && <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>}
        {error && !loading && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

        {!loading && !error && (
          <>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Solicitado por</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Criado em</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Pronto em</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>#{report.id}</TableCell>
                    <TableCell><ReportTypeChip type={report.type as ReportType} /></TableCell>
                    <TableCell><StatusChip status={report.status as ReportStatus} /></TableCell>
                    <TableCell>#{report.requestedByUserId}</TableCell>
                    <TableCell>{formatDate(report.createdAt)}</TableCell>
                    <TableCell>{formatDate(report.readyAt)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver relatório">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => setViewId(report.id)}
                            disabled={report.status !== 'READY'}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => handleDelete(report.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {reports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      Nenhum relatório encontrado com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
              labelRowsPerPage="Por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            />
          </>
        )}
      </Paper>

      <CreateReportDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
      <ReportDetailDrawer reportId={viewId} onClose={() => setViewId(null)} />
    </Box>
  );
}
