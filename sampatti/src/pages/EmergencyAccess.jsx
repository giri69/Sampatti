import { useState } from 'react';
import { Shield, Mail, Key, ArrowRight } from 'lucide-react';
import { emergencyLogin } from '../utils/api';

const EmergencyAccess = () => {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !accessCode) {
      setError('Please enter both email and access code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the emergency access API
      const data = await emergencyLogin(email, accessCode);
      
      // Store the access token
      if (data.access_token) {
        localStorage.setItem('emergencyAccessToken', data.access_token);
      }
      
      // Save user data for display
      setUserData(data);
      
      // Redirect to emergency view page with user ID
      if (data.user_id) {
        window.location.href = `/emergency-view/${data.user_id}`;
      } else {
        throw new Error('User ID not found in response');
      }
    } catch (err) {
      console.error('Emergency access error:', err);
      setError(err.message || 'Invalid credentials. Please check your email and access code.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-8 border border-gray-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Emergency Access</h1>
          <p className="text-gray-400">
            Enter your email and emergency access code to view investment details
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-white">
              Email Address
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
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium mb-2 text-white">
              Emergency Access Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key size={18} className="text-gray-500" />
              </div>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
                placeholder="Enter your access code"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              <span className="flex items-center">
                Access Data <ArrowRight size={18} className="ml-2" />
              </span>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Return to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAccess;