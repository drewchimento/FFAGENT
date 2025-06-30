# FFAgent - AI Fantasy Football Draft Assistant

Your AI-powered right-hand man for fantasy football drafts. FFAgent provides real-time, data-driven recommendations tailored to your statistical preferences during live fantasy football drafts.

## 🏈 Features

- **Statistical Customization**: Prioritize 25+ fantasy football statistics across all positions
- **Position-Specific Analysis**: Tailored recommendations for QB, RB, WR, TE, K, DST
- **Real-Time Draft Interface**: Live draft monitoring with AI-powered suggestions
- **Mobile-First Design**: Responsive interface that works on all devices
- **User Preferences**: Customizable importance weighting (1-5 scale) for each statistic
- **Secure Authentication**: JWT-based login system with password hashing

## 🚀 Live Demo

- **Frontend**: https://omxbrfqz.manus.space
- **Backend API**: https://zmhqivcg1km6.manus.space

## 📁 Project Structure

```
ffagent_complete/
├── ffagent_frontend/          # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # API utilities
│   │   └── App.jsx           # Main application
│   ├── package.json
│   └── vite.config.js
├── ffagent_backend/           # Flask backend API
│   ├── src/
│   │   ├── models/           # Database models
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   └── main.py           # Application entry point
│   ├── requirements.txt
│   └── README.md
└── README.md                  # This file
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Hooks** for state management

### Backend
- **Flask** web framework
- **Flask-SQLAlchemy** for database ORM
- **Flask-JWT-Extended** for authentication
- **Flask-CORS** for cross-origin requests
- **SQLite** database (production ready)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- pip

### Backend Setup

1. Navigate to backend directory:
```bash
cd ffagent_backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the backend:
```bash
python src/main.py
```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd ffagent_frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### Production Build

1. Build frontend:
```bash
cd ffagent_frontend
npm run build
```

2. The built files will be in `ffagent_frontend/dist/`

## 📊 Available Statistics

### Offensive Stats
- Rushing Yards, Receiving Yards, Passing Yards
- Rushing TDs, Receiving TDs, Passing TDs
- Receptions, Targets, Carries
- Interceptions, Fumbles

### Advanced Stats
- Red Zone Touches, Target Share
- Air Yards, Yards After Catch

### Defensive Stats (DST)
- Sacks, Interceptions, Fumble Recoveries
- Defensive Touchdowns, Points Allowed, Yards Allowed

### Special Teams
- Field Goals Made, Extra Points Made
- Field Goal Percentage

## 🔧 Configuration

### Backend Configuration
- Update `src/main.py` for database and CORS settings
- Modify `requirements.txt` for additional dependencies

### Frontend Configuration
- Update `src/lib/api.js` for API endpoint configuration
- Modify `package.json` for build settings

## 🌐 Deployment

### Backend Deployment
The backend is configured for deployment on cloud platforms with:
- CORS enabled for cross-origin requests
- SQLite database for simplicity
- Environment-based configuration

### Frontend Deployment
The frontend builds to static files suitable for:
- Netlify, Vercel, GitHub Pages
- CDN deployment
- Static hosting services

## 🔐 Authentication

Users can register and login with:
- Email/password authentication
- JWT token-based sessions
- Secure password hashing
- Persistent login state

## 📱 Mobile Support

FFAgent is designed mobile-first with:
- Responsive design for all screen sizes
- Touch-friendly interface
- Optimized for draft day usage on phones/tablets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🎯 Future Enhancements

- Real player data integration
- Live draft room functionality
- Advanced AI recommendation engine
- League management features
- Historical draft analysis

## 📞 Support

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for fantasy football enthusiasts**

