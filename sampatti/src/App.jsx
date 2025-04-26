import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import HomePage from './pages/HomePage';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import EmergencyAccess from './pages/EmergencyAccess';
import EmergencyView from './components/EmergencyView';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AssetList = lazy(() => import('./pages/investments/AssetList'));
const AddAsset = lazy(() => import('./pages/investments/AddAsset'));
const AssetDetails = lazy(() => import('./pages/investments/AssetDetails'));
const EditAsset = lazy(() => import('./pages/investments/EditAsset'));
const Nominees = lazy(() => import('./pages/Nominees'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-gray-300">Loading...</p>
    </div>
  </div>
);

function App() {
  // Clean up any refresh intervals on unmount
  useEffect(() => {
    return () => {
      if (window.tokenRefreshInterval) {
        clearInterval(window.tokenRefreshInterval);
      }
    };
  }, []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />

{/* Auth Routes */}
<Route element={<AuthLayout />}>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
</Route>

{/* Emergency Access Route (Public) - simplified to a single route */}
<Route path="/emergency-access" element={<EmergencyAccess />} />

{/* Protected Routes */}
<Route element={
  <ProtectedRoute>
    <MainLayout />
  </ProtectedRoute>
}>
  <Route path="/dashboard" element={<Dashboard />} />
  
  {/* Investment Routes */}
  <Route path="/investments" element={<AssetList />} />
  <Route path="/investments/add" element={<AddAsset />} />
  <Route path="/investments/:id" element={<AssetDetails />} />
  <Route path="/investments/:id/edit" element={<EditAsset />} />
  
  {/* Other protected routes */}
  <Route path="/nominees" element={<Nominees />} />
  <Route path="/alerts" element={<Alerts />} />
  <Route path="/settings" element={<Settings />} />
</Route>

{/* Not Found Route */}
<Route path="/404" element={<NotFound />} />
<Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;