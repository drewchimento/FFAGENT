import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from src.models.player import Player, PlayerStatistic, PlayerProjection
from src.models.preferences import UserPreference
from src.models.league import DraftPick
import json

class AIRecommendationEngine:
    def __init__(self):
        self.scaler = StandardScaler()
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.is_trained = False
    
    def get_player_recommendations(self, user_id, draft_id, available_players, current_round, user_team_needs):
        """
        Generate AI-powered player recommendations based on user preferences and draft context
        """
        try:
            # Get user preferences
            user_preferences = UserPreference.query.filter_by(user_id=user_id, is_enabled=True).all()
            pref_weights = {pref.stat_name: pref.importance_weight for pref in user_preferences}
            
            recommendations = []
            
            for player in available_players:
                score = self._calculate_player_score(player, pref_weights, current_round, user_team_needs)
                reasoning = self._generate_reasoning(player, pref_weights, current_round, user_team_needs)
                
                recommendations.append({
                    'player': player,
                    'score': score,
                    'reasoning': reasoning
                })
            
            # Sort by score descending
            recommendations.sort(key=lambda x: x['score'], reverse=True)
            
            return recommendations[:10]  # Return top 10 recommendations
            
        except Exception as e:
            print(f"Error generating recommendations: {str(e)}")
            return []
    
    def _calculate_player_score(self, player, user_preferences, current_round, user_team_needs):
        """
        Calculate a recommendation score for a player based on multiple factors
        """
        base_score = 50.0  # Base score out of 100
        
        # Factor 1: Position need (30% weight)
        position_score = self._calculate_position_need_score(player.position, user_team_needs)
        
        # Factor 2: Statistical performance (40% weight)
        stats_score = self._calculate_stats_score(player, user_preferences)
        
        # Factor 3: Value/ADP consideration (20% weight)
        value_score = self._calculate_value_score(player, current_round)
        
        # Factor 4: Injury/risk factors (10% weight)
        risk_score = self._calculate_risk_score(player)
        
        # Weighted combination
        final_score = (
            position_score * 0.30 +
            stats_score * 0.40 +
            value_score * 0.20 +
            risk_score * 0.10
        )
        
        return min(100.0, max(0.0, final_score))
    
    def _calculate_position_need_score(self, position, user_team_needs):
        """
        Score based on positional need
        """
        position_priorities = {
            'QB': user_team_needs.get('QB', 0),
            'RB': user_team_needs.get('RB', 0),
            'WR': user_team_needs.get('WR', 0),
            'TE': user_team_needs.get('TE', 0),
            'K': user_team_needs.get('K', 0),
            'DST': user_team_needs.get('DST', 0)
        }
        
        need_level = position_priorities.get(position, 0)
        
        # Convert need level to score (higher need = higher score)
        if need_level >= 3:  # High need
            return 90.0
        elif need_level == 2:  # Medium need
            return 70.0
        elif need_level == 1:  # Low need
            return 40.0
        else:  # No need
            return 20.0
    
    def _calculate_stats_score(self, player, user_preferences):
        """
        Score based on player statistics and user preferences
        """
        current_season = 2024
        
        # Get player's current season stats
        stats = PlayerStatistic.query.filter_by(
            player_id=player.id,
            season=current_season,
            week=None  # Season totals
        ).all()
        
        if not stats:
            return 50.0  # Default score if no stats available
        
        player_stats = {stat.stat_type: stat.stat_value for stat in stats}
        
        # Calculate weighted score based on user preferences
        total_weight = sum(user_preferences.values())
        if total_weight == 0:
            return 50.0
        
        weighted_score = 0.0
        for stat_name, weight in user_preferences.items():
            if stat_name in player_stats:
                # Normalize stat value (this would be more sophisticated in production)
                normalized_value = min(100.0, player_stats[stat_name] / 10.0)  # Simple normalization
                weighted_score += (normalized_value * weight)
        
        return min(100.0, weighted_score / total_weight)
    
    def _calculate_value_score(self, player, current_round):
        """
        Score based on value relative to draft position (ADP vs current round)
        """
        # This would use real ADP data in production
        estimated_adp = self._estimate_player_adp(player)
        
        current_pick = current_round * 12  # Assuming 12-team league
        
        if estimated_adp > current_pick + 12:  # Player available later than expected
            return 90.0  # Great value
        elif estimated_adp > current_pick:  # Slight value
            return 70.0
        elif estimated_adp < current_pick - 12:  # Reaching for player
            return 30.0
        else:  # Fair value
            return 60.0
    
    def _estimate_player_adp(self, player):
        """
        Estimate player's ADP based on position and performance
        """
        # Simplified ADP estimation - would use real data in production
        position_base_adp = {
            'QB': 80,
            'RB': 40,
            'WR': 50,
            'TE': 100,
            'K': 150,
            'DST': 140
        }
        
        return position_base_adp.get(player.position, 100)
    
    def _calculate_risk_score(self, player):
        """
        Score based on injury history and other risk factors
        """
        # This would incorporate real injury data in production
        # For now, return a default score
        return 75.0
    
    def _generate_reasoning(self, player, user_preferences, current_round, user_team_needs):
        """
        Generate human-readable reasoning for the recommendation
        """
        reasons = []
        
        # Position need reasoning
        position_need = user_team_needs.get(player.position, 0)
        if position_need >= 3:
            reasons.append(f"High need at {player.position} position")
        elif position_need == 2:
            reasons.append(f"Moderate need at {player.position} position")
        
        # Statistical reasoning based on top user preferences
        top_preferences = sorted(user_preferences.items(), key=lambda x: x[1], reverse=True)[:3]
        
        current_season = 2024
        stats = PlayerStatistic.query.filter_by(
            player_id=player.id,
            season=current_season,
            week=None
        ).all()
        
        player_stats = {stat.stat_type: stat.stat_value for stat in stats}
        
        for stat_name, weight in top_preferences:
            if stat_name in player_stats and weight >= 3.0:
                stat_display_name = stat_name.replace('_', ' ').title()
                reasons.append(f"Strong {stat_display_name} production ({player_stats[stat_name]})")
        
        # Value reasoning
        estimated_adp = self._estimate_player_adp(player)
        current_pick = current_round * 12
        
        if estimated_adp > current_pick + 12:
            reasons.append("Excellent value pick - available later than expected")
        elif estimated_adp < current_pick - 12:
            reasons.append("Reaching for this player based on ADP")
        
        if not reasons:
            reasons.append("Solid option at this draft position")
        
        return ". ".join(reasons) + "."
    
    def analyze_draft_trends(self, draft_id):
        """
        Analyze current draft trends and patterns
        """
        picks = DraftPick.query.filter_by(draft_id=draft_id).all()
        
        if not picks:
            return {}
        
        # Analyze position trends
        position_counts = {}
        for pick in picks:
            if pick.player and pick.player.position:
                pos = pick.player.position
                position_counts[pos] = position_counts.get(pos, 0) + 1
        
        # Calculate run detection (3+ players of same position in recent picks)
        recent_picks = sorted(picks, key=lambda x: x.pick_number, reverse=True)[:6]
        recent_positions = [pick.player.position for pick in recent_picks if pick.player]
        
        position_runs = {}
        for pos in set(recent_positions):
            count = recent_positions.count(pos)
            if count >= 3:
                position_runs[pos] = count
        
        return {
            'position_counts': position_counts,
            'position_runs': position_runs,
            'total_picks': len(picks)
        }

