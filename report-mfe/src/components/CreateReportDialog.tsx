import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { ReportType } from '../types';
import { createReport } from '../api/reportApi';
import { useIsAdmin } from '../hooks/useAuth';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const USER_TYPES: { value: ReportType; label: string }[] = [
  { value: 'INDIVIDUAL', label: 'Individual (meu desempenho)' },
  { value: 'COMPETENCY', label: 'Competências (minha distribuição)' },
];

const ADMIN_TYPES: { value: ReportType; label: string }[] = [
  { value: 'INDIVIDUAL', label: 'Individual (por usuário)' },
  { value: 'GROUP', label: 'Grupo' },
  { value: 'COMPETENCY', label: 'Competências' },
  { value: 'ASSESSMENT', label: 'Avaliação' },
];

export default function CreateReportDialog({ open, onClose, onCreated }: Props) {
  const isAdmin = useIsAdmin();
  const types = isAdmin ? ADMIN_TYPES : USER_TYPES;

  const [type, setType] = useState<ReportType>('INDIVIDUAL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupId, setGroupId] = useState('');
  const [assessmentId, setAssessmentId] = useState('');
  const [competencyId, setCompetencyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await createReport(type, {
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        groupId: groupId ? Number(groupId) : null,
        assessmentId: assessmentId ? Number(assessmentId) : null,
        competencyId: competencyId ? Number(competencyId) : null,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar relatório.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Solicitar Novo Relatório</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} mt={0.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <FormControl fullWidth>
            <InputLabel id="report-type-label">Tipo de Relatório</InputLabel>
            <Select
              labelId="report-type-label"
              value={type}
              label="Tipo de Relatório"
              onChange={(e) => setType(e.target.value as ReportType)}
            >
              {types.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {type === 'GROUP' && (
            <TextField
              label="ID do Grupo"
              type="number"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              required
              fullWidth
            />
          )}

          {type === 'ASSESSMENT' && (
            <TextField
              label="ID da Avaliação"
              type="number"
              value={assessmentId}
              onChange={(e) => setAssessmentId(e.target.value)}
              required
              fullWidth
            />
          )}

          {type === 'COMPETENCY' && isAdmin && (
            <TextField
              label="ID da Competência (opcional — deixe em branco para todas)"
              type="number"
              value={competencyId}
              onChange={(e) => setCompetencyId(e.target.value)}
              fullWidth
            />
          )}

          <Stack direction="row" spacing={2}>
            <TextField
              label="Data inicial"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Data final"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {loading ? 'Solicitando…' : 'Solicitar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
