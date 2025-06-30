from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db
from src.models.league import FantasyLeague, Draft, DraftPick, AIRecommendation
from src.models.player import Player
from src.services.ai_engine import AIRecommendationEngine
from datetime import datetime
import json

draft_bp = Blueprint('draft', __name__)
ai_engine = AIRecommendationEngine()

@draft_bp.route('/drafts', methods=['GET'])
@jwt_required()
def get_user_drafts():
    try:
        user_id = get_jwt_identity()
        
        # Get user's leagues and their drafts
        leagues = FantasyLeague.query.filter_by(user_id=user_id, is_active=True).all()
        
        drafts_data = []
        for league in leagues:
            for draft in league.drafts:
                draft_dict = draft.to_dict()
                draft_dict['league'] = {
                    'id': league.id,
                    'name': league.league_name,
                    'platform': league.platform,
                    'scoring_type': league.scoring_type
                }
                drafts_data.append(draft_dict)
        
        return jsonify({
            'success': True,
            'data': drafts_data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@draft_bp.route('/drafts/<int:draft_id>', methods=['GET'])
@jwt_required()
def get_draft_details(draft_id):
    try:
        user_id = get_jwt_identity()
        
        # Verify user has access to this draft
        draft = Draft.query.join(FantasyLeague).filter(
            Draft.id == draft_id,
            FantasyLeague.user_id == user_id
        ).first()
        
        if not draft:
            return jsonify({'success': False, 'error': 'Draft not found or access denied'}), 404
        
        draft_dict = draft.to_dict()
        
        # Get draft picks
        picks = DraftPick.query.filter_by(draft_id=draft_id).order_by(DraftPick.pick_number).all()
        draft_dict['picks'] = [pick.to_dict() for pick in picks]
        
        # Get league information
        draft_dict['league'] = draft.league.to_dict()
        
        # Analyze draft trends
        draft_trends = ai_engine.analyze_draft_trends(draft_id)
        draft_dict['trends'] = draft_trends
        
        return jsonify({
            'success': True,
            'data': draft_dict
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@draft_bp.route('/drafts/<int:draft_id>/recommendations', methods=['GET'])
@jwt_required()
def get_draft_recommendations(draft_id):
    try:
        user_id = get_jwt_identity()
        
        # Verify user has access to this draft
        draft = Draft.query.join(FantasyLeague).filter(
            Draft.id == draft_id,
            FantasyLeague.user_id == user_id
        ).first()
        
        if not draft:
            return jsonify({'success': False, 'error': 'Draft not found or access denied'}), 404
        
        # Get already drafted players
        drafted_picks = DraftPick.query.filter_by(draft_id=draft_id).all()
        drafted_player_ids = [pick.player_id for pick in drafted_picks if pick.player_id]
        
        # Get available players (not drafted)
        available_players = Player.query.filter(
            Player.is_active == True,
            ~Player.id.in_(drafted_player_ids)
        ).limit(100).all()  # Limit for performance
        
        # Calculate user's team needs based on drafted players
        user_picks = [pick for pick in drafted_picks if pick.is_user_pick]
        user_team_needs = calculate_team_needs(user_picks, draft.league.roster_settings)
        
        # Get AI recommendations
        recommendations = ai_engine.get_player_recommendations(
            user_id=user_id,
            draft_id=draft_id,
            available_players=available_players,
            current_round=draft.current_round,
            user_team_needs=user_team_needs
        )
        
        # Format recommendations for response
        recommendations_data = []
        for rec in recommendations:
            player_dict = rec['player'].to_dict()
            
            # Add current season stats
            current_season = 2024
            from src.models.player import PlayerStatistic
            stats = PlayerStatistic.query.filter_by(
                player_id=rec['player'].id,
                season=current_season,
                week=None
            ).all()
            
            player_dict['current_stats'] = {stat.stat_type: stat.stat_value for stat in stats}
            
            recommendations_data.append({
                'player': player_dict,
                'score': rec['score'],
                'reasoning': rec['reasoning']
            })
        
        return jsonify({
            'success': True,
            'data': {
                'recommendations': recommendations_data,
                'user_team_needs': user_team_needs,
                'available_count': len(available_players)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@draft_bp.route('/drafts/<int:draft_id>/picks', methods=['POST'])
@jwt_required()
def record_draft_pick(draft_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'player_id' not in data:
            return jsonify({'success': False, 'error': 'Missing player_id'}), 400
        
        # Verify user has access to this draft
        draft = Draft.query.join(FantasyLeague).filter(
            Draft.id == draft_id,
            FantasyLeague.user_id == user_id
        ).first()
        
        if not draft:
            return jsonify({'success': False, 'error': 'Draft not found or access denied'}), 404
        
        # Verify player exists and is available
        player = Player.query.get(data['player_id'])
        if not player:
            return jsonify({'success': False, 'error': 'Player not found'}), 404
        
        # Check if player is already drafted
        existing_pick = DraftPick.query.filter_by(
            draft_id=draft_id,
            player_id=data['player_id']
        ).first()
        
        if existing_pick:
            return jsonify({'success': False, 'error': 'Player already drafted'}), 400
        
        # Calculate pick details
        total_picks = DraftPick.query.filter_by(draft_id=draft_id).count()
        pick_number = total_picks + 1
        
        # Create draft pick
        draft_pick = DraftPick(
            draft_id=draft_id,
            player_id=data['player_id'],
            team_position=data.get('team_position', 1),  # Would be calculated based on draft order
            round_number=draft.current_round,
            pick_number=pick_number,
            is_user_pick=data.get('is_user_pick', False)
        )
        
        db.session.add(draft_pick)
        
        # Update draft status if needed
        if pick_number >= (draft.total_rounds * 12):  # Assuming 12-team league
            draft.draft_status = 'completed'
            draft.draft_end_time = datetime.utcnow()
        else:
            # Update current round and pick
            picks_per_round = 12  # Assuming 12-team league
            draft.current_round = (pick_number - 1) // picks_per_round + 1
            draft.current_pick = ((pick_number - 1) % picks_per_round) + 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'pick': draft_pick.to_dict(),
                'draft_status': draft.draft_status
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@draft_bp.route('/drafts/<int:draft_id>/start', methods=['POST'])
@jwt_required()
def start_draft(draft_id):
    try:
        user_id = get_jwt_identity()
        
        # Verify user has access to this draft
        draft = Draft.query.join(FantasyLeague).filter(
            Draft.id == draft_id,
            FantasyLeague.user_id == user_id
        ).first()
        
        if not draft:
            return jsonify({'success': False, 'error': 'Draft not found or access denied'}), 404
        
        if draft.draft_status != 'scheduled':
            return jsonify({'success': False, 'error': 'Draft cannot be started'}), 400
        
        # Start the draft
        draft.draft_status = 'active'
        draft.draft_start_time = datetime.utcnow()
        draft.current_round = 1
        draft.current_pick = 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': draft.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

def calculate_team_needs(user_picks, roster_settings_json):
    """
    Calculate team positional needs based on current picks and roster requirements
    """
    # Default roster requirements (would come from roster_settings in production)
    default_roster = {
        'QB': 1,
        'RB': 2,
        'WR': 2,
        'TE': 1,
        'K': 1,
        'DST': 1,
        'BENCH': 6
    }
    
    # Count current positions
    current_positions = {}
    for pick in user_picks:
        if pick.player and pick.player.position:
            pos = pick.player.position
            current_positions[pos] = current_positions.get(pos, 0) + 1
    
    # Calculate needs
    team_needs = {}
    for position, required in default_roster.items():
        if position == 'BENCH':
            continue
        current = current_positions.get(position, 0)
        need = max(0, required - current)
        
        # Add urgency level (0-3)
        if need >= required:
            team_needs[position] = 3  # High need
        elif need > 0:
            team_needs[position] = 2  # Medium need
        elif current < required + 1:
            team_needs[position] = 1  # Low need (depth)
        else:
            team_needs[position] = 0  # No need
    
    return team_needs

