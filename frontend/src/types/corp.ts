export interface CorpAllianceEntry {
  allianceId?: number;
  allianceName?: string;
  startDate?: string;
  endDate?: string;
}

export interface CorpMemberSnapshot {
  members: number;
  snappedAt: string;
}

export interface CorpMemberEntry {
  characterId: number;
  characterName: string;
}

export interface CorpMemberEventEntry {
  characterId: number;
  characterName: string;
  eventType: 'JOINED' | 'LEFT';
  occurredAt: string;
}

export interface CorpProfile {
  corpId: number;
  name?: string;
  ticker?: string;
  faction?: string;
  tagline?: string;
  pitch?: string;
  requirements?: string[];
  content?: string[];
  rolesLooking?: string[];
  languages?: string[];
  tzHours?: number[];
  hrIds?: number[];
  status?: 'open' | 'selective' | 'closed';
  updatedAt?: string;
  members?: number;
  capacity?: number;
  alliance?: string;
  founded?: number;
  killsLast30?: number;
  efficiency?: number;
  ceoId?: number;
  ceoLoginRequired?: boolean;
  lastSyncedAt?: string;
  allianceHistory?: CorpAllianceEntry[];
  memberHistory?: CorpMemberSnapshot[];
  roster?: CorpMemberEntry[];
  memberEvents?: CorpMemberEventEntry[];
}

export interface CorpSearchResult {
  corpId: number;
  name?: string;
  ticker?: string;
  alliance?: string;
  faction?: string;
  tagline?: string;
  status?: 'open' | 'selective' | 'closed';
  members?: number;
  minSp?: number;
  tz?: string;
  content?: string[];
  efficiency?: number;
  fitScore?: number;
}
