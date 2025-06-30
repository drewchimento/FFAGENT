import React, { useState, useEffect } from 'react';
import { preferencesAPI } from '../lib/api';
import Layout from './Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Save, RotateCcw, Info } from 'lucide-react';

const Preferences = () => {
  const [preferences, setPreferences] = useState([]);
  const [availableStats, setAvailableStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prefsResponse, statsResponse] = await Promise.all([
          preferencesAPI.getPreferences(),
          preferencesAPI.getAvailableStats()
        ]);

        setPreferences(prefsResponse.data.data || []);
        setAvailableStats(statsResponse.data.data || {});
      } catch (error) {
        console.error('Error fetching preferences:', error);
        setMessage('Error loading preferences');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePreferenceChange = (statName, field, value) => {
    setPreferences(prev => {
      const existing = prev.find(p => p.stat_name === statName);
      if (existing) {
        return prev.map(p => 
          p.stat_name === statName 
            ? { ...p, [field]: value }
            : p
        );
      } else {
        return [...prev, {
          stat_name: statName,
          is_enabled: field === 'is_enabled' ? value : true,
          importance_weight: field === 'importance_weight' ? value : 3.0
        }];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      await preferencesAPI.updatePreferences(preferences);
      setMessage('Preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to default preferences
    const defaultPrefs = [
      { stat_name: 'rushing_yards', is_enabled: true, importance_weight: 4.0 },
      { stat_name: 'receiving_yards', is_enabled: true, importance_weight: 4.0 },
      { stat_name: 'passing_yards', is_enabled: true, importance_weight: 3.5 },
      { stat_name: 'rushing_touchdowns', is_enabled: true, importance_weight: 5.0 },
      { stat_name: 'receiving_touchdowns', is_enabled: true, importance_weight: 5.0 },
      { stat_name: 'passing_touchdowns', is_enabled: true, importance_weight: 4.5 },
      { stat_name: 'receptions', is_enabled: true, importance_weight: 3.0 },
      { stat_name: 'targets', is_enabled: true, importance_weight: 2.5 }
    ];
    setPreferences(defaultPrefs);
  };

  const getPreferenceValue = (statName, field) => {
    const pref = preferences.find(p => p.stat_name === statName);
    return pref ? pref[field] : (field === 'is_enabled' ? false : 3.0);
  };

  const getImportanceLabel = (weight) => {
    if (weight >= 4.5) return 'Very High';
    if (weight >= 3.5) return 'High';
    if (weight >= 2.5) return 'Medium';
    if (weight >= 1.5) return 'Low';
    return 'Very Low';
  };

  const getImportanceColor = (weight) => {
    if (weight >= 4.5) return 'bg-red-500';
    if (weight >= 3.5) return 'bg-orange-500';
    if (weight >= 2.5) return 'bg-yellow-500';
    if (weight >= 1.5) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  if (loading) {
    return (
      <Layout title="Statistical Preferences">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading preferences...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Statistical Preferences">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-600" />
              Customize Your Draft Recommendations
            </CardTitle>
            <CardDescription>
              Select which statistics are important to you and set their priority levels. 
              FFAgent will use these preferences to provide personalized player recommendations during your drafts.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}

        {/* Statistics Categories */}
        {Object.entries(availableStats).map(([category, stats]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="capitalize text-lg">
                {category.replace('_', ' ')} Statistics
              </CardTitle>
              <CardDescription>
                Configure the importance of {category.replace('_', ' ').toLowerCase()} statistics for your draft recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.map((stat) => {
                  const isEnabled = getPreferenceValue(stat.stat_name, 'is_enabled');
                  const weight = getPreferenceValue(stat.stat_name, 'importance_weight');
                  
                  return (
                    <div key={stat.stat_name} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => handlePreferenceChange(stat.stat_name, 'is_enabled', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="font-medium text-gray-900">{stat.display_name}</span>
                            </label>
                            <Badge variant="outline" className="text-xs">
                              {stat.positions.join(', ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{stat.description}</p>
                        </div>
                        
                        {isEnabled && (
                          <div className="flex items-center space-x-3 ml-4">
                            <Badge 
                              className={`${getImportanceColor(weight)} text-white`}
                            >
                              {getImportanceLabel(weight)}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      {isEnabled && (
                        <div className="ml-6 space-y-2">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Importance Level</span>
                            <span>{weight.toFixed(1)}/5.0</span>
                          </div>
                          <Slider
                            value={[weight]}
                            onValueChange={(value) => handlePreferenceChange(stat.stat_name, 'importance_weight', value[0])}
                            max={5}
                            min={1}
                            step={0.5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Low Priority</span>
                            <span>High Priority</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Preferences;

