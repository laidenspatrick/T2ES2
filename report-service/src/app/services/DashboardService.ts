import {
  getAllAssessments,
  getAllSubmittedResponses,
  getAllCompetencies,
  getAllGroups,
  getAllUsers,
} from './ExternalServiceClient.js';

export async function getDashboardSummary(token: string) {
  const [assessments, responses, competencies, groups, users] = await Promise.allSettled([
    getAllAssessments(token),
    getAllSubmittedResponses(token),
    getAllCompetencies(token),
    getAllGroups(token),
    getAllUsers(token),
  ]);

  const value = <T>(r: PromiseSettledResult<T>, fallback: T): T =>
    r.status === 'fulfilled' ? r.value : fallback;

  const assessmentList: any[] = value(assessments, { data: [] })?.data ?? value(assessments, []);
  const responseList: any[] = value(responses, { data: [] })?.data ?? value(responses, []);
  const competencyList: any[] = value(competencies, { data: [] })?.data ?? value(competencies, []);
  const groupList: any[] = value(groups, { data: [] })?.data ?? value(groups, []);
  const userList: any[] = value(users, { data: [] })?.data ?? value(users, []);

  const submittedResponses = responseList.filter((r: any) => r.status === 'SUBMITTED');

  // Distribuição de competências (último nível de cada resposta)
  const competencyDist: Record<number, { name: string; levelCounts: Record<number, number> }> = {};
  for (const r of submittedResponses) {
    for (const cr of r.categoryResults ?? []) {
      if (!competencyDist[cr.competencyId]) {
        competencyDist[cr.competencyId] = { name: cr.competencyName ?? '', levelCounts: {} };
      }
      const lvl = cr.levelId ?? 0;
      competencyDist[cr.competencyId].levelCounts[lvl] =
        (competencyDist[cr.competencyId].levelCounts[lvl] ?? 0) + 1;
    }
  }

  const competencyDistributions = Object.entries(competencyDist).map(([id, info]) => ({
    competencyId: Number(id),
    competencyName: info.name,
    levelDistribution: Object.entries(info.levelCounts).map(([levelId, count]) => ({
      levelId: Number(levelId),
      count,
    })),
  }));

  // Progresso por grupo (contagem de avaliados)
  const groupProgress = groupList.slice(0, 20).map((g: any) => ({
    groupId: g.id,
    groupName: g.name ?? null,
    totalMembers: g.memberCount ?? null,
    assessmentsCompleted: submittedResponses.filter((r: any) =>
      (g.memberIds ?? []).includes(r.userId),
    ).length,
  }));

  return {
    totalUsers: userList.length,
    totalGroups: groupList.length,
    totalAssessments: assessmentList.length,
    totalCompetencies: competencyList.length,
    completedAssessments: submittedResponses.length,
    competencyDistributions,
    groupProgress,
  };
}

export async function getDashboardTopPerformers(
  token: string,
  competencyId: number,
  limit = 10,
) {
  const responses = await getAllSubmittedResponses(token);
  const respList: any[] = Array.isArray(responses) ? responses : responses.data ?? [];

  const userBest: Record<number, { userId: number; levelId: number; levelName: string }> = {};

  for (const r of respList) {
    for (const cr of r.categoryResults ?? []) {
      if (Number(cr.competencyId) !== competencyId) continue;
      const existing = userBest[r.userId];
      if (!existing || cr.levelId > existing.levelId) {
        userBest[r.userId] = {
          userId: r.userId,
          levelId: cr.levelId,
          levelName: cr.levelName ?? null,
        };
      }
    }
  }

  return Object.values(userBest)
    .sort((a, b) => b.levelId - a.levelId)
    .slice(0, limit);
}

export async function getDashboardCompletionRates(token: string) {
  const [assessments, responses] = await Promise.all([
    getAllAssessments(token),
    getAllSubmittedResponses(token),
  ]);

  const assessmentList: any[] = Array.isArray(assessments) ? assessments : assessments.data ?? [];
  const respList: any[] = Array.isArray(responses) ? responses : responses.data ?? [];

  return assessmentList.map((a: any) => {
    const total = respList.filter((r: any) => r.assessmentId === a.id).length;
    const completed = respList.filter(
      (r: any) => r.assessmentId === a.id && r.status === 'SUBMITTED',
    ).length;

    return {
      assessmentId: a.id,
      assessmentTitle: a.title ?? null,
      totalStarted: total,
      totalCompleted: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
    };
  });
}
