# 🌊 Oceanova - Maritime Weather Intelligence Platform

A real-time maritime weather intelligence platform built with modern web technologies, providing weather forecasts, alerts, fleet management, and AI-powered speed optimization for maritime operations.

## 🚀 Live Demo

[Deploy your own instance](#deployment) or visit the live application.

## ✨ Features

### 🌤️ Weather Intelligence
- **10-Day Weather Forecasts** - Comprehensive maritime weather predictions
- **Real-time Weather Alerts** - Storm, swell, and visibility warnings
- **Interactive Weather Map** - Visual representation with Leaflet integration
- **Location-based Data** - GPS coordinates with reverse geocoding

### 🚢 Fleet Management
- **Vessel Tracking** - Real-time GPS positioning and status
- **Fleet Overview** - Centralized vessel management dashboard
- **IMO & MMSI Support** - International maritime identification standards

### ⚡ AI-Powered Optimization
- **Speed Recommendations** - Weather-based speed optimization
- **Fuel Efficiency** - AI-calculated fuel savings
- **Route Planning** - Weather-aware route optimization
- **Risk Assessment** - Automated weather risk evaluation

### 🔐 Security & Authentication
- **User Authentication** - Secure login system
- **Vessel Ownership** - Row-level security for fleet data
- **Anonymous Access** - Public weather features

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Leaflet** - Interactive mapping library

### Backend & Database
- **Convex** - Real-time backend platform
- **TypeScript** - Full-stack type safety
- **Real-time Queries** - Live data subscriptions
- **Automatic Scaling** - Cloud-native infrastructure

### External APIs
- **Open-Meteo** - Free weather data (temperature, wind, precipitation)
- **Marine API** - Wave height, period, and direction data
- **Nominatim** - OpenStreetMap geocoding service

### Authentication
- **Convex Auth** - Built-in authentication system
- **Password Provider** - Traditional username/password
- **Anonymous Provider** - Guest access for public features

### Development Tools
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing pipeline

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Convex Backend │    │ External APIs   │
│                 │◄──►│                 │◄──►│                 │
│ • TypeScript    │    │ • Real-time DB  │    │ • Open-Meteo    │
│ • Tailwind CSS  │    │ • Auth System   │    │ • Marine Data   │
│ • Leaflet Maps  │    │ • Functions     │    │ • Geocoding     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **User Input** → React Components
2. **API Calls** → Convex Functions
3. **External APIs** → Weather Data Fetching
4. **Database Storage** → Convex Tables
5. **Real-time Updates** → Live UI Updates

### Database Schema
- **`users`** - Authentication and user management
- **`vessels`** - Fleet information and GPS tracking
- **`weatherForecasts`** - 10-day weather predictions
- **`weatherAlerts`** - Real-time weather warnings
- **`speedRecommendations`** - AI-generated optimizations
- **`routeOptimizations`** - Weather-aware routing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Convex account (free tier available)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ocean
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Convex**
```bash
npx convex dev
```

4. **Configure environment variables**
Create a `.env.local` file:
```env
VITE_CONVEX_URL=your_convex_deployment_url
```

5. **Start development server**
```bash
npm run dev
```

### Development Commands

```bash
# Start development servers (frontend + backend)
npm run dev

# Build for production
npm run build

# Type checking
npm run lint

# Deploy to GitHub Pages
npm run deploy
```

## 🌐 Deployment

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: GitHub Pages
```bash
npm run deploy
```

### Option 3: Netlify
1. Build: `npm run build`
2. Drag `dist` folder to Netlify
3. Get instant live URL

### Option 4: Railway
- Full-stack hosting
- Supports Convex backend
- Starts at $5/month

## 📱 Features in Detail

### Weather Dashboard
- **Current Conditions** - Temperature, wind, waves, visibility
- **Active Alerts** - Real-time weather warnings
- **Fleet Status** - Vessel count and tracking status
- **Location Management** - GPS coordinates with address lookup

### Weather Map
- **Interactive Mapping** - Leaflet-based visualization
- **Weather Overlays** - Alert zones and vessel positions
- **Custom Controls** - Zoom, center, and radius settings
- **Real-time Updates** - Live data refresh

### Speed Optimization
- **AI Algorithms** - Weather-based speed calculations
- **Fuel Savings** - Percentage-based efficiency metrics
- **Time Impact** - Journey duration adjustments
- **Weather Conditions** - Wind, waves, and current analysis

## 🔧 Configuration

### Tailwind CSS
- Custom color palette for maritime theme
- Responsive design breakpoints
- Glassmorphism effects
- Dark/light mode support

### Convex Functions
- **Queries** - Data retrieval with real-time subscriptions
- **Mutations** - Database write operations
- **Actions** - External API calls and complex logic
- **Indexes** - Optimized database queries

### Environment Variables
- `VITE_CONVEX_URL` - Convex deployment URL
- No API keys required for weather data (free tier)

## 📊 Performance

### Optimizations
- **React 19** concurrent features
- **Vite** fast HMR and build
- **Convex** automatic query optimization
- **Tailwind JIT** CSS compilation
- **Asset optimization** and compression

### Metrics
- **Build Time**: ~14 seconds
- **Bundle Size**: ~480KB (gzipped: ~141KB)
- **CSS Size**: ~40KB (gzipped: ~11KB)
- **Real-time Updates**: <100ms latency

## 🔒 Security

### Authentication
- Password-based user accounts
- Anonymous access for public features
- Row-level security for vessel data
- Secure session management

### Data Protection
- Vessel ownership verification
- Location-based access control
- API rate limiting
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
