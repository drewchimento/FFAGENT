from src.models.user import db
from datetime import datetime

class Player(db.Model):
    __tablename__ = 'players'
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.String(50), unique=True, nullable=False)  # universal player identifier
    name = db.Column(db.String(255), nullable=False)
    position = db.Column(db.String(10), nullable=False)  # QB, RB, WR, TE, K, DST
    team = db.Column(db.String(10), nullable=False)  # NFL team abbreviation
    bye_week = db.Column(db.Integer)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    statistics = db.relationship('PlayerStatistic', backref='player', lazy=True, cascade='all, delete-orphan')
    projections = db.relationship('PlayerProjection', backref='player', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Player {self.name} ({self.position}, {self.team})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'player_id': self.player_id,
            'name': self.name,
            'position': self.position,
            'team': self.team,
            'bye_week': self.bye_week,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class PlayerStatistic(db.Model):
    __tablename__ = 'player_statistics'
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=False)
    season = db.Column(db.Integer, nullable=False)
    week = db.Column(db.Integer)  # NULL for season totals
    stat_type = db.Column(db.String(50), nullable=False)  # rushing_yards, receiving_yards, etc.
    stat_value = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('player_id', 'season', 'week', 'stat_type'),)
    
    def __repr__(self):
        return f'<PlayerStatistic {self.stat_type}: {self.stat_value}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'player_id': self.player_id,
            'season': self.season,
            'week': self.week,
            'stat_type': self.stat_type,
            'stat_value': self.stat_value,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class PlayerProjection(db.Model):
    __tablename__ = 'player_projections'
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=False)
    season = db.Column(db.Integer, nullable=False)
    week = db.Column(db.Integer)  # NULL for season projections
    projection_source = db.Column(db.String(50), nullable=False)  # fantasypros, espn, internal, etc.
    stat_type = db.Column(db.String(50), nullable=False)
    projected_value = db.Column(db.Float, nullable=False)
    confidence_score = db.Column(db.Float)  # 0.00 to 1.00
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('player_id', 'season', 'week', 'projection_source', 'stat_type'),)
    
    def __repr__(self):
        return f'<PlayerProjection {self.stat_type}: {self.projected_value}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'player_id': self.player_id,
            'season': self.season,
            'week': self.week,
            'projection_source': self.projection_source,
            'stat_type': self.stat_type,
            'projected_value': self.projected_value,
            'confidence_score': self.confidence_score,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

