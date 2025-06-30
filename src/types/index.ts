export interface Player {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
  team: string;
  stats: PlayerStats;
  projections: PlayerStats;
  adp: number; // Average Draft Position
  tier: number;
  injury_status?: 'healthy' | 'questionable' | 'doubtful' | 'out';
  bye_week: number;
}

export interface PlayerStats {
  passingYards?: number;
  passingTouchdowns?: number;
  interceptions?: number;
  rushingYards?: number;
  rushingTouchdowns?: number;
  receivingYards?: number;
  receivingTouchdowns?: number;
  receptions?: number;
  targets?: number;
  touchdowns?: number;
  fantasyPoints?: number;
}

export interface DraftPick {
  pick: number;
  round: number;
  player: Player;
  team: string;
  timestamp: Date;
}

export interface DraftSettings {
  priorityStats: string[];
  positionPriority: string[];
  riskTolerance: 'low' | 'medium' | 'high';
  draftStrategy: 'aggressive' | 'balanced' | 'conservative';
}

export interface League {
  id: string;
  name: string;
  platform: 'espn' | 'yahoo' | 'sleeper';
  teams: number;
  scoring: 'standard' | 'ppr' | 'half-ppr';
}