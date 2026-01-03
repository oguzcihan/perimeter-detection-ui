import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/Auth';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './views/Dashboard';
import VideoROI from './views/VideoROI';
import Settings from './views/Settings';
import Statistics from './views/Statistics';
import EditProfile from './views/EditProfile';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VideoProvider } from './context/VideoContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';

// Simple placeholder for other routes
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-6 text-white bg-slate-800 rounded-lg border border-slate-700">
    <h2 className="text-xl font-bold mb-2 text-emerald-400">{title}</h2>
    <p className="text-slate-400">This module is correctly routed but not yet implemented.</p>
  </div>
);

// Wrapper to prevent access to login/register if already authenticated (like source App.js)
const PublicRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <VideoProvider>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <AuthLayout />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <AuthLayout />
            </PublicRoute>
          } />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="video-roi" element={<VideoROI />} />
              <Route path="settings" element={<Settings />} />
              <Route path="edit-profile" element={<EditProfile />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="feeds" element={<Placeholder title="Live Camera Feeds" />} />
              <Route path="system" element={<Placeholder title="System Status & Diagnostics" />} />
            </Route>
          </Route>

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </VideoProvider>
    </AuthProvider>
  );
}

export default App;
