<div align="center">

<h1>⚡ RideX</h1>
<p><strong>Real-Time Cab Booking Platform</strong></p>
<p>Full-stack ride-hailing app with live WebSocket communication, 3 role-based dashboards, OTP-secured rides, complaint management, and vehicle-type-matched ride delivery.</p>

<br/>

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-6-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)

<br/>

<img src="https://img.shields.io/badge/Roles-Rider%20%7C%20Driver%20%7C%20Admin-e8ff47?style=flat-square&labelColor=0a0a0a"/>
<img src="https://img.shields.io/badge/Maps-Leaflet%20%2B%20OpenStreetMap-brightgreen?style=flat-square"/>
<img src="https://img.shields.io/badge/Real--Time-Socket.IO-blueviolet?style=flat-square"/>
<img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square"/>

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Demo Credentials](#-demo-credentials)
- [Ride Flow](#-ride-flow)
- [Vehicle Type Matching](#-vehicle-type-matching)
- [Complaint & Moderation System](#-complaint--moderation-system)
- [Real-Time Notifications](#-real-time-notifications)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)

---

## 🚀 Overview

RideX is a production-grade ride-hailing platform built to mirror the architecture of apps like Uber and Ola. It supports three distinct user roles — **Rider**, **Driver**, and **Admin** — each with their own fully functional dashboard, powered by real-time WebSocket events.

Every feature is wired end-to-end:
- Riders book rides, track drivers live on a map, receive OTPs, and can **rate or file complaints** after every trip
- Drivers receive ride requests **matched to their vehicle type only**, navigate the full ride lifecycle, and get paid automatically
- Admins get **live notifications** for every new user join and complaint, can block drivers directly from complaints, and manage the full platform

---

## ✨ Features

### 🚖 Rider
- Book rides across **5 vehicle types** — Sedan, SUV, Hatchback, Motorcycle, Auto
- Live **fare estimation** across all vehicle types before confirming
- Real-time **driver tracking** on an interactive Leaflet map (no API key required)
- **OTP-secured** ride start — OTP generated only when driver accepts, shared only on arrival
- Post-ride **star rating + review** with tag chips
- Post-ride **complaint filing** with 6 categories — routed to admin in real-time
- Tapping the ride completion notification → **jumps directly to ride history**

### 🚗 Driver
- Available rides feed filtered to **their vehicle type only** — no irrelevant notifications
- **OTP verification** before starting any ride
- Preview route on map **before accepting** any ride card
- Full ride lifecycle: Accept → Arriving → In Progress → Complete
- **Earnings tracker** with per-ride breakdown (85/15 platform split)
- Online/Offline toggle — **offline drivers receive zero notifications**

### 🛡 Admin
- **Real-time toast notifications** when a new rider joins, driver applies, or complaint is filed
- **Block driver directly from a complaint** — one-click action, 23-hour auto-expire
- Manual unblock at any time (sends unblock notification to user)
- Blocked drivers see a **full-screen lockout** with reason + exact unblock time on login
- Full complaint lifecycle: Open → In Review → Resolved → Closed
- Platform analytics with **7-day rides chart**, revenue, completion rate, open complaints count
- Driver approval/rejection with instant notification
- Rides table with vehicle type column

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | SPA with fast HMR dev experience |
| Styling | Inline CSS + CSS Variables | Custom dark design system, no framework dependency |
| Backend | Node.js + Express | REST API, business logic, WebSocket bridge |
| Real-Time | Socket.IO | Bi-directional events: ride status, GPS, notifications |
| Database | MongoDB + Mongoose | Flexible schema for rides, users, payments |
| Auth | JWT (7-day expiry) | Role-based: rider / driver / admin |
| Maps | Leaflet + OpenStreetMap | Zero cost, no API key needed |
| Payments | Simulated (cash/card/wallet) | 85/15 driver/platform split recorded in DB |
| Notifications | Socket.IO + MongoDB | Real-time delivery + persistent cross-session |

---

## 🏗 Architecture

```
RideX/
├── backend/
│   └── src/
│       ├── controllers/
│       │   ├── authController.js     ← Register/login + admin notify on join
│       │   ├── rideController.js     ← Full ride lifecycle + vehicle-type filter
│       │   ├── driverController.js   ← Profile, earnings, online toggle
│       │   └── adminController.js    ← Block/unblock, complaint actions, analytics
│       ├── models/
│       │   ├── User.js               ← blockReason + blockedUntil (23h timer)
│       │   ├── Driver.js             ← isOnline, status, earnings
│       │   ├── Vehicle.js            ← vehicleType (used for ride matching)
│       │   ├── Ride.js               ← Full ride state + OTP field
│       │   ├── Complaint.js          ← category, driverId, status flow
│       │   ├── Notification.js       ← Persisted notifications
│       │   ├── Review.js             ← Star rating + tags
│       │   └── Payment.js            ← Transaction records
│       ├── routes/
│       │   ├── rides.js
│       │   ├── complaints.js         ← POST /complaints, GET /complaints/my
│       │   ├── admin.js              ← Includes /complaints/:id/block-driver
│       │   ├── notifications.js
│       │   └── reviews.js
│       ├── middleware/
│       │   ├── auth.js               ← JWT protect + auto-unblock on expiry
│       │   └── validate.js
│       └── utils/
│           ├── notify.js             ← 20+ notification templates
│           ├── fareCalculator.js     ← Haversine distance + per-type pricing
│           └── seedData.js           ← Auto-seeds on first DB connect
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── RiderDashboard.jsx    ← Book, Active, History tabs
        │   ├── DriverDashboard.jsx   ← Available, My Rides, Earnings
        │   ├── AdminDashboard.jsx    ← Analytics, Riders, Drivers, Complaints
        │   ├── Login.jsx             ← Blocked screen with reason + unblock time
        │   └── Register.jsx
        ├── components/
        │   ├── ReviewModal.jsx       ← Post-ride rating
        │   ├── ComplaintModal.jsx    ← Post-ride complaint with 6 categories
        │   ├── NotificationPanel.jsx ← Bell icon, real-time feed, click-to-navigate
        │   └── RideMap.jsx           ← Leaflet map, driver GPS updates
        └── context/
            ├── AuthContext.jsx
            └── SocketContext.jsx
```

---

## 🏁 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- npm

### Installation

```bash
# 1. Clone or extract the project
git clone https://github.com/yourusername/ridex.git
cd ridex

# 2. Start MongoDB
mongod

# 3. Backend setup (Terminal 1)
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000

# 4. Frontend setup (Terminal 2)
cd ../frontend
npm install
npm run dev
# App opens at http://localhost:5173
```

> **Note:** The database is seeded automatically on first run with demo users, drivers, vehicles, rides, and notifications.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| 🛡 Admin | `admin` or `admin@ridex.com` | `admin` |
| 🚖 Rider | `arjun@example.com` | `rider123` |
| 🚗 Driver | `anzil@example.com` | `driver123` |

---

## 🔄 Ride Flow

```
requested → accepted → driver_arriving → in_progress → completed
```

| Status | What Happens |
|---|---|
| `requested` | Ride created, OTP is `null`. Only online drivers with **matching vehicle type** get notified |
| `accepted` | Driver accepts. **OTP generated** and sent to both rider AND driver via notification |
| `driver_arriving` | Driver taps "I'm arriving". Rider notified to get ready and prepare OTP |
| `in_progress` | Driver enters OTP from rider. Ride timer starts |
| `completed` | Payment recorded. Rider gets notification prompting both **rate** and **report** |

---

## 🚗 Vehicle Type Matching

RideX enforces strict vehicle-type validation at every level:

```
Rider selects "Sedan"
        ↓
requestRide checks all online/approved/available drivers
        ↓
For each driver → fetch their Vehicle document
        ↓
Only send notification if vehicle.vehicleType === "sedan"
        ↓
Driver's "Available Rides" feed also filters by their type
```

**Supported types:** `sedan` · `suv` · `hatchback` · `motorcycle` · `auto`

This prevents incorrect matches and ensures a Bike driver never sees an SUV ride request.

---

## ⚠ Complaint & Moderation System

### Filing a Complaint (Rider)
1. After a completed ride, ride history shows both **⭐ Rate** and **⚠ Report** buttons
2. Tapping the `ride_completed` notification navigates directly to history
3. Complaint form: choose from 6 categories, enter subject + description
4. Rider gets instant confirmation notification
5. All admin accounts receive a real-time toast notification

### Admin Moderation
```
Complaint filed
      ↓
Admin sees it live (toast notification + complaint panel updates)
      ↓
Admin clicks "🚫 Block Driver 23h" on the complaint card
      ↓
Driver gets account_blocked notification with reason + unblock time
      ↓
Driver logs in → full-screen blocked page (reason + "Auto-unblocks at: [time]")
      ↓
After 23 hours → auth middleware auto-unblocks on next API call
      ↓
Driver gets account_unblocked notification
```

**Block options:**
- `timed: true` (default) — 23-hour auto-expire
- `timed: false` — permanent until admin manually unblocks

**Complaint statuses:** `open` → `in_review` → `resolved` → `closed`

---

## 🔔 Real-Time Notifications

Every platform action triggers a targeted Socket.IO event and persists a notification to MongoDB.

| Event | Recipient(s) | Notes |
|---|---|---|
| New ride requested | Matching drivers only | Vehicle-type filtered |
| Driver accepts | Rider + Driver | OTP included in both messages |
| Driver arriving | Rider | Prompt to prepare OTP |
| Ride completed | Rider + Driver | Rider: rate/report prompt · Driver: earnings |
| Complaint filed | Rider + All Admins | Admin gets real-time toast |
| New rider registered | All Admins | Name included |
| New driver registered | All Admins | Approval prompt included |
| Account blocked | Blocked user | Reason + auto-unblock time |
| Account unblocked | User | Confirmation message |
| Payment received | Driver | Earning amount |
| Review received | Driver | Star count + rider name |

---

## 📡 API Reference

All protected routes require: `Authorization: Bearer <token>`

<details>
<summary><strong>Auth</strong></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register rider or driver |
| POST | `/api/auth/login` | ❌ | Login — returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user profile |
| PUT | `/api/auth/profile` | ✅ | Update profile |
| PUT | `/api/auth/password` | ✅ | Change password |

</details>

<details>
<summary><strong>Rides</strong></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/rides/estimate` | ✅ | Fare estimate for all 5 vehicle types |
| POST | `/api/rides/request` | ✅ Rider | Book a ride |
| GET | `/api/rides/active` | ✅ Rider | Current active ride |
| GET | `/api/rides/my-rides` | ✅ | Ride history |
| PUT | `/api/rides/:id/cancel` | ✅ Rider | Cancel ride |
| PUT | `/api/rides/:id/rate` | ✅ Rider | Rate completed ride |
| GET | `/api/rides/available` | ✅ Driver | Available rides (vehicle-type filtered) |
| GET | `/api/rides/driver-rides` | ✅ Driver | Driver's ride history |
| PUT | `/api/rides/:id/accept` | ✅ Driver | Accept ride — generates OTP |
| PUT | `/api/rides/:id/status` | ✅ Driver | Update ride status |

</details>

<details>
<summary><strong>Complaints</strong></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/complaints` | ✅ Rider | File a complaint |
| GET | `/api/complaints/my` | ✅ | Get my complaints |

</details>

<details>
<summary><strong>Notifications</strong></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | ✅ | Get all notifications |
| PUT | `/api/notifications/:id/read` | ✅ | Mark one as read |
| PUT | `/api/notifications/read-all` | ✅ | Mark all as read |
| DELETE | `/api/notifications/:id` | ✅ | Delete notification |

</details>

<details>
<summary><strong>Admin</strong></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/analytics` | ✅ Admin | Platform analytics |
| GET | `/api/admin/riders` | ✅ Admin | All riders |
| GET | `/api/admin/drivers` | ✅ Admin | All drivers |
| PUT | `/api/admin/drivers/:id/approve` | ✅ Admin | Approve/reject driver |
| PUT | `/api/admin/users/:id/block` | ✅ Admin | Block/unblock user (23h timer) |
| DELETE | `/api/admin/users/:id` | ✅ Admin | Delete user |
| GET | `/api/admin/rides` | ✅ Admin | All rides |
| GET | `/api/admin/complaints` | ✅ Admin | All complaints with driver info |
| PUT | `/api/admin/complaints/:id` | ✅ Admin | Update complaint status |
| PUT | `/api/admin/complaints/:id/block-driver` | ✅ Admin | Block driver from complaint |

</details>

<details>
<summary><strong>Driver</strong></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/driver/profile` | ✅ Driver | Get driver profile |
| POST | `/api/driver/profile` | ✅ Driver | Create/update profile + vehicle |
| PUT | `/api/driver/toggle-online` | ✅ Driver | Toggle online status |
| GET | `/api/driver/earnings` | ✅ Driver | Earnings summary |

</details>

---

## 🔧 Environment Variables

Create a `.env` file in `backend/`:

```env
MONGODB_URI=mongodb://localhost:27017/ridex
JWT_SECRET=your_super_secret_key_here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

---

## 📁 Project Structure (Quick View)

```
RideX/
├── backend/
│   ├── src/
│   │   ├── controllers/    (authController, rideController, driverController, adminController)
│   │   ├── models/         (User, Driver, Vehicle, Ride, Complaint, Notification, Review, Payment)
│   │   ├── routes/         (auth, rides, driver, admin, complaints, notifications, reviews, payment)
│   │   ├── middleware/     (auth.js — JWT + auto-unblock, validate.js)
│   │   ├── utils/          (notify.js, fareCalculator.js, seedData.js, token.js)
│   │   └── server.js       (Express + Socket.IO setup)
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/          (Home, Login, Register, RiderDashboard, DriverDashboard, AdminDashboard)
    │   ├── components/     (Navbar, ReviewModal, ComplaintModal, NotificationPanel, RideMap, ...)
    │   ├── context/        (AuthContext, SocketContext)
    │   └── api/            (axios.js — base URL + token interceptor)
    ├── index.html
    └── package.json
```

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<div align="center">
  <p>Built with Node.js · React · MongoDB · Socket.IO</p>
  <p><em>Every feature wired end-to-end — from OTP generation to timed account blocks to vehicle-type-matched ride delivery.</em></p>
</div>
