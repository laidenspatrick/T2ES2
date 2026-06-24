import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusChip from '../StatusChip';
import ReportTypeChip from '../ReportTypeChip';

describe('StatusChip', () => {
  it('renderiza PENDING como "Pendente"', () => {
    render(<StatusChip status="PENDING" />);
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('renderiza READY como "Pronto"', () => {
    render(<StatusChip status="READY" />);
    expect(screen.getByText('Pronto')).toBeInTheDocument();
  });

  it('renderiza FAILED como "Falhou"', () => {
    render(<StatusChip status="FAILED" />);
    expect(screen.getByText('Falhou')).toBeInTheDocument();
  });

  it('renderiza DONE como "Concluído"', () => {
    render(<StatusChip status="DONE" />);
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  it('renderiza PROCESSING como "Processando…"', () => {
    render(<StatusChip status="PROCESSING" />);
    expect(screen.getByText('Processando…')).toBeInTheDocument();
  });
});

describe('ReportTypeChip', () => {
  it('renderiza tipo INDIVIDUAL', () => {
    render(<ReportTypeChip type="INDIVIDUAL" />);
    expect(screen.getByText('Individual')).toBeInTheDocument();
  });

  it('renderiza tipo GROUP', () => {
    render(<ReportTypeChip type="GROUP" />);
    expect(screen.getByText('Grupo')).toBeInTheDocument();
  });

  it('renderiza tipo COMPETENCY', () => {
    render(<ReportTypeChip type="COMPETENCY" />);
    expect(screen.getByText('Competência')).toBeInTheDocument();
  });

  it('renderiza tipo ASSESSMENT', () => {
    render(<ReportTypeChip type="ASSESSMENT" />);
    expect(screen.getByText('Avaliação')).toBeInTheDocument();
  });
});
