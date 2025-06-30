from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db
from src.models.preferences import UserPreference, AVAILABLE_STATS

preferences_bp = Blueprint('preferences', __name__)

@preferences_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    try:
        user_id = int(get_jwt_identity())
        preferences = UserPreference.query.filter_by(user_id=user_id).all()
        
        return jsonify({
            'success': True,
            'data': [pref.to_dict() for pref in preferences]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@preferences_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data or 'preferences' not in data:
            return jsonify({'success': False, 'error': 'Missing preferences data'}), 400
        
        # Delete existing preferences
        UserPreference.query.filter_by(user_id=user_id).delete()
        
        # Add new preferences
        for pref_data in data['preferences']:
            if not all(key in pref_data for key in ['stat_name', 'is_enabled', 'importance_weight']):
                return jsonify({'success': False, 'error': 'Invalid preference data'}), 400
            
            preference = UserPreference(
                user_id=user_id,
                stat_name=pref_data['stat_name'],
                is_enabled=pref_data['is_enabled'],
                importance_weight=pref_data['importance_weight']
            )
            db.session.add(preference)
        
        db.session.commit()
        
        # Return updated preferences
        preferences = UserPreference.query.filter_by(user_id=user_id).all()
        
        return jsonify({
            'success': True,
            'data': [pref.to_dict() for pref in preferences]
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@preferences_bp.route('/preferences/available-stats', methods=['GET'])
def get_available_stats():
    try:
        return jsonify({
            'success': True,
            'data': AVAILABLE_STATS
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

