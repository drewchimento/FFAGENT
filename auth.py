from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from src.models.user import User, db
from src.models.preferences import UserPreference, AVAILABLE_STATS
import json

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        
        if not data or not data.get("email") or not data.get("password") or not data.get("username"):
            return jsonify({"success": False, "error": "Missing required fields"}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"success": False, "error": "Email already registered"}), 400
        
        if User.query.filter_by(username=data["username"]).first():
            return jsonify({"success": False, "error": "Username already taken"}), 400
        
        # Create new user
        user = User(
            email=data["email"],
            username=data["username"]
        )
        user.set_password(data["password"])
        
        db.session.add(user)
        db.session.commit()
        
        # Create default preferences for new user
        default_preferences = [
            {"stat_name": "rushing_yards", "importance_weight": 4.0},
            {"stat_name": "receiving_yards", "importance_weight": 4.0},
            {"stat_name": "passing_yards", "importance_weight": 3.5},
            {"stat_name": "rushing_touchdowns", "importance_weight": 5.0},
            {"stat_name": "receiving_touchdowns", "importance_weight": 5.0},
            {"stat_name": "passing_touchdowns", "importance_weight": 4.5},
            {"stat_name": "receptions", "importance_weight": 3.0},
            {"stat_name": "targets", "importance_weight": 2.5}
        ]
        
        for pref_data in default_preferences:
            preference = UserPreference(
                user_id=user.id,
                stat_name=pref_data["stat_name"],
                importance_weight=pref_data["importance_weight"],
                is_enabled=True
            )
            db.session.add(preference)
        
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            "success": True,
            "data": {
                "user": user.to_dict(),
                "token": access_token
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get("email") or not data.get("password"):
            return jsonify({"success": False, "error": "Missing email or password"}), 400
        
        user = User.query.filter_by(email=data["email"]).first()
        
        if not user or not user.check_password(data["password"]):
            return jsonify({"success": False, "error": "Invalid credentials"}), 401
        
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            "success": True,
            "data": {
                "user": user.to_dict(),
                "token": access_token
            }
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        return jsonify({
            "success": True,
            "data": {
                "user": user.to_dict()
            }
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


