import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Search, Filter, Star, TrendingUp, TrendingDown } from 'lucide-react';

export const PlayersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [sortBy, setSortBy] = useState('adp');

  // Mock player data - in production, this would come from an API
  const mockPlayers = [
    {
      id: '1',
      name: 'Josh Allen',
      position: 'QB',
      team: 'BUF',
      adp: 2.5,
      tier: 1,
      bye_week: 7,
      stats: { fantasyPoints: 398.2, passingYards: 4306, passingTouchdowns: 29 },
      projections: { fantasyPoints: 380 },
      trend: 'up',
    },
    {
      id: '2',
      name: 'Christian McCaffrey',
      position: 'RB',
      team: 'SF',
      adp: 1.2,
      tier: 1,
      bye_week: 9,
      stats: { fantasyPoints: 356.3, rushingYards: 1459, rushingTouchdowns: 14 },
      projections: { fantasyPoints: 340 },
      trend: 'up',
    },
    {
      id: '3',
      name: 'Cooper Kupp',
      position: 'WR',
      team: 'LAR',
      adp: 8.5,
      tier: 2,
      bye_week: 6,
      stats: { fantasyPoints: 285.1, receivingYards: 1947, receivingTouchdowns: 16 },
      projections: { fantasyPoints: 290 },
      trend: 'down',
    },
  ];

  const positions = ['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

  const filteredPlayers = mockPlayers
    .filter(player => 
      (selectedPosition === 'ALL' || player.position === selectedPosition) &&
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'adp':
          return a.adp - b.adp;
        case 'projections':
          return (b.projections.fantasyPoints || 0) - (a.projections.fantasyPoints || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Player Database</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive player stats, projections, and analysis
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search players..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Position Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="input-field pl-10 appearance-none"
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
              >
                {positions.map(position => (
                  <option key={position} value={position}>
                    {position === 'ALL' ? 'All Positions' : position}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <select
              className="input-field"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="adp">Sort by ADP</option>
              <option value="projections">Sort by Projections</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Players ({filteredPlayers.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredPlayers.map((player) => (
              <div key={player.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        player.tier === 1 ? 'bg-yellow-500' :
                        player.tier === 2 ? 'bg-gray-400' :
                        'bg-orange-500'
                      }`}>
                        {player.position}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{player.name}</h3>
                        {player.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{player.team} • Bye Week {player.bye_week}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{player.adp}</p>
                        <p className="text-xs text-gray-500">ADP</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          {player.projections.fantasyPoints?.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-500">Proj. Pts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          {player.stats.fantasyPoints?.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-500">2023 Pts</p>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-yellow-500 transition-colors">
                        <Star className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  {Object.entries(player.stats)
                    .filter(([key]) => key !== 'fantasyPoints')
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <div key={key} className="text-center p-2 bg-gray-50 rounded">
                        <p className="font-medium text-gray-900">{value}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {filteredPlayers.length === 0 && (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                No players found matching your criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};