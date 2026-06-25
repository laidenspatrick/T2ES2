import Chip from '@mui/material/Chip';
import { ReportStatus, ExportStatus } from '../types';

type AnyStatus = ReportStatus | ExportStatus;

const COLOR_MAP: Record<AnyStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  PENDING: 'default',
  PROCESSING: 'info',
  READY: 'success',
  DONE: 'success',
  FAILED: 'error',
};

const LABEL_MAP: Record<AnyStatus, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando…',
  READY: 'Pronto',
  DONE: 'Concluído',
  FAILED: 'Falhou',
};

interface Props {
  status: AnyStatus;
  size?: 'small' | 'medium';
}

export default function StatusChip({ status, size = 'small' }: Props) {
  return (
    <Chip
      label={LABEL_MAP[status]}
      color={COLOR_MAP[status]}
      size={size}
      variant="filled"
    />
  );
}
