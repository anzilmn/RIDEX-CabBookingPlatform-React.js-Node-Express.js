# 🚖 RideX – Premium Ride Booking Platform

## Quick Start

### 1. Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start MongoDB
```bash
mongod
```

### 3. Start Backend
```bash
cd backend && npm run dev
```

### 4. Start Frontend
```bash
cd frontend && npm run dev
```

Open http://localhost:5173

## Login Credentials

| Role   | Email/Username        | Password   |
|--------|-----------------------|------------|
| Admin  | admin OR admin@ridex.com | admin   |
| Rider  | arjun@example.com     | rider123   |
| Driver | anzil@example.com     | driver123  |

## Architecture
- **Frontend**: React + Vite (port 5173)
- **Backend**: Node.js + Express (port 5000)
- **Database**: MongoDB (port 27017)
- **Real-time**: Socket.IO

## Features
✅ JWT Authentication with roles  
✅ Rider: book rides, track status, history  
✅ Driver: accept rides, manage status, earnings  
✅ Admin: full control panel with analytics  
✅ Real-time ride status updates  
✅ Fare estimation by vehicle type  
✅ Complete validation on all forms  
✅ Seed data auto-loaded on first run  
