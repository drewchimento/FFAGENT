import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Player, DraftPick, DraftSettings } from '../types';

interface DraftContextType {
  players: Player[];
  draftedPlayers: DraftPick[];
  currentPick: number;
  isLiveDraft: boolean;
  draftSettings: DraftSettings;
  recommendations: Player[];
  setPlayers: (players: Player[]) => void;
  addDraftPick: (pick: DraftPick) => void;
  updateDraftSettings: (settings: Partial<DraftSettings>) => void;
  startLiveDraft: () => void;
  stopLiveDraft: () => void;
  getRecommendations: () => Player[];
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

export const useDraft = () => {
  const context = useContext(DraftContext);
  if (context === undefined) {
    throw new Error('useDraft must be used within a DraftProvider');
  }
  return context;
};

interface DraftProviderProps {
  children: ReactNode;
}

export const DraftProvider: React.FC<DraftProviderProps> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [draftedPlayers, setDraftedPlayers] = useState<DraftPick[]>([]);
  const [currentPick, setCurrentPick] = useState(1);
  const [isLiveDraft, setIsLiveDraft] = useState(false);
  const [recommendations, setRecommendations] = useState<Player[]>([]);
  const [draftSettings, setDraftSettings] = useState<DraftSettings>({
    priorityStats: ['passingYards', 'rushingYards', 'receivingYards', 'touchdowns'],
    positionPriority: ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'],
    riskTolerance: 'medium',
    draftStrategy: 'balanced',
  });

  const addDraftPick = (pick: DraftPick) => {
    setDraftedPlayers(prev => [...prev, pick]);
    setCurrentPick(prev => prev + 1);
    
    // Update recommendations after each pick
    updateRecommendations();
  };

  const updateDraftSettings = (settings: Partial<DraftSettings>) => {
    setDraftSettings(prev => ({ ...prev, ...settings }));
    updateRecommendations();
  };

  const startLiveDraft = () => {
    setIsLiveDraft(true);
    updateRecommendations();
  };

  const stopLiveDraft = () => {
    setIsLiveDraft(false);
  };

  const updateRecommendations = () => {
    // AI-powered recommendation logic
    const availablePlayers = players.filter(
      player => !draftedPlayers.some(pick => pick.player.id === player.id)
    );

    const scored = availablePlayers.map(player => ({
      ...player,
      score: calculatePlayerScore(player, draftSettings, draftedPlayers),
    }));

    const topRecommendations = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setRecommendations(topRecommendations);
  };

  const getRecommendations = () => recommendations;

  const value = {
    players,
    draftedPlayers,
    currentPick,
    isLiveDraft,
    draftSettings,
    recommendations,
    setPlayers,
    addDraftPick,
    updateDraftSettings,
    startLiveDraft,
    stopLiveDraft,
    getRecommendations,
  };

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
};

// AI scoring algorithm
function calculatePlayerScore(
  player: Player,
  settings: DraftSettings,
  draftedPlayers: DraftPick[]
): number {
  let score = 0;

  // Base score from player stats
  settings.priorityStats.forEach(stat => {
    const statValue = player.stats[stat] || 0;
    score += statValue * getStatWeight(stat, settings.draftStrategy);
  });

  // Position scarcity bonus
  const positionDrafted = draftedPlayers.filter(
    pick => pick.player.position === player.position
  ).length;
  const positionScarcity = Math.max(0, 10 - positionDrafted);
  score += positionScarcity * 50;

  // Risk adjustment
  const riskMultiplier = settings.riskTolerance === 'high' ? 1.2 : 
                        settings.riskTolerance === 'low' ? 0.8 : 1.0;
  score *= riskMultiplier;

  return score;
}

function getStatWeight(stat: string, strategy: string): number {
  const weights: Record<string, Record<string, number>> = {
    aggressive: {
      touchdowns: 15,
      passingYards: 0.04,
      rushingYards: 0.1,
      receivingYards: 0.1,
    },
    conservative: {
      touchdowns: 8,
      passingYards: 0.06,
      rushingYards: 0.12,
      receivingYards: 0.12,
    },
    balanced: {
      touchdowns: 12,
      passingYards: 0.05,
      rushingYards: 0.11,
      receivingYards: 0.11,
    },
  };

  return weights[strategy]?.[stat] || 1;
}