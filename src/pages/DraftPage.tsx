import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useDraft } from '../contexts/DraftContext';
import { 
  Play, 
  Pause, 
  Star, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Player } from '../types';
import toast from 'react-hot-toast';

export const DraftPage: React.FC = () => {
  const {
    isLiveDraft,
    currentPick,
    recommendations,
    draftedPlayers,
    startLiveDraft,
    stopLiveDraft,
    addDraftPick,
  } = useDraft();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Mock player data - in production, this would come from an API
  const mockPlayers: Player[] = [
    {
      id: '1',
      name: 'Josh Allen',
      position: 'QB',
      team: 'BUF',
      adp: 2.5,
      tier: 1,
      bye_week: 7,
      stats: {
        passingYards: 4306,
        passingTouchdowns: 29,
        rushingYards: 524,
        rushingTouchdowns: 15,
        fantasyPoints: 398.2,
      },
      projections: {
        passingYards: 4200,
        passingTouchdowns: 28,
        rushingYards: 500,
        rushingTouchdowns: 12,
        fantasyPoints: 380,
      },
    },
    {
      id: '2',
      name: 'Christian McCaffrey',
      position: 'RB',
      team: 'SF',
      adp: 1.2,
      tier: 1,
      bye_week: 9,
      stats: {
        rushingYards: 1459,
        rushingTouchdowns: 14,
        receivingYards: 564,
        receivingTouchdowns: 7,
        receptions: 67,
        fantasyPoints: 356.3,
      },
      projections: {
        rushingYards: 1400,
        rushingTouchdowns: 12,
        receivingYards: 600,
        receivingTouchdowns: 6,
        receptions: 70,
        fantasyPoints: 340,
      },
    },
    // Add more mock players as needed
  ];

  useEffect(() => {
    // In production, you would fetch real player data here
    // For now, we'll use mock data
  }, []);

  const handleDraftPlayer = (player: Player) => {
    const pick = {
      pick: currentPick,
      round: Math.ceil(currentPick / 12),
      player,
      team: 'Your Team',
      timestamp: new Date(),
    };

    addDraftPick(pick);
    setSelectedPlayer(null);
    toast.success(`Drafted ${player.name}!`);
  };

  const toggleLiveDraft = () => {
    if (isLiveDraft) {
      stopLiveDraft();
      toast.success('Live draft stopped');
    } else {
      startLiveDraft();
      toast.success('Live draft started!');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Draft Assistant</h1>
              <p className="text-gray-600 mt-1">
                Pick #{currentPick} • Round {Math.ceil(currentPick / 12)}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={toggleLiveDraft}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  isLiveDraft
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isLiveDraft ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Stop Draft
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Draft
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Draft Status */}
        {isLiveDraft && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Live Draft Active
                </p>
                <p className="text-sm text-green-700">
                  AI recommendations are being generated in real-time based on your settings.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Recommendations */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  AI Recommendations
                </h2>
                <div className="flex items-center text-sm text-gray-500">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  Updated live
                </div>
              </div>

              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.slice(0, 8).map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-yellow-100 text-yellow-600' :
                            index === 1 ? 'bg-gray-100 text-gray-600' :
                            index === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {index < 3 ? <Star className="h-4 w-4" /> : index + 1}
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{player.name}</p>
                          <p className="text-xs text-gray-500">
                            {player.position} - {player.team} • ADP: {player.adp}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {player.projections.fantasyPoints?.toFixed(1)} pts
                        </p>
                        <p className="text-xs text-gray-500">projected</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {isLiveDraft 
                      ? 'Generating recommendations...' 
                      : 'Start live draft to see AI recommendations'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Draft Board & Actions */}
          <div className="space-y-6">
            {/* Current Pick */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Pick</h3>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">#{currentPick}</p>
                <p className="text-sm text-gray-600">Round {Math.ceil(currentPick / 12)}</p>
              </div>
            </div>

            {/* Recent Picks */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Picks</h3>
              {draftedPlayers.length > 0 ? (
                <div className="space-y-3">
                  {draftedPlayers.slice(-5).reverse().map((pick) => (
                    <div key={pick.pick} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{pick.player.name}</p>
                        <p className="text-gray-500">{pick.player.position} - {pick.player.team}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900">#{pick.pick}</p>
                        <p className="text-gray-500">R{pick.round}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">
                  No picks yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Player Detail Modal */}
        {selectedPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedPlayer.name}</h2>
                    <p className="text-gray-600">{selectedPlayer.position} - {selectedPlayer.team}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{selectedPlayer.adp}</p>
                    <p className="text-sm text-gray-600">ADP</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{selectedPlayer.bye_week}</p>
                    <p className="text-sm text-gray-600">Bye Week</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">2023 Stats</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(selectedPlayer.stats).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDraftPlayer(selectedPlayer)}
                    className="btn-primary flex-1"
                  >
                    Draft Player
                  </button>
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};