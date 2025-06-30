from src.models.user import db
from datetime import datetime
import json

class FantasyLeague(db.Model):
    __tablename__ = 'fantasy_leagues'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    platform = db.Column(db.String(20), nullable=False)  # espn, yahoo, nfl, cbs, etc.
    league_id = db.Column(db.String(100), nullable=False)  # platform-specific league ID
    league_name = db.Column(db.String(255), nullable=False)
    scoring_type = db.Column(db.String(20), nullable=False)  # standard, ppr, half_ppr
    roster_settings = db.Column(db.Text)  # JSON string for flexible roster configuration
    draft_settings = db.Column(db.Text)  # JSON string for draft type, order, etc.
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='fantasy_leagues')
    drafts = db.relationship('Draft', backref='league', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (db.UniqueConstraint('user_id', 'platform', 'league_id'),)
    
    def __repr__(self):
        return f'<FantasyLeague {self.league_name} ({self.platform})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'platform': self.platform,
            'league_id': self.league_id,
            'league_name': self.league_name,
            'scoring_type': self.scoring_type,
            'roster_settings': json.loads(self.roster_settings) if self.roster_settings else None,
            'draft_settings': json.loads(self.draft_settings) if self.draft_settings else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Draft(db.Model):
    __tablename__ = 'drafts'
    
    id = db.Column(db.Integer, primary_key=True)
    league_id = db.Column(db.Integer, db.ForeignKey('fantasy_leagues.id'), nullable=False)
    draft_status = db.Column(db.String(20), default='scheduled')  # scheduled, active, completed, cancelled
    draft_type = db.Column(db.String(20), nullable=False)  # snake, linear, auction
    total_rounds = db.Column(db.Integer, nullable=False)
    current_round = db.Column(db.Integer, default=1)
    current_pick = db.Column(db.Integer, default=1)
    draft_start_time = db.Column(db.DateTime)
    draft_end_time = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    picks = db.relationship('DraftPick', backref='draft', lazy=True, cascade='all, delete-orphan')
    recommendations = db.relationship('AIRecommendation', backref='draft', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Draft {self.id} ({self.draft_status})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'league_id': self.league_id,
            'draft_status': self.draft_status,
            'draft_type': self.draft_type,
            'total_rounds': self.total_rounds,
            'current_round': self.current_round,
            'current_pick': self.current_pick,
            'draft_start_time': self.draft_start_time.isoformat() if self.draft_start_time else None,
            'draft_end_time': self.draft_end_time.isoformat() if self.draft_end_time else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'league': self.league.to_dict() if self.league else None
        }

class DraftPick(db.Model):
    __tablename__ = 'draft_picks'
    
    id = db.Column(db.Integer, primary_key=True)
    draft_id = db.Column(db.Integer, db.ForeignKey('drafts.id'), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey('players.id'))
    team_position = db.Column(db.Integer, nullable=False)  # 1-12 typically
    round_number = db.Column(db.Integer, nullable=False)
    pick_number = db.Column(db.Integer, nullable=False)  # overall pick number
    pick_time = db.Column(db.DateTime, default=datetime.utcnow)
    is_user_pick = db.Column(db.Boolean, default=False)  # true if this was the user's pick
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    player = db.relationship('Player', backref='draft_picks')
    
    def __repr__(self):
        return f'<DraftPick Round {self.round_number}, Pick {self.pick_number}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'draft_id': self.draft_id,
            'player_id': self.player_id,
            'team_position': self.team_position,
            'round_number': self.round_number,
            'pick_number': self.pick_number,
            'pick_time': self.pick_time.isoformat() if self.pick_time else None,
            'is_user_pick': self.is_user_pick,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'player': self.player.to_dict() if self.player else None
        }

class AIRecommendation(db.Model):
    __tablename__ = 'ai_recommendations'
    
    id = db.Column(db.Integer, primary_key=True)
    draft_id = db.Column(db.Integer, db.ForeignKey('drafts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    pick_number = db.Column(db.Integer, nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey('players.id'))
    recommendation_score = db.Column(db.Float, nullable=False)  # 0.00 to 100.00
    reasoning = db.Column(db.Text)  # AI explanation for the recommendation
    user_preferences_snapshot = db.Column(db.Text)  # JSON snapshot of user prefs at time of recommendation
    was_selected = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='ai_recommendations')
    player = db.relationship('Player', backref='ai_recommendations')
    
    def __repr__(self):
        return f'<AIRecommendation Pick {self.pick_number}, Score {self.recommendation_score}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'draft_id': self.draft_id,
            'user_id': self.user_id,
            'pick_number': self.pick_number,
            'player_id': self.player_id,
            'recommendation_score': self.recommendation_score,
            'reasoning': self.reasoning,
            'user_preferences_snapshot': json.loads(self.user_preferences_snapshot) if self.user_preferences_snapshot else None,
            'was_selected': self.was_selected,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'player': self.player.to_dict() if self.player else None
        }



