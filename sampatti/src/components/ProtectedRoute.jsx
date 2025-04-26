// src/components/ProtectedRoute.jsx - Uses Zustand store
import { Navigate, useLocation } from 'react-router-dom';
import { useProtectedRoute } from '../hooks/useProtectedRoute';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useProtectedRoute();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the intended destination to return after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render the protected content
  return children;
};

export default ProtectedRoute;