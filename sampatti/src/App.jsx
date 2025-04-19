import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Layout
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import HomePage from './pages/HomePage';

// Pages
//const Dashboard = lazy(() => import('./pages/Dashboard'));
//const Investments = lazy(() => import('./pages/Investments'));
//const Documents = lazy(() => import('./pages/Documents'));
//const Nominees = lazy(() => import('./pages/Nominees'));
//const Alerts = lazy(() => import('./pages/Alerts'));
//const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/auth/Login'));
//const Register = lazy(() => import('./pages/auth/Register'));
//const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
//const NotFound = lazy(() => import('./pages/NotFound'));

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
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        
        {/* Auth Routes 
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        
        {/* Protected Routes 
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/nominees" element={<Nominees />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* Not Found Route 
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
        */}
      </Routes>
    </Suspense>
  );
}

export default App;