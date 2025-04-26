// src/pages/auth/Login.jsx - Updated to use Zustand store
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../store';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use Zustand store auth
  const { login, loading, error, clearError } = useAuth();

  useEffect(() => {
    // Clear any previous auth errors on mount
    clearError();
    
    // Check for messages from redirects
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clean up state after reading the message
      window.history.replaceState({}, document.title);
    }
  }, [location, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Login with Zustand store
      await login(email, password);
      
      // Get redirect path from location state or default to dashboard
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo);
    } catch (err) {
      // Error already handled in store
      console.error('Login error:', err);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center md:hidden">
        <Lock className="text-white mr-2" size={24} />
        <span className="font-bold text-2xl tracking-tight text-white">Sampatti</span>
      </div>

      <h2 className="text-3xl font-bold mb-2 text-white">Sign in to your account</h2>
      <p className="text-gray-400 mb-8">Welcome back! Please enter your details.</p>
      
      {error && (
        <ErrorState message={error} />
      )}
      
      {successMessage && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2 text-white">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-gray-500" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2 text-white">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-500" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-10 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
              placeholder="••••••••"
              required
              disabled={loading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff size={18} className="text-gray-500" />
              ) : (
                <Eye size={18} className="text-gray-500" />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-600 bg-black text-blue-500 focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
              Remember me
            </label>
          </div>
          
          <Link 
            to="/forgot-password" 
            className="text-sm text-blue-400 hover:text-blue-300"
            tabIndex={loading ? -1 : 0}
          >
            Forgot password?
          </Link>
        </div>
        
        <Button
          type="submit"
          variant="white"
          isLoading={loading}
          className="w-full"
        >
          Sign in
        </Button>
      </form>
      
      <p className="mt-8 text-center text-sm text-white">
        Don't have an account?{' '}
        <Link 
          to="/register" 
          className="font-medium text-blue-400 hover:text-blue-300"
          tabIndex={loading ? -1 : 0}
        >
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default Login;