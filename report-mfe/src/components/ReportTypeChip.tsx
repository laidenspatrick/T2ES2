import Chip from '@mui/material/Chip';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { ReportType } from '../types';

const META: Record<ReportType, { label: string; icon: React.ReactElement; color: 'primary' | 'secondary' | 'info' | 'warning' }> = {
  INDIVIDUAL: { label: 'Individual', icon: <PersonIcon />, color: 'primary' },
  GROUP: { label: 'Grupo', icon: <GroupIcon />, color: 'secondary' },
  COMPETENCY: { label: 'Competência', icon: <PsychologyIcon />, color: 'info' },
  ASSESSMENT: { label: 'Avaliação', icon: <AssignmentIcon />, color: 'warning' },
};

export default function ReportTypeChip({ type }: { type: ReportType }) {
  const { label, icon, color } = META[type];
  return <Chip label={label} icon={icon} color={color} size="small" variant="outlined" />;
}
