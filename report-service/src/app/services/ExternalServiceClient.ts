import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const ASSESSMENT_URL = process.env.ASSESSMENT_SERVICE_URL ?? 'http://localhost:3002/api/v1';
const COMPETENCY_URL = process.env.COMPETENCY_SERVICE_URL ?? 'http://localhost:3003/api/v1';
const USER_GROUP_URL = process.env.USER_GROUP_SERVICE_URL ?? 'http://localhost:3004/api/v1';

/**
 * Cria um cliente axios com o token JWT repassado (service-to-service).
 */
function createClient(baseURL: string, token?: string) {
  return axios.create({
    baseURL,
    timeout: 10_000,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// ─── Assessment Service ──────────────────────────────────────────────────────

export async function getSubmittedResponsesByUser(userId: number, token: string, dateFrom?: string | null, dateTo?: string | null) {
  const client = createClient(ASSESSMENT_URL, token);
  const params: Record<string, string | number> = { userId, status: 'SUBMITTED' };
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  const { data } = await client.get('/responses', { params });
  return data;
}

export async function getAllAssessments(token: string) {
  const client = createClient(ASSESSMENT_URL, token);
  const { data } = await client.get('/assessments');
  return data;
}

export async function getAllSubmittedResponses(token: string, dateFrom?: string | null, dateTo?: string | null) {
  const client = createClient(ASSESSMENT_URL, token);
  const params: Record<string, string> = { status: 'SUBMITTED' };
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  const { data } = await client.get('/responses', { params });
  return data;
}

export async function getResponsesByAssessment(assessmentId: number, token: string) {
  const client = createClient(ASSESSMENT_URL, token);
  const { data } = await client.get(`/responses`, { params: { assessmentId } });
  return data;
}

// ─── Competency Service ──────────────────────────────────────────────────────

export async function getAllCompetencies(token: string) {
  const client = createClient(COMPETENCY_URL, token);
  const { data } = await client.get('/competencies');
  return data;
}

export async function getCompetencyById(competencyId: number, token: string) {
  const client = createClient(COMPETENCY_URL, token);
  const { data } = await client.get(`/competencies/${competencyId}`);
  return data;
}

// ─── User & Group Service ────────────────────────────────────────────────────

export async function getAllUsers(token: string) {
  const client = createClient(USER_GROUP_URL, token);
  const { data } = await client.get('/users');
  return data;
}

export async function getGroupById(groupId: number, token: string) {
  const client = createClient(USER_GROUP_URL, token);
  const { data } = await client.get(`/groups/${groupId}`);
  return data;
}

export async function getGroupMembers(groupId: number, token: string) {
  const client = createClient(USER_GROUP_URL, token);
  const { data } = await client.get(`/groups/${groupId}/members`);
  return data;
}

export async function getAllGroups(token: string) {
  const client = createClient(USER_GROUP_URL, token);
  const { data } = await client.get('/groups');
  return data;
}
