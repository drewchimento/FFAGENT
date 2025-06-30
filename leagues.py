from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db
from src.models.league import FantasyLeague, Draft
from datetime import datetime
import json

leagues_bp = Blueprint('leagues', __name__)

@leagues_bp.route('/leagues', methods=['GET'])
@jwt_required()
def get_user_leagues():
    try:
        user_id = get_jwt_identity()
        leagues = FantasyLeague.query.filter_by(user_id=user_id, is_active=True).all()
        
        leagues_data = []
        for league in leagues:
            league_dict = league.to_dict()
            
            # Add draft information
            active_draft = Draft.query.filter_by(
                league_id=league.id,
                draft_status='active'
            ).first()
            
            upcoming_draft = Draft.query.filter_by(
                league_id=league.id,
                draft_status='scheduled'
            ).first()
            
            league_dict["active_draft"] = active_draft.to_dict() if active_draft else None
            league_dict["upcoming_draft"] = upcoming_draft.to_dict() if upcoming_draft else None
            
            leagues_data.append(league_dict)
        
        return jsonify({
            'success': True,
            'data': leagues_data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@leagues_bp.route('/leagues', methods=['POST'])
@jwt_required()
def create_league():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ['platform', 'league_id', 'league_name', 'scoring_type']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        # Check if league already exists for this user
        existing_league = FantasyLeague.query.filter_by(
            user_id=user_id,
            platform=data['platform'],
            league_id=data['league_id']
        ).first()
        
        if existing_league:
            return jsonify({'success': False, 'error': 'League already exists'}), 400
        
        # Create new league
        league = FantasyLeague(
            user_id=user_id,
            platform=data['platform'],
            league_id=data['league_id'],
            league_name=data['league_name'],
            scoring_type=data['scoring_type'],
            roster_settings=json.dumps(data.get('roster_settings', {})),
            draft_settings=json.dumps(data.get('draft_settings', {}))
        )
        
        db.session.add(league)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': league.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@leagues_bp.route('/leagues/<int:league_id>', methods=['GET'])
@jwt_required()
def get_league_details(league_id):
    try:
        user_id = get_jwt_identity()
        
        league = FantasyLeague.query.filter_by(
            id=league_id,
            user_id=user_id
        ).first()
        
        if not league:
            return jsonify({'success': False, 'error': 'League not found'}), 404
        
        league_dict = league.to_dict()
        
        # Add drafts information
        drafts = Draft.query.filter_by(league_id=league.id).all()
        league_dict['drafts'] = [draft.to_dict() for draft in drafts]
        
        return jsonify({
            'success': True,
            'data': league_dict
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@leagues_bp.route('/leagues/<int:league_id>', methods=['PUT'])
@jwt_required()
def update_league(league_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        league = FantasyLeague.query.filter_by(
            id=league_id,
            user_id=user_id
        ).first()
        
        if not league:
            return jsonify({'success': False, 'error': 'League not found'}), 404
        
        # Update allowed fields
        if 'league_name' in data:
            league.league_name = data['league_name']
        if 'scoring_type' in data:
            league.scoring_type = data['scoring_type']
        if 'roster_settings' in data:
            league.roster_settings = json.dumps(data['roster_settings'])
        if 'draft_settings' in data:
            league.draft_settings = json.dumps(data['draft_settings'])
        
        league.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': league.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@leagues_bp.route('/leagues/<int:league_id>', methods=['DELETE'])
@jwt_required()
def delete_league(league_id):
    try:
        user_id = get_jwt_identity()
        
        league = FantasyLeague.query.filter_by(
            id=league_id,
            user_id=user_id
        ).first()
        
        if not league:
            return jsonify({'success': False, 'error': 'League not found'}), 404
        
        # Soft delete
        league.is_active = False
        league.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'League deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@leagues_bp.route('/leagues/<int:league_id>/drafts', methods=['POST'])
@jwt_required()
def create_draft(league_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Verify league ownership
        league = FantasyLeague.query.filter_by(
            id=league_id,
            user_id=user_id
        ).first()
        
        if not league:
            return jsonify({'success': False, 'error': 'League not found'}), 404
        
        # Create new draft
        draft = Draft(
            league_id=league_id,
            draft_type=data.get('draft_type', 'snake'),
            total_rounds=data.get('total_rounds', 16),
            draft_start_time=datetime.fromisoformat(data['draft_start_time']) if 'draft_start_time' in data else None
        )
        
        db.session.add(draft)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': draft.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

