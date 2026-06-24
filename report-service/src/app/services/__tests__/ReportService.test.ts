/**
 * Testes unitários — ReportService
 *
 * As dependências externas (TypeORM repositories e ExternalServiceClient)
 * são completamente mockadas para que os testes rodem sem banco de dados
 * nem outros microsserviços.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ── Mocks globais ─────────────────────────────────────────────────────────────
const mockSave = jest.fn<(...args: any[]) => any>();
const mockCreate = jest.fn<(...args: any[]) => any>((entity: object) => entity);
const mockFindOne = jest.fn<(...args: any[]) => any>();
const mockFind = jest.fn<(...args: any[]) => any>();
const mockUpdate = jest.fn<(...args: any[]) => any>();
const mockRemove = jest.fn<(...args: any[]) => any>();
const mockFindOneOrFail = jest.fn<(...args: any[]) => any>();

const mockQb = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
};

const mockCreateQueryBuilder = jest.fn(() => mockQb);

jest.mock('../../repositories/ReportRepository.js', () => ({
  ReportRepository: {
    create: mockCreate,
    save: mockSave,
    findOne: mockFindOne,
    find: mockFind,
    update: mockUpdate,
    remove: mockRemove,
    findOneOrFail: mockFindOneOrFail,
    createQueryBuilder: mockCreateQueryBuilder,
  },
  ReportSnapshotRepository: {
    create: mockCreate,
    save: mockSave,
    findOne: mockFindOne,
  },
}));

const mockGetSubmittedResponsesByUser = jest.fn<(...args: any[]) => any>();
const mockGetAllCompetencies = jest.fn<(...args: any[]) => any>();

jest.mock('../../services/ExternalServiceClient.js', () => ({
  getSubmittedResponsesByUser: (...args: unknown[]) => mockGetSubmittedResponsesByUser(...args),
  getAllCompetencies: (...args: unknown[]) => mockGetAllCompetencies(...args),
  getGroupById: jest.fn<(...args: any[]) => any>().mockResolvedValue({ name: 'Grupo Teste' }),
  getGroupMembers: jest.fn<(...args: any[]) => any>().mockResolvedValue([]),
  getResponsesByAssessment: jest.fn<(...args: any[]) => any>().mockResolvedValue([]),
  getAllAssessments: jest.fn<(...args: any[]) => any>().mockResolvedValue([]),
}));

// ── Import do serviço (após mocks) ────────────────────────────────────────────
import * as ReportService from '../../services/ReportService.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const BASE_REPORT = {
  id: 1,
  type: 'INDIVIDUAL' as const,
  status: 'READY' as const,
  requestedByUserId: 10,
  filterAssessmentId: null,
  filterUserId: null,
  filterGroupId: null,
  filterCompetencyId: null,
  filterDateFrom: null,
  filterDateTo: null,
  createdAt: new Date(),
  readyAt: new Date(),
  expiresAt: new Date(),
  exportJobs: [],
  snapshot: { id: 1, reportId: 1, data: { userId: 10 }, generatedAt: new Date(), report: {} as any },
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('ReportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createReport ────────────────────────────────────────────────────────────
  describe('createReport', () => {
    it('cria relatório INDIVIDUAL para usuário comum', async () => {
      const savedReport = { ...BASE_REPORT, status: 'PENDING' };
      mockSave.mockResolvedValue(savedReport);

      const result = await ReportService.createReport(
        { type: 'INDIVIDUAL', filters: {} },
        10,
        false,
      );

      expect(mockCreate).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
      expect(result.type).toBe('INDIVIDUAL');
    });

    it('permite relatório GROUP para ADMIN', async () => {
      const saved = { ...BASE_REPORT, type: 'GROUP' as const, status: 'PENDING' as const };
      mockSave.mockResolvedValue(saved);

      const result = await ReportService.createReport(
        { type: 'GROUP', filters: { groupId: 3 } },
        1,
        true,
      );

      expect(result.type).toBe('GROUP');
    });

    it('lança 403 ao tentar criar relatório GROUP sem ser ADMIN', async () => {
      await expect(
        ReportService.createReport({ type: 'GROUP', filters: {} }, 10, false),
      ).rejects.toMatchObject({ status: 403 });
    });

    it('lança 403 ao tentar criar relatório ASSESSMENT sem ser ADMIN', async () => {
      await expect(
        ReportService.createReport({ type: 'ASSESSMENT', filters: {} }, 10, false),
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  // ── getReport ───────────────────────────────────────────────────────────────
  describe('getReport', () => {
    it('retorna relatório para o próprio dono', async () => {
      mockFindOne.mockResolvedValue(BASE_REPORT);

      const result = await ReportService.getReport(1, 10, false);

      expect(result).toHaveProperty('id', 1);
    });

    it('retorna relatório de outro usuário para ADMIN', async () => {
      mockFindOne.mockResolvedValue(BASE_REPORT);

      const result = await ReportService.getReport(1, 99, true);

      expect(result).toHaveProperty('id', 1);
    });

    it('lança 404 quando relatório não existe', async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(ReportService.getReport(999, 10, false)).rejects.toMatchObject({
        status: 404,
      });
    });

    it('lança 403 quando usuário acessa relatório de outro usuário', async () => {
      mockFindOne.mockResolvedValue(BASE_REPORT); // requestedByUserId = 10

      await expect(ReportService.getReport(1, 99, false)).rejects.toMatchObject({
        status: 403,
      });
    });
  });

  // ── deleteReport ────────────────────────────────────────────────────────────
  describe('deleteReport', () => {
    it('deleta relatório do próprio usuário', async () => {
      mockFindOne.mockResolvedValue(BASE_REPORT);
      mockRemove.mockResolvedValue(undefined);

      await expect(ReportService.deleteReport(1, 10, false)).resolves.toBeUndefined();
      expect(mockRemove).toHaveBeenCalled();
    });

    it('lança 404 quando relatório não existe', async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(ReportService.deleteReport(999, 10, false)).rejects.toMatchObject({
        status: 404,
      });
    });

    it('lança 403 quando usuário tenta deletar relatório de outro', async () => {
      mockFindOne.mockResolvedValue(BASE_REPORT);

      await expect(ReportService.deleteReport(1, 99, false)).rejects.toMatchObject({
        status: 403,
      });
    });
  });

  // ── listMyReports ────────────────────────────────────────────────────────────
  describe('listMyReports', () => {
    it('retorna lista de relatórios do usuário', async () => {
      mockFind.mockResolvedValue([BASE_REPORT]);

      const result = await ReportService.listMyReports(10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('retorna array vazio quando usuário não tem relatórios', async () => {
      mockFind.mockResolvedValue([]);

      const result = await ReportService.listMyReports(42);

      expect(result).toEqual([]);
    });
  });

  // ── getMyProgress ─────────────────────────────────────────────────────────
  describe('getMyProgress', () => {
    it('retorna progresso por competência', async () => {
      mockGetSubmittedResponsesByUser.mockResolvedValue([
        {
          id: 101,
          assessmentId: 5,
          submittedAt: '2025-03-01T10:00:00Z',
          categoryResults: [
            { competencyId: 1, competencyName: 'Comp A', levelId: 2, levelName: 'Intermediário' },
          ],
        },
      ]);

      const result = await ReportService.getMyProgress(10, 'token-xyz');

      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('competencyId', 1);
      expect(result[0].entries.length).toBe(1);
    });

    it('filtra por competencyId quando informado', async () => {
      mockGetSubmittedResponsesByUser.mockResolvedValue([
        {
          id: 101,
          assessmentId: 5,
          submittedAt: '2025-03-01T10:00:00Z',
          categoryResults: [
            { competencyId: 1, competencyName: 'Comp A', levelId: 2, levelName: 'Intermediário' },
            { competencyId: 2, competencyName: 'Comp B', levelId: 1, levelName: 'Básico' },
          ],
        },
      ]);

      const result = await ReportService.getMyProgress(10, 'token-xyz', 1);

      expect(result.length).toBe(1);
      expect(result[0].competencyId).toBe(1);
    });

    it('retorna array vazio quando não há avaliações submetidas', async () => {
      mockGetSubmittedResponsesByUser.mockResolvedValue([]);

      const result = await ReportService.getMyProgress(10, 'token-xyz');

      expect(result).toEqual([]);
    });
  });
});
