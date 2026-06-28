export interface SkillDto {
  skillName: string;
  level: number;
  points: number;
  category?: string;
}

export interface RecentSkillDto {
  skillName: string;
  level: number;
  learnedAt: string;
}

export interface KillEventDto {
  kind: 'kill' | 'loss';
  ship: string;
  shipTypeId?: number;
  system: string;
  isk: string;
  whenAt: string;
  finalBlow: boolean;
  victimName?: string;
}

export interface CorpHistoryDto {
  corpId?: number;
  fromDate: string;
  toDate: string | null;
  corpName: string;
  alliance: string | null;
  durationLabel: string;
}

export interface PilotProfile {
  characterId: number;
  name?: string;
  ticker?: string;
  corp?: string;
  title?: string;
  bio?: string;
  eveBio?: string;
  lookingFor?: string;
  roles?: string[];
  content?: string[];
  activity?: string;
  voice?: string;
  languages?: string[];
  verified: boolean;
  isPublic?: boolean;
  updatedAt?: string;
  sp?: number;
  spByCat?: Record<string, number>;
  tz?: string;
  tzActive?: number[];
  tzPeak?: number[];
  manualTzActive?: number[];
  lang?: string[];
  kbKills?: number;
  kbLosses?: number;
  soloKills?: number;
  kbEfficiency?: number;
  iskDestroyed?: number;
  iskLost?: number;
  heatmap?: number[][];
  lastSyncedAt?: string;
  skills?: SkillDto[];
  skillQueue?: SkillDto[];
  recentSkills?: RecentSkillDto[];
  killHistory?: KillEventDto[];
  corpHistory?: CorpHistoryDto[];
}

export interface PilotSearchResult {
  characterId: number;
  name?: string;
  ticker?: string;
  corp?: string;
  sp?: number;
  tz?: string;
  tzActive?: number[];
  tzPeak?: number[];
  roles?: string[];
  content?: string[];
  kbEfficiency?: number;
  kbKills?: number;
  kbLosses?: number;
  lastSyncedAt?: string;
}
