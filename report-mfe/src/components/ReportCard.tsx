import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Report } from '../types';
import StatusChip from './StatusChip';
import ReportTypeChip from './ReportTypeChip';
import ExportButton from './ExportButton';

interface Props {
  report: Report;
  onView?: (id: number) => void;
  onDelete?: (id: number) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function ReportCard({ report, onView, onDelete }: Props) {
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
          <ReportTypeChip type={report.type} />
          <StatusChip status={report.status} />
        </Box>

        <Typography variant="caption" color="text.secondary" display="block">
          Solicitado em: {formatDate(report.createdAt)}
        </Typography>

        {report.readyAt && (
          <Typography variant="caption" color="text.secondary" display="block">
            Gerado em: {formatDate(report.readyAt)}
          </Typography>
        )}

        {report.expiresAt && (
          <Typography variant="caption" color="text.secondary" display="block">
            Expira em: {formatDate(report.expiresAt)}
          </Typography>
        )}

        {/* Filtros aplicados */}
        {Object.entries(report.filters ?? {}).some(([, v]) => v != null) && (
          <Box mt={1} p={1} bgcolor="action.hover" borderRadius={1}>
            <Typography variant="caption" color="text.secondary">
              Filtros:{' '}
              {Object.entries(report.filters ?? {})
                .filter(([, v]) => v != null)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' · ')}
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        {report.status === 'READY' && (
          <ExportButton reportId={report.id} />
        )}

        <Box ml="auto" display="flex" gap={0.5}>
          {onView && (
            <Tooltip title="Ver relatório">
              <span>
                <IconButton
                  size="small"
                  onClick={() => onView(report.id)}
                  disabled={report.status !== 'READY'}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Excluir">
              <IconButton size="small" color="error" onClick={() => onDelete(report.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardActions>
    </Card>
  );
}
