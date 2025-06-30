from flask import request
from flask_socketio import emit, join_room, leave_room, disconnect
from flask_jwt_extended import decode_token
from src.services.draft_room import draft_room_manager
from src.models.user import User
from src.models.league import Draft, FantasyLeague
import json

def init_socketio_events(socketio):
    """Initialize all SocketIO event handlers"""
    
    @socketio.on('connect')
    def handle_connect(auth):
        """Handle client connection"""
        try:
            # Verify JWT token
            if not auth or 'token' not in auth:
                disconnect()
                return False
            
            token = auth['token']
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']
            
            user = User.query.get(user_id)
            if not user:
                disconnect()
                return False
            
            # Store user info in session
            request.sid_user_id = user_id
            request.sid_username = user.username
            
            emit('connected', {
                'status': 'success',
                'user_id': user_id,
                'username': user.username
            })
            
        except Exception as e:
            print(f"Connection error: {e}")
            disconnect()
            return False
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        try:
            user_id = getattr(request, 'sid_user_id', None)
            if user_id:
                # Remove user from any active draft rooms
                for room in draft_room_manager.active_rooms.values():
                    room.remove_participant(str(user_id))
        except Exception as e:
            print(f"Disconnect error: {e}")
    
    @socketio.on('join_draft')
    def handle_join_draft(data):
        """Join a draft room"""
        try:
            user_id = getattr(request, 'sid_user_id', None)
            username = getattr(request, 'sid_username', None)
            
            if not user_id:
                emit('error', {'message': 'Not authenticated'})
                return
            
            draft_id = data.get('draft_id')
            if not draft_id:
                emit('error', {'message': 'Draft ID required'})
                return
            
            # Verify user has access to this draft
            draft = Draft.query.join(FantasyLeague).filter(
                Draft.id == draft_id,
                FantasyLeague.user_id == user_id
            ).first()
            
            if not draft:
                emit('error', {'message': 'Draft not found or access denied'})
                return
            
            # Get or create draft room
            room = draft_room_manager.get_or_create_room(draft_id)
            
            # Add user to room
            user_info = {
                'username': username,
                'team_position': data.get('team_position', 1)
            }
            room.add_participant(str(user_id), user_info)
            
            # Join SocketIO room
            join_room(f'draft_{draft_id}')
            
            # Send current draft state
            draft_state = room.get_draft_state()
            emit('draft_joined', {
                'draft_state': draft_state,
                'available_players': room.get_available_players()[:20]
            })
            
            # Notify other participants
            emit('user_joined', {
                'user_id': user_id,
                'username': username,
                'team_position': user_info['team_position']
            }, room=f'draft_{draft_id}', include_self=False)
            
        except Exception as e:
            print(f"Join draft error: {e}")
            emit('error', {'message': 'Failed to join draft'})
    
    @socketio.on('leave_draft')
    def handle_leave_draft(data):
        """Leave a draft room"""
        try:
            user_id = getattr(request, 'sid_user_id', None)
            draft_id = data.get('draft_id')
            
            if user_id and draft_id:
                # Remove from draft room
                if draft_id in draft_room_manager.active_rooms:
                    room = draft_room_manager.active_rooms[draft_id]
                    room.remove_participant(str(user_id))
                
                # Leave SocketIO room
                leave_room(f'draft_{draft_id}')
                
                # Notify other participants
                emit('user_left', {
                    'user_id': user_id
                }, room=f'draft_{draft_id}')
                
        except Exception as e:
            print(f"Leave draft error: {e}")
    
    @socketio.on('make_pick')
    def handle_make_pick(data):
        """Handle draft pick"""
        try:
            user_id = getattr(request, 'sid_user_id', None)
            if not user_id:
                emit('error', {'message': 'Not authenticated'})
                return
            
            draft_id = data.get('draft_id')
            player_id = data.get('player_id')
            
            if not draft_id or not player_id:
                emit('error', {'message': 'Draft ID and Player ID required'})
                return
            
            # Get draft room
            if draft_id not in draft_room_manager.active_rooms:
                emit('error', {'message': 'Draft room not found'})
                return
            
            room = draft_room_manager.active_rooms[draft_id]
            
            # Make the pick
            pick_result = room.make_pick(str(user_id), player_id)
            
            # Broadcast pick to all participants
            socketio.emit('pick_made', pick_result, room=f'draft_{draft_id}')
            
            # Start timer for next pick if draft continues
            if room.draft.draft_status == 'active':
                room.start_pick_timer()
                socketio.emit('pick_timer_started', {
                    'timer': room._get_timer_info()
                }, room=f'draft_{draft_id}')
            
        except ValueError as e:
            emit('error', {'message': str(e)})
        except Exception as e:
            print(f"Make pick error: {e}")
            emit('error', {'message': 'Failed to make pick'})
    
    @socketio.on('get_recommendations')
    def handle_get_recommendations(data):
        """Get AI recommendations for current user"""
        try:
            user_id = getattr(request, 'sid_user_id', None)
            if not user_id:
                emit('error', {'message': 'Not authenticated'})
                return
            
            draft_id = data.get('draft_id')
            if not draft_id or draft_id not in draft_room_manager.active_rooms:
                emit('error', {'message': 'Draft room not found'})
                return
            
            room = draft_room_manager.active_rooms[draft_id]
            recommendations = room._get_next_recommendations()
            
            emit('recommendations_updated', {
                'recommendations': recommendations
            })
            
        except Exception as e:
            print(f"Get recommendations error: {e}")
            emit('error', {'message': 'Failed to get recommendations'})
    
    @socketio.on('search_players')
    def handle_search_players(data):
        """Search for available players"""
        try:
            draft_id = data.get('draft_id')
            search_term = data.get('search', '')
            position = data.get('position')
            
            if not draft_id or draft_id not in draft_room_manager.active_rooms:
                emit('error', {'message': 'Draft room not found'})
                return
            
            room = draft_room_manager.active_rooms[draft_id]
            players = room.get_available_players(position=position, search=search_term)
            
            emit('players_search_result', {
                'players': players[:50],  # Limit results
                'search_term': search_term,
                'position': position
            })
            
        except Exception as e:
            print(f"Search players error: {e}")
            emit('error', {'message': 'Failed to search players'})
    
    @socketio.on('get_draft_state')
    def handle_get_draft_state(data):
        """Get current draft state"""
        try:
            draft_id = data.get('draft_id')
            if not draft_id or draft_id not in draft_room_manager.active_rooms:
                emit('error', {'message': 'Draft room not found'})
                return
            
            room = draft_room_manager.active_rooms[draft_id]
            draft_state = room.get_draft_state()
            
            emit('draft_state_updated', {
                'draft_state': draft_state
            })
            
        except Exception as e:
            print(f"Get draft state error: {e}")
            emit('error', {'message': 'Failed to get draft state'})
    
    return socketio

