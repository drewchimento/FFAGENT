# FFAgent Setup Guide

## Development Environment Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd ffagent
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd ffagent_backend
pip install -r requirements.txt
```

#### Initialize Database
```bash
python -c "
from src.main import app, db
with app.app_context():
    db.create_all()
    print('Database initialized successfully')
"
```

#### Start Backend Server
```bash
python src/main.py
```
Backend will run on `http://localhost:5000`

### 3. Frontend Setup

#### Install Node Dependencies
```bash
cd ffagent_frontend
npm install
```

#### Start Development Server
```bash
npm run dev
```
Frontend will run on `http://localhost:5173`

## Production Deployment

### Backend Deployment

1. **Update CORS settings** in `src/main.py` for your domain
2. **Set environment variables** for production
3. **Deploy to your preferred platform** (Heroku, Railway, etc.)

### Frontend Deployment

1. **Update API URL** in `src/lib/api.js` to your backend URL
2. **Build for production**:
   ```bash
   npm run build
   ```
3. **Deploy the `dist/` folder** to your hosting service

## Environment Variables

### Backend (.env)
```
FLASK_ENV=production
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
DATABASE_URL=your-database-url
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.com/api
```

## Database Schema

The application uses SQLite by default with these models:
- **User**: Authentication and user data
- **UserPreference**: Statistical preferences per user
- **Player**: Player information and statistics
- **League**: League management
- **DraftPick**: Draft tracking

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Preferences
- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update user preferences
- `GET /api/preferences/available-stats` - Get available statistics

### Players
- `GET /api/players` - Get player data
- `GET /api/players/search` - Search players

## Troubleshooting

### Common Issues

1. **CORS Errors**: Update CORS settings in backend `main.py`
2. **Database Errors**: Reinitialize database with setup script
3. **Port Conflicts**: Change ports in configuration files
4. **Build Errors**: Clear node_modules and reinstall

### Debug Mode

Enable debug mode by setting `debug=True` in `src/main.py`:
```python
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
```

## Performance Optimization

### Frontend
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Optimize bundle size with code splitting

### Backend
- Add database indexing for frequently queried fields
- Implement caching for static data
- Use connection pooling for database

## Security Considerations

- Keep JWT secrets secure
- Implement rate limiting
- Validate all user inputs
- Use HTTPS in production
- Regular security updates

