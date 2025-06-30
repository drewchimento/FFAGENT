import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from src.models.user import db
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.preferences import preferences_bp
from src.routes.players import players_bp
from src.routes.leagues import leagues_bp
# from src.routes.draft import draft_bp  # Temporarily disabled for deployment
# from src.routes.websocket import init_socketio_events  # Temporarily disabled

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
app.config['JWT_SECRET_KEY'] = 'ffagent-jwt-secret-key-2024'

# Enable CORS for all routes with explicit configuration
CORS(app, 
     origins=["*"],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True)

# Initialize JWT
jwt = JWTManager(app)

# Initialize SocketIO with CORS support
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Initialize WebSocket events
# init_socketio_events(socketio)  # Temporarily disabled

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(preferences_bp, url_prefix='/api')
app.register_blueprint(players_bp, url_prefix='/api')
app.register_blueprint(leagues_bp, url_prefix='/api')
# app.register_blueprint(draft_bp, url_prefix='/api')  # Temporarily disabled

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Import all models to ensure they're registered
from src.models import *

with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Don't serve static files for API routes
    if path.startswith('api/'):
        return {'error': 'API endpoint not found'}, 404
    
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)

