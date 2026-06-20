import { apiClient } from './axiosClient';

export interface CharacterInfo {
  characterId: number;
  characterName: string;
}

export async function getMe(): Promise<CharacterInfo> {
  const { data } = await apiClient.get('/auth/me');
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function deleteAccount(): Promise<void> {
  await apiClient.delete('/auth/account');
}
