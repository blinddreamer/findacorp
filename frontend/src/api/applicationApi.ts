import { apiClient } from './axiosClient';

export interface ApplicationRequest {
  corpId: number;
  message: string;
  direction?: 'PILOT_TO_CORP' | 'CORP_TO_PILOT';
}

export type ThreadType = 'APPLICATION' | 'DIRECT' | 'SYSTEM';
export type ThreadStatus = 'SENT' | 'READ' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface ThreadResponse {
  id: number;
  type: ThreadType;
  direction: 'PILOT_TO_CORP' | 'CORP_TO_PILOT' | null;
  pilotId: number | null;
  pilotName: string | null;
  corpId: number | null;
  corpName: string | null;
  corpTicker: string | null;
  subject: string | null;
  status: ThreadStatus | null;
  mySide: 'PILOT' | 'CORP' | null;
  unread: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: number;
  threadId: number;
  senderId: number | null; // null = system message
  body: string;
  sentAt: string;
}

/** Pilot creates an application to a corp. */
export async function createApplication(req: ApplicationRequest): Promise<ThreadResponse> {
  const { data } = await apiClient.post('/inbox/applications', req);
  return data;
}

export interface DirectMessageRequest {
  pilotId: number;
  message: string;
}

/** Recruiter sends a direct message to a pilot (no application required). */
export async function createDirectMessage(req: DirectMessageRequest): Promise<ThreadResponse> {
  const { data } = await apiClient.post('/inbox/direct', req);
  return data;
}

/** All threads the current user participates in (applications, DMs, system notices). */
export async function getThreads(): Promise<ThreadResponse[]> {
  const { data } = await apiClient.get('/inbox');
  return Array.isArray(data) ? data : data.content ?? [];
}

export async function getThreadMessages(threadId: number): Promise<MessageResponse[]> {
  const { data } = await apiClient.get(`/inbox/${threadId}/messages`);
  return Array.isArray(data) ? data : [];
}

export async function sendThreadMessage(threadId: number, body: string): Promise<MessageResponse> {
  const { data } = await apiClient.post(`/inbox/${threadId}/messages`, { body });
  return data;
}

export async function updateThreadStatus(
  threadId: number,
  status: 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'READ' | 'UNDER_REVIEW'
): Promise<ThreadResponse> {
  const { data } = await apiClient.put(`/inbox/${threadId}/status`, { status });
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get('/inbox/unread-count');
  return data?.count ?? 0;
}
