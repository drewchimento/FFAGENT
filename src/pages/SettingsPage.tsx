import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { useDraft } from '../contexts/DraftContext';
import { Save, BarChart3, Target, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { draftSettings, updateDraftSettings } = useDraft();
  const [localSettings, setLocalSettings] = useState(draftSettings);

  const handleSave = () => {
    updateDraftSettings(localSettings);
    toast.success('Settings saved successfully!');
  };

  const handleStatToggle = (stat: string) => {
    const newStats = localSettings.priorityStats.includes(stat)
      ? localSettings.priorityStats.filter(s => s !== stat)
      : [...localSettings.priorityStats, stat];
    
    setLocalSettings(prev => ({
      ...prev,
      priorityStats: newStats,
    }));
  };

  const handlePositionReorder = (positions: string[]) => {
    setLocalSettings(prev => ({
      ...prev,
      positionPriority: positions,
    }));
  };

  const availableStats = [
    { key: 'passingYards', label: 'Passing Yards', category: 'QB' },
    { key: 'passingTouchdowns', label: 'Passing TDs', category: 'QB' },
    { key: 'interceptions', label: 'Interceptions', category: 'QB' },
    { key: 'rushingYards', label: 'Rushing Yards', category: 'RB/QB' },
    { key: 'rushingTouchdowns', label: 'Rushing TDs', category: 'RB/QB' },
    { key: 'receivingYards', label: 'Receiving Yards', category: 'WR/TE/RB' },
    { key: 'receivingTouchdowns', label: 'Receiving TDs', category: 'WR/TE/RB' },
    { key: 'receptions', label: 'Receptions', category: 'WR/TE/RB' },
    { key: 'targets', label: 'Targets', category: 'WR/TE/RB' },
    { key: 'touchdowns', label: 'Total TDs', category: 'All' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Draft Settings</h1>
              <p className="text-gray-600 mt-1">
                Customize your AI recommendations and draft strategy
              </p>
            </div>
            <button
              onClick={handleSave}
              className="btn-primary inline-flex items-center"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Stats */}
          <div className="card">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Priority Statistics</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Select which statistics are most important for your draft decisions
            </p>
            
            <div className="space-y-3">
              {availableStats.map((stat) => (
                <div key={stat.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{stat.label}</p>
                    <p className="text-xs text-gray-500">{stat.category}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={localSettings.priorityStats.includes(stat.key)}
                      onChange={() => handleStatToggle(stat.key)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Draft Strategy */}
          <div className="card">
            <div className="flex items-center mb-4">
              <Target className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Draft Strategy</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Choose your overall approach to the draft
            </p>

            <div className="space-y-3">
              {[
                {
                  value: 'aggressive',
                  label: 'Aggressive',
                  description: 'High-upside players, willing to take risks',
                },
                {
                  value: 'balanced',
                  label: 'Balanced',
                  description: 'Mix of safe picks and upside plays',
                },
                {
                  value: 'conservative',
                  label: 'Conservative',
                  description: 'Safe, consistent players with proven track records',
                },
              ].map((strategy) => (
                <label
                  key={strategy.value}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    localSettings.draftStrategy === strategy.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="draftStrategy"
                    value={strategy.value}
                    checked={localSettings.draftStrategy === strategy.value}
                    onChange={(e) =>
                      setLocalSettings(prev => ({
                        ...prev,
                        draftStrategy: e.target.value as any,
                      }))
                    }
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{strategy.label}</p>
                    <p className="text-xs text-gray-500">{strategy.description}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    localSettings.draftStrategy === strategy.value
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {localSettings.draftStrategy === strategy.value && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Risk Tolerance */}
          <div className="card">
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-orange-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Risk Tolerance</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              How much risk are you willing to take on players?
            </p>

            <div className="space-y-3">
              {[
                {
                  value: 'low',
                  label: 'Low Risk',
                  description: 'Prefer established veterans with consistent production',
                },
                {
                  value: 'medium',
                  label: 'Medium Risk',
                  description: 'Balanced approach between safety and upside',
                },
                {
                  value: 'high',
                  label: 'High Risk',
                  description: 'Target high-upside players, rookies, and breakout candidates',
                },
              ].map((risk) => (
                <label
                  key={risk.value}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    localSettings.riskTolerance === risk.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="riskTolerance"
                    value={risk.value}
                    checked={localSettings.riskTolerance === risk.value}
                    onChange={(e) =>
                      setLocalSettings(prev => ({
                        ...prev,
                        riskTolerance: e.target.value as any,
                      }))
                    }
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{risk.label}</p>
                    <p className="text-xs text-gray-500">{risk.description}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    localSettings.riskTolerance === risk.value
                      ? 'border-orange-500 bg-orange-500'
                      : 'border-gray-300'
                  }`}>
                    {localSettings.riskTolerance === risk.value && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Position Priority */}
          <div className="card">
            <div className="flex items-center mb-4">
              <Zap className="h-5 w-5 text-purple-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Position Priority</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Drag to reorder positions by importance in your draft strategy
            </p>

            <div className="space-y-2">
              {localSettings.positionPriority.map((position, index) => (
                <div
                  key={position}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 mr-3">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {position}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (index > 0) {
                          const newOrder = [...localSettings.positionPriority];
                          [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                          handlePositionReorder(newOrder);
                        }
                      }}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => {
                        if (index < localSettings.positionPriority.length - 1) {
                          const newOrder = [...localSettings.positionPriority];
                          [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                          handlePositionReorder(newOrder);
                        }
                      }}
                      disabled={index === localSettings.positionPriority.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};