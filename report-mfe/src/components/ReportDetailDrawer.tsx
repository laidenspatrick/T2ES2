import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CloseIcon from '@mui/icons-material/Close';
import { useReport } from '../hooks/useReports';
import StatusChip from './StatusChip';
import ReportTypeChip from './ReportTypeChip';
import ExportButton from './ExportButton';

interface Props {
  reportId: number | null;
  onClose: () => void;
}

// Renderiza dados tipados de cada tipo de relatório
function ReportDataViewer({ data, type }: { data: unknown; type: string }) {
  if (!data || typeof data !== 'object') return <Typography>Sem dados.</Typography>;

  const d = data as Record<string, unknown>;

  if (type === 'INDIVIDUAL') {
    const summaries = (d.competencySummaries as Array<Record<string, unknown>>) ?? [];
    return (
      <>
        <Typography variant="subtitle2" gutterBottom>
          Avaliações concluídas: {String(d.totalAssessmentsCompleted ?? 0)}
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Competência</TableCell>
              <TableCell>Último Nível</TableCell>
              <TableCell align="right">Avaliações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summaries.map((s) => (
              <TableRow key={String(s.competencyId)}>
                <TableCell>{String(s.competencyName ?? s.competencyId)}</TableCell>
                <TableCell>{String(s.latestLevelName ?? s.latestLevelId)}</TableCell>
                <TableCell align="right">{String(s.assessmentsCompleted)}</TableCell>
              </TableRow>
            ))}
            {summaries.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Nenhuma competência avaliada no período.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </>
    );
  }

  if (type === 'GROUP') {
    const averages = (d.competencyAverages as Array<Record<string, unknown>>) ?? [];
    return (
      <>
        <Typography variant="subtitle2" gutterBottom>
          {String(d.groupName ?? '')} — {String(d.participatingMembers ?? 0)}/
          {String(d.totalMembers ?? 0)} membros participaram (
          {String(d.participationRate ?? 0)}%)
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Competência</TableCell>
              <TableCell align="right">Média (nível)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {averages.map((a) => (
              <TableRow key={String(a.competencyId)}>
                <TableCell>{String(a.competencyName ?? a.competencyId)}</TableCell>
                <TableCell align="right">{String(a.averageScore)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>
    );
  }

  if (type === 'ASSESSMENT') {
    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {String(d.assessmentTitle ?? `Avaliação #${String(d.assessmentId)}`)}
        </Typography>
        <Typography>Total iniciados: {String(d.totalStarted)}</Typography>
        <Typography>Total concluídos: {String(d.totalCompleted)}</Typography>
        <Typography>Taxa de conclusão: {String(d.completionRate)}%</Typography>
      </Box>
    );
  }

  // Fallback: JSON bruto
  return (
    <Box
      component="pre"
      sx={{ fontSize: 12, bgcolor: 'action.hover', p: 1.5, borderRadius: 1, overflowX: 'auto' }}
    >
      {JSON.stringify(data, null, 2)}
    </Box>
  );
}

export default function ReportDetailDrawer({ reportId, onClose }: Props) {
  const { report, loading, error } = useReport(reportId);

  return (
    <Drawer anchor="right" open={!!reportId} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 520 } } }}>
      <Box display="flex" alignItems="center" p={2} gap={1}>
        <Typography variant="h6" flex={1}>
          Relatório #{reportId}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />

      <Box p={2} overflow="auto">
        {loading && (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {report && !loading && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <ReportTypeChip type={report.type} />
              <StatusChip status={report.status} />
            </Box>

            {report.status === 'READY' && report.data && (
              <>
                <Divider />
                <Typography variant="subtitle1" fontWeight={600}>
                  Dados Consolidados
                </Typography>
                <ReportDataViewer data={report.data} type={report.type} />
                <Divider />
                <ExportButton reportId={report.id} />
              </>
            )}

            {report.status === 'PROCESSING' && (
              <Alert severity="info">
                O relatório está sendo gerado. Atualize em alguns instantes.
              </Alert>
            )}

            {report.status === 'FAILED' && (
              <Alert severity="error">
                Falha ao gerar relatório. Por favor, solicite um novo.
              </Alert>
            )}
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
