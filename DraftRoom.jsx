import React, { useState, useEffect } from 'react';
import { useDraftRoom } from '../hooks/useSocket.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Badge } from './ui/badge.jsx';
import { Input } from './ui/input.jsx';

const DraftRoom = ({ draftId, onExit }) => {
  const {
    draftState,
    participants,
    recommendations,
    availablePlayers,
    recentPicks,
    timer,
    loading,
    error,
    joinDraft,
    leaveDraft,
    makePick,
    searchPlayers
  } = useDraftRoom(draftId);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [teamPosition, setTeamPosition] = useState(1);

  useEffect(() => {
    // Join draft when component mounts
    joinDraft(teamPosition);

    return () => {
      // Leave draft when component unmounts
      leaveDraft();
    };
  }, [joinDraft, leaveDraft, teamPosition]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    searchPlayers(term, selectedPosition || null);
  };

  const handlePositionFilter = (position) => {
    setSelectedPosition(position);
    searchPlayers(searchTerm, position || null);
  };

  const handleMakePick = (playerId) => {
    if (window.confirm('Are you sure you want to draft this player?')) {
      makePick(playerId);
    }
  };

  const isMyTurn = draftState?.current_team === teamPosition;
  const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Joining draft room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Draft Room Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onExit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Live Draft</h1>
          <button
            onClick={onExit}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Exit Draft
          </button>
        </div>

        {/* Draft Status */}
        {draftState && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Round</p>
                  <p className="text-xl font-bold">{draftState.current_round}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pick</p>
                  <p className="text-xl font-bold">{draftState.current_pick}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Team</p>
                  <p className="text-xl font-bold">Team {draftState.current_team}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={isMyTurn ? "default" : "secondary"}>
                    {isMyTurn ? "Your Turn!" : "Waiting..."}
                  </Badge>
                </div>
              </div>

              {/* Timer */}
              {timer && timer.is_active && (
                <div className="mt-4 text-center">
                  <div className="text-lg font-semibold text-red-600">
                    Time Remaining: {Math.floor(timer.time_remaining / 60)}:{(timer.time_remaining % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(timer.time_remaining / timer.total_time) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Recommendations */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">🤖</span>
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div
                      key={rec.player_id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isMyTurn ? 'hover:bg-blue-50 hover:border-blue-300' : 'opacity-50'
                      }`}
                      onClick={() => isMyTurn && handleMakePick(rec.player_id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{rec.player_name}</p>
                          <p className="text-sm text-gray-600">{rec.position} - {rec.team}</p>
                        </div>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        <p>Score: {rec.recommendation_score?.toFixed(1)}</p>
                        <p className="mt-1">{rec.reasoning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recommendations available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Picks */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Picks</CardTitle>
            </CardHeader>
            <CardContent>
              {recentPicks.length > 0 ? (
                <div className="space-y-2">
                  {recentPicks.slice().reverse().map((pick) => (
                    <div key={pick.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{pick.player?.full_name}</p>
                        <p className="text-sm text-gray-600">{pick.player?.position} - {pick.player?.team}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Team {pick.team_position}</p>
                        <p className="text-xs text-gray-500">Pick {pick.pick_number}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No picks yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Player Search and List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Available Players</CardTitle>
              <div className="space-y-4">
                {/* Search */}
                <Input
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />

                {/* Position Filter */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handlePositionFilter('')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedPosition === '' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    All
                  </button>
                  {positions.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => handlePositionFilter(pos)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedPosition === pos ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {availablePlayers.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isMyTurn ? 'hover:bg-blue-50 hover:border-blue-300' : 'opacity-50'
                    }`}
                    onClick={() => isMyTurn && handleMakePick(player.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{player.full_name}</p>
                        <p className="text-sm text-gray-600">{player.position} - {player.team}</p>
                      </div>
                      <Badge variant="outline">{player.position}</Badge>
                    </div>
                    {player.stats && (
                      <div className="mt-2 text-xs text-gray-500">
                        <div className="grid grid-cols-2 gap-2">
                          {player.stats.fantasy_points && (
                            <span>FP: {player.stats.fantasy_points}</span>
                          )}
                          {player.stats.adp && (
                            <span>ADP: {player.stats.adp}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {availablePlayers.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No players found. Try adjusting your search or filters.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Participants */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Draft Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {participants.map((participant) => (
              <div
                key={participant.user_id}
                className={`p-3 border rounded-lg text-center ${
                  draftState?.current_team === participant.team_position
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <p className="font-medium">{participant.username}</p>
                <p className="text-sm text-gray-600">Team {participant.team_position}</p>
                <div className="mt-1">
                  <Badge
                    variant={participant.is_active ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {participant.is_active ? "Online" : "Offline"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DraftRoom;

