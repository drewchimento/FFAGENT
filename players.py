from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models.player import Player, PlayerStatistic, PlayerProjection
from src.models.user import db
from sqlalchemy import or_, and_

players_bp = Blueprint('players', __name__)

@players_bp.route('/players', methods=['GET'])
def get_players():
    try:
        # Get query parameters
        search = request.args.get('search', '')
        position = request.args.get('position', '')
        team = request.args.get('team', '')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        # Build query
        query = Player.query.filter(Player.is_active == True)
        
        if search:
            query = query.filter(Player.name.ilike(f'%{search}%'))
        
        if position:
            query = query.filter(Player.position == position.upper())
        
        if team:
            query = query.filter(Player.team == team.upper())
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        players = query.offset(offset).limit(limit).all()
        
        # Get current season stats and projections for each player
        current_season = 2024  # This would be dynamic in production
        players_data = []
        
        for player in players:
            player_dict = player.to_dict()
            
            # Get current season stats
            stats = PlayerStatistic.query.filter_by(
                player_id=player.id,
                season=current_season,
                week=None  # Season totals
            ).all()
            
            current_stats = {}
            for stat in stats:
                current_stats[stat.stat_type] = stat.stat_value
            
            # Get projections
            projections = PlayerProjection.query.filter_by(
                player_id=player.id,
                season=current_season,
                week=None  # Season projections
            ).all()
            
            current_projections = {}
            for proj in projections:
                if proj.projection_source not in current_projections:
                    current_projections[proj.projection_source] = {}
                current_projections[proj.projection_source][proj.stat_type] = proj.projected_value
            
            player_dict['current_stats'] = current_stats
            player_dict['projections'] = current_projections
            players_data.append(player_dict)
        
        return jsonify({
            'success': True,
            'data': {
                'players': players_data,
                'total': total,
                'has_more': offset + limit < total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@players_bp.route('/players/<int:player_id>', methods=['GET'])
def get_player_details(player_id):
    try:
        player = Player.query.get(player_id)
        
        if not player:
            return jsonify({'success': False, 'error': 'Player not found'}), 404
        
        player_dict = player.to_dict()
        
        # Get historical stats
        historical_stats = {}
        stats = PlayerStatistic.query.filter_by(
            player_id=player.id,
            week=None  # Season totals only
        ).all()
        
        for stat in stats:
            if stat.season not in historical_stats:
                historical_stats[stat.season] = {}
            historical_stats[stat.season][stat.stat_type] = stat.stat_value
        
        # Get projections
        projections = {}
        proj_data = PlayerProjection.query.filter_by(
            player_id=player.id,
            week=None  # Season projections only
        ).all()
        
        for proj in proj_data:
            if proj.season not in projections:
                projections[proj.season] = {}
            if proj.projection_source not in projections[proj.season]:
                projections[proj.season][proj.projection_source] = {}
            projections[proj.season][proj.projection_source][proj.stat_type] = proj.projected_value
        
        player_dict['historical_stats'] = historical_stats
        player_dict['projections'] = projections
        player_dict['injury_status'] = 'healthy'  # This would come from external API
        player_dict['adp'] = 50.0  # This would come from external API
        
        return jsonify({
            'success': True,
            'data': {
                'player': player_dict
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@players_bp.route('/players/<int:player_id>/stats', methods=['GET'])
def get_player_stats(player_id):
    try:
        player = Player.query.get(player_id)
        
        if not player:
            return jsonify({'success': False, 'error': 'Player not found'}), 404
        
        season = request.args.get('season', 2024, type=int)
        week = request.args.get('week', type=int)
        
        query = PlayerStatistic.query.filter_by(
            player_id=player.id,
            season=season
        )
        
        if week is not None:
            query = query.filter_by(week=week)
        
        stats = query.all()
        
        return jsonify({
            'success': True,
            'data': [stat.to_dict() for stat in stats]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

