import { useState } from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import DownloadIcon from '@mui/icons-material/Download';
import { ExportFormat } from '../types';
import { createExport, pollExportJob } from '../api/reportApi';

interface Props {
  reportId: number;
  disabled?: boolean;
}

const FORMATS: ExportFormat[] = ['PDF', 'CSV', 'XLSX'];

export default function ExportButton({ reportId, disabled }: Props) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    setErrorMsg(null);
    try {
      const job = await createExport(reportId, format);
      const done = await pollExportJob(job.id);

      if (done.status === 'DONE' && done.downloadUrl) {
        // Faz download via anchor tag
        const a = document.createElement('a');
        a.href = done.downloadUrl;
        a.download = `relatorio-${reportId}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        setErrorMsg('Falha ao gerar exportação. Tente novamente.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao exportar.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <Tooltip title={errorMsg ?? 'Exportar relatório'} arrow>
      <span>
        <ButtonGroup size="small" variant="outlined" disabled={disabled}>
          {FORMATS.map((fmt) => (
            <Button
              key={fmt}
              onClick={() => handleExport(fmt)}
              disabled={!!exporting}
              startIcon={
                exporting === fmt ? (
                  <CircularProgress size={14} />
                ) : (
                  <DownloadIcon fontSize="small" />
                )
              }
            >
              {fmt}
            </Button>
          ))}
        </ButtonGroup>
      </span>
    </Tooltip>
  );
}
