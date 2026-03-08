import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const RiderDashboard = lazy(() => import('./pages/RiderDashboard'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/rider'} /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/rider" /> : <Register />} />
          <Route path="/rider" element={<ProtectedRoute roles={['rider']}><RiderDashboard /></ProtectedRoute>} />
          <Route path="/driver" element={<ProtectedRoute roles={['driver']}><DriverDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1a1a1a', color: '#f8f8f8', border: '1px solid #333', borderRadius: '10px', fontSize: '14px' },
              success: { iconTheme: { primary: '#e8ff47', secondary: '#0a0a0a' } },
              error: { iconTheme: { primary: '#e74c3c', secondary: '#fff' } }
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
