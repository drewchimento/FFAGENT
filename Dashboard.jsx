import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { leaguesAPI, draftAPI } from '../lib/api';
import Layout from './Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Calendar, Users, Trophy, Clock, Play } from 'lucide-react';

const Dashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return; // Only fetch if user is authenticated
      try {
        const [leaguesResponse, draftsResponse] = await Promise.all([
          leaguesAPI.getLeagues(),
          draftAPI.getDrafts()
        ]);

        setLeagues(leaguesResponse.data.data || []);
        setDrafts(draftsResponse.data.data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]); // Depend on user object

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'default', label: 'Active' },
      scheduled: { variant: 'secondary', label: 'Scheduled' },
      completed: { variant: 'outline', label: 'Completed' }
    };

    const config = statusConfig[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const activeDrafts = drafts.filter(draft => draft.draft_status === 'active');
  const upcomingDrafts = drafts.filter(draft => draft.draft_status === 'scheduled');

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Welcome back, ${user?.username}!`}>
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Leagues</p>
                  <p className="text-2xl font-bold text-gray-900">{leagues.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Play className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Drafts</p>
                  <p className="text-2xl font-bold text-gray-900">{activeDrafts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming Drafts</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingDrafts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Drafts */}
        {activeDrafts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Drafts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeDrafts.map((draft) => (
                <Card key={draft.id} className="border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{draft.league?.name}</CardTitle>
                        <CardDescription>
                          Round {draft.current_round} • Pick {draft.current_pick}
                        </CardDescription>
                      </div>
                      {getStatusBadge(draft.draft_status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p>{draft.draft_type} Draft</p>
                        <p>{draft.total_rounds} Rounds</p>
                      </div>
                      <Button 
                        onClick={() => onNavigate('draft', draft.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Join Draft
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Drafts */}
        {upcomingDrafts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Drafts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingDrafts.map((draft) => (
                <Card key={draft.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{draft.league?.name}</CardTitle>
                        <CardDescription>
                          {draft.draft_start_time ? 
                            new Date(draft.draft_start_time).toLocaleDateString() : 
                            'Draft time TBD'
                          }
                        </CardDescription>
                      </div>
                      {getStatusBadge(draft.draft_status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p>{draft.draft_type} Draft</p>
                        <p>{draft.total_rounds} Rounds</p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => onNavigate('draft', draft.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* My Leagues */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Leagues</h2>
            <Button onClick={() => onNavigate('add-league')}>
              <Plus className="w-4 h-4 mr-2" />
              Add League
            </Button>
          </div>

          {leagues.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No leagues yet</h3>
                <p className="text-gray-600 mb-4">
                  Connect your fantasy football leagues to get AI-powered draft recommendations
                </p>
                <Button onClick={() => onNavigate('add-league')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First League
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leagues.map((league) => (
                <Card key={league.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{league.league_name}</CardTitle>
                    <CardDescription>
                      {league.platform.toUpperCase()} • {league.scoring_type.toUpperCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p>League ID: {league.league_id}</p>
                        {league.active_draft && (
                          <p className="text-green-600 font-medium">Draft Active</p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onNavigate('league', league.id)}
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-16 justify-start"
              onClick={() => onNavigate('preferences')}
            >
              <div className="flex items-center">
                <Calendar className="h-6 w-6 mr-3 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium">Customize Preferences</p>
                  <p className="text-sm text-gray-600">Set your statistical priorities</p>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-16 justify-start"
              onClick={() => onNavigate('players')}
            >
              <div className="flex items-center">
                <Users className="h-6 w-6 mr-3 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">Player Research</p>
                  <p className="text-sm text-gray-600">Analyze player statistics</p>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

