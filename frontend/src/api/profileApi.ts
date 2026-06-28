import { apiClient } from './axiosClient';
import type { PilotProfile, PilotSearchResult } from '../types/pilot';
import type { CorpProfile, CorpSearchResult } from '../types/corp';

export interface GlobalSearchResult {
  type: 'pilot' | 'corp';
  id: number;
  name: string;
  ticker: string | null;
}

export async function getPilot(characterId: number): Promise<PilotProfile> {
  const { data } = await apiClient.get(`/profiles/pilot/${characterId}`);
  return data;
}

export async function updatePilot(profile: Partial<PilotProfile>): Promise<PilotProfile> {
  const { data } = await apiClient.put('/profiles/pilot', profile);
  return data;
}

export async function getCorp(corpId: number): Promise<CorpProfile> {
  const { data } = await apiClient.get(`/profiles/corp/${corpId}`);
  return data;
}

export interface UpdateCorpRequest {
  tagline?: string;
  pitch?: string;
  requirements?: string[];
  content?: string[];
  status?: 'open' | 'selective' | 'closed';
  rolesLooking?: string[];
  languages?: string[];
  tzHours?: number[];
  hrIds?: number[];
  isPublic?: boolean;
}

export async function updateCorp(corpId: number, req: UpdateCorpRequest): Promise<CorpProfile> {
  const { data } = await apiClient.put(`/profiles/corp/${corpId}`, req);
  return data;
}

export async function syncCorp(corpId: number): Promise<{ status: string }> {
  const { data } = await apiClient.post(`/profiles/corp/${corpId}/sync`);
  return data;
}

export interface PilotSearchParams {
  tz?: string;
  minSp?: number;
  minEff?: number;
  roles?: string;
  content?: string;
  activity?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export async function searchPilots(params: PilotSearchParams): Promise<PilotSearchResult[]> {
  const { data } = await apiClient.get('/search/pilots', { params });
  return Array.isArray(data) ? data : data.content ?? [];
}

export interface CorpSearchParams {
  tz?: string;
  content?: string;
  maxMinSp?: number;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export async function searchCorps(params: CorpSearchParams): Promise<CorpSearchResult[]> {
  const { data } = await apiClient.get('/search/corps', { params });
  return Array.isArray(data) ? data : data.content ?? [];
}

export async function globalSearch(q: string, limit = 5): Promise<GlobalSearchResult[]> {
  const { data } = await apiClient.get('/search/global', { params: { q, limit } });
  return Array.isArray(data) ? data : [];
}
