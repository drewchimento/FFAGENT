from datetime import datetime, timedelta
import json
from typing import Dict, List, Optional
from src.models.league import Draft, DraftPick
from src.models.player import Player
from src.models.user import db
from src.services.ai_engine import AIRecommendationEngine

class DraftRoomManager:
    """Manages real-time draft rooms and state"""
    
    def __init__(self):
        self.active_rooms: Dict[int, 'DraftRoom'] = {}
        self.ai_engine = AIRecommendationEngine()
    
    def get_or_create_room(self, draft_id: int) -> 'DraftRoom':
        """Get existing room or create new one for draft"""
        if draft_id not in self.active_rooms:
            draft = Draft.query.get(draft_id)
            if not draft:
                raise ValueError(f"Draft {draft_id} not found")
            
            self.active_rooms[draft_id] = DraftRoom(draft, self.ai_engine)
        
        return self.active_rooms[draft_id]
    
    def remove_room(self, draft_id: int):
        """Remove draft room when draft is complete"""
        if draft_id in self.active_rooms:
            del self.active_rooms[draft_id]

class DraftRoom:
    """Represents a single draft room with real-time state"""
    
    def __init__(self, draft: Draft, ai_engine: AIRecommendationEngine):
        self.draft = draft
        self.ai_engine = ai_engine
        self.participants: Dict[str, dict] = {}  # user_id -> user_info
        self.current_pick_timer = None
        self.pick_time_limit = 90  # seconds per pick
        self.auto_pick_enabled = True
        
        # Load existing picks
        self.picks = DraftPick.query.filter_by(draft_id=draft.id).order_by(DraftPick.pick_number).all()
        
        # Calculate draft order and current state
        self._calculate_draft_state()
    
    def _calculate_draft_state(self):
        """Calculate current draft state based on existing picks"""
        total_teams = 12  # Default, should come from league settings
        total_picks = len(self.picks)
        
        if self.draft.draft_type == 'snake':
            # Snake draft logic
            current_round = (total_picks // total_teams) + 1
            pick_in_round = total_picks % total_teams
            
            if current_round % 2 == 1:  # Odd rounds go 1->12
                current_team = pick_in_round + 1
            else:  # Even rounds go 12->1
                current_team = total_teams - pick_in_round
        else:
            # Standard draft logic
            current_round = (total_picks // total_teams) + 1
            current_team = (total_picks % total_teams) + 1
        
        self.current_round = current_round
        self.current_team = current_team
        self.current_pick = total_picks + 1
        
        # Update draft model
        self.draft.current_round = current_round
        self.draft.current_pick = self.current_pick
    
    def add_participant(self, user_id: str, user_info: dict):
        """Add user to draft room"""
        self.participants[user_id] = {
            'user_id': user_id,
            'username': user_info.get('username'),
            'team_position': user_info.get('team_position', 1),
            'connected_at': datetime.utcnow().isoformat(),
            'is_active': True
        }
    
    def remove_participant(self, user_id: str):
        """Remove user from draft room"""
        if user_id in self.participants:
            self.participants[user_id]['is_active'] = False
    
    def make_pick(self, user_id: str, player_id: int) -> dict:
        """Process a draft pick"""
        # Validate pick
        if not self._can_user_pick(user_id):
            raise ValueError("Not your turn to pick")
        
        player = Player.query.get(player_id)
        if not player:
            raise ValueError("Player not found")
        
        # Check if player already drafted
        existing_pick = DraftPick.query.filter_by(
            draft_id=self.draft.id,
            player_id=player_id
        ).first()
        
        if existing_pick:
            raise ValueError("Player already drafted")
        
        # Create draft pick
        draft_pick = DraftPick(
            draft_id=self.draft.id,
            player_id=player_id,
            team_position=self.current_team,
            round_number=self.current_round,
            pick_number=self.current_pick,
            is_user_pick=(user_id == str(self.participants.get(user_id, {}).get('user_id')))
        )
        
        db.session.add(draft_pick)
        self.picks.append(draft_pick)
        
        # Update draft state
        self._calculate_draft_state()
        
        # Check if draft is complete
        total_rounds = self.draft.total_rounds
        total_teams = 12
        if len(self.picks) >= (total_rounds * total_teams):
            self.draft.draft_status = 'completed'
            self.draft.draft_end_time = datetime.utcnow()
        
        db.session.commit()
        
        # Return pick data for broadcasting
        return {
            'pick': {
                'id': draft_pick.id,
                'player': player.to_dict(),
                'team_position': draft_pick.team_position,
                'round_number': draft_pick.round_number,
                'pick_number': draft_pick.pick_number,
                'picked_at': datetime.utcnow().isoformat()
            },
            'draft_state': self.get_draft_state(),
            'next_recommendations': self._get_next_recommendations()
        }
    
    def _can_user_pick(self, user_id: str) -> bool:
        """Check if user can make current pick"""
        user_info = self.participants.get(user_id)
        if not user_info:
            return False
        
        return user_info.get('team_position') == self.current_team
    
    def get_draft_state(self) -> dict:
        """Get current draft state"""
        return {
            'draft_id': self.draft.id,
            'current_round': self.current_round,
            'current_team': self.current_team,
            'current_pick': self.current_pick,
            'total_picks': len(self.picks),
            'draft_status': self.draft.draft_status,
            'participants': list(self.participants.values()),
            'recent_picks': [self._format_pick(pick) for pick in self.picks[-5:]],
            'timer': self._get_timer_info()
        }
    
    def _format_pick(self, pick: DraftPick) -> dict:
        """Format pick for client"""
        return {
            'id': pick.id,
            'player': pick.player.to_dict() if pick.player else None,
            'team_position': pick.team_position,
            'round_number': pick.round_number,
            'pick_number': pick.pick_number
        }
    
    def _get_timer_info(self) -> dict:
        """Get current pick timer information"""
        if self.current_pick_timer:
            time_remaining = max(0, self.pick_time_limit - 
                               (datetime.utcnow() - self.current_pick_timer).seconds)
            return {
                'time_remaining': time_remaining,
                'total_time': self.pick_time_limit,
                'is_active': time_remaining > 0
            }
        return {
            'time_remaining': self.pick_time_limit,
            'total_time': self.pick_time_limit,
            'is_active': False
        }
    
    def start_pick_timer(self):
        """Start timer for current pick"""
        self.current_pick_timer = datetime.utcnow()
    
    def _get_next_recommendations(self) -> List[dict]:
        """Get AI recommendations for next pick"""
        try:
            # Get drafted players
            drafted_player_ids = [pick.player_id for pick in self.picks if pick.player_id]
            
            # Get available players
            available_players = Player.query.filter(
                Player.is_active == True,
                ~Player.id.in_(drafted_player_ids)
            ).limit(50).all()
            
            # Get recommendations for current team
            current_user_picks = [pick for pick in self.picks 
                                if pick.team_position == self.current_team]
            
            # Calculate team needs (simplified)
            team_needs = self._calculate_team_needs(current_user_picks)
            
            # Get AI recommendations
            recommendations = self.ai_engine.get_player_recommendations(
                user_id=None,  # Generic recommendations
                draft_id=self.draft.id,
                available_players=available_players,
                current_round=self.current_round,
                user_team_needs=team_needs
            )
            
            return recommendations[:5]  # Top 5 recommendations
            
        except Exception as e:
            print(f"Error getting recommendations: {e}")
            return []
    
    def _calculate_team_needs(self, user_picks: List[DraftPick]) -> dict:
        """Calculate positional needs for team"""
        position_counts = {}
        for pick in user_picks:
            if pick.player and pick.player.position:
                pos = pick.player.position
                position_counts[pos] = position_counts.get(pos, 0) + 1
        
        # Basic needs calculation
        needs = {
            'QB': max(0, 1 - position_counts.get('QB', 0)),
            'RB': max(0, 2 - position_counts.get('RB', 0)),
            'WR': max(0, 2 - position_counts.get('WR', 0)),
            'TE': max(0, 1 - position_counts.get('TE', 0)),
            'K': max(0, 1 - position_counts.get('K', 0)),
            'DST': max(0, 1 - position_counts.get('DST', 0))
        }
        
        return needs
    
    def get_available_players(self, position: Optional[str] = None, 
                            search: Optional[str] = None) -> List[dict]:
        """Get available players for drafting"""
        drafted_player_ids = [pick.player_id for pick in self.picks if pick.player_id]
        
        query = Player.query.filter(
            Player.is_active == True,
            ~Player.id.in_(drafted_player_ids)
        )
        
        if position:
            query = query.filter(Player.position == position)
        
        if search:
            query = query.filter(
                Player.full_name.ilike(f'%{search}%')
            )
        
        players = query.limit(100).all()
        return [player.to_dict() for player in players]

# Global instance
draft_room_manager = DraftRoomManager()

