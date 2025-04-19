import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Eye, EyeOff, Phone } from 'lucide-react';
import { registerUser } from '../../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    date_of_birth: null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    
    // Password length validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data for API - remove confirmPassword as it's not needed on backend
      const { confirmPassword, ...apiData } = formData;
      
      // Log the request data for debugging
      console.log('Sending registration data:', apiData);
      
      // Call the registration API
      await registerUser(apiData);
      
      // Redirect to login with success message
      navigate('/login', { 
        state: { message: 'Account created successfully! Please sign in.' } 
      });
    } catch (err) {
      console.error('Registration error:', err);
      if (err.message && err.message.includes('already exists')) {
        setError('This email is already registered. Please use a different email or try logging in.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Logo for mobile view */}
      <div className="mb-8 flex items-center md:hidden">
        <Lock className="text-white mr-2" size={24} />
        <span className="font-bold text-2xl tracking-tight text-white">Sampatti</span>
      </div>

      <h2 className="text-3xl font-bold mb-2 text-white">Create your account</h2>
      <p className="text-gray-400 mb-8">Start tracking your investments securely.</p>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2 text-white">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={18} className="text-gray-500" />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
              placeholder="Enter your full name"
              required
            />
          </div>
        </div>
        
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
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium mb-2 text-white">
            Phone Number (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone size={18} className="text-gray-500" />
            </div>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
              placeholder="Enter your phone number"
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
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              className="block w-full pl-10 pr-10 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
              placeholder="Create a strong password"
              required
              minLength="8"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={18} className="text-gray-500" />
              ) : (
                <Eye size={18} className="text-gray-500" />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Must be at least 8 characters long
          </p>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-white">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-500" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
              placeholder="Confirm your password"
              required
            />
          </div>
        </div>
        
        <div className="flex items-start pt-2">
          <input
            id="terms"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-600 bg-black text-blue-500 focus:ring-blue-500 mt-1"
            required
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
            I agree to the{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
          </label>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-white text-black font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors mt-4"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </form>
      
      <p className="mt-8 text-center text-sm text-white">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">
          Sign in instead
        </Link>
      </p>
    </div>
  );
};

export default Register;