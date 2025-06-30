import React from 'react';
import { Layout } from '../components/Layout';
import { useDraft } from '../contexts/DraftContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Target, 
  Users, 
  TrendingUp, 
  Clock,
  Star,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { draftedPlayers, recommendations, isLiveDraft } = useDraft();

  const stats = [
    {
      name: 'Players Drafted',
      value: draftedPlayers.length,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      name: 'Live Draft Status',
      value: isLiveDraft ? 'Active' : 'Inactive',
      icon: Target,
      color: isLiveDraft ? 'text-green-600' : 'text-gray-600',
      bg: isLiveDraft ? 'bg-green-50' : 'bg-gray-50',
    },
    {
      name: 'Top Recommendations',
      value: recommendations.length,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      name: 'Draft Round',
      value: Math.ceil(draftedPlayers.length / 12) || 1,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.user_metadata?.full_name || 'Fantasy Manager'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Ready to dominate your fantasy football draft? Let's get started.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="card">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Draft Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Live Draft</h2>
              {isLiveDraft && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                  Live
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-4">
              {isLiveDraft 
                ? 'Your draft is currently active. Get real-time recommendations!'
                : 'Start your live draft session to get AI-powered recommendations.'
              }
            </p>
            <Link
              to="/draft"
              className="btn-primary inline-flex items-center"
            >
              <Target className="mr-2 h-4 w-4" />
              {isLiveDraft ? 'Continue Draft' : 'Start Live Draft'}
            </Link>
          </div>

          {/* Top Recommendations */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Top Recommendations
            </h2>
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{player.name}</p>
                        <p className="text-xs text-gray-500">{player.position} - {player.team}</p>
                      </div>
                    </div>
                    <Star className="h-4 w-4 text-yellow-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  No recommendations yet. Start a draft to see AI suggestions!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Draft Activity</h2>
          {draftedPlayers.length > 0 ? (
            <div className="space-y-3">
              {draftedPlayers.slice(-5).reverse().map((pick) => (
                <div key={pick.pick} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {pick.pick}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{pick.player.name}</p>
                      <p className="text-xs text-gray-500">
                        {pick.player.position} - {pick.player.team} • Round {pick.round}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(pick.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                No draft activity yet. Your picks will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};