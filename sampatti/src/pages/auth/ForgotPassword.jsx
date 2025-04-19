import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { requestPasswordReset } from '../../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Call the password reset API
      await requestPasswordReset(email);
      
      // Show success message
      setIsSubmitted(true);
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Link to="/login" className="flex items-center text-sm text-blue-400 mb-8 hover:text-blue-300">
        <ArrowLeft size={16} className="mr-2" />
        Back to login
      </Link>

      {isSubmitted ? (
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Check your email</h2>
          <p className="text-gray-400 mb-6">
            We've sent a password reset link to <span className="text-white">{email}</span>. 
            Please check your inbox and follow the instructions.
          </p>
          <div className="p-6 bg-white/5 border border-white/10 rounded-lg mb-6">
            <p className="text-gray-300">
              Didn't receive the email? Check your spam folder or 
              <button 
                onClick={() => setIsSubmitted(false)} 
                className="text-blue-400 hover:text-blue-300 ml-1"
              >
                try again
              </button>.
            </p>
          </div>
          <Link 
            to="/login" 
            className="inline-block px-4 py-2 text-blue-400 border border-blue-400/30 rounded-lg hover:bg-blue-400/10 transition-colors"
          >
            Return to login
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-3xl font-bold mb-2 text-white">Reset your password</h2>
          <p className="text-gray-400 mb-8">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
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
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-white text-black font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ForgotPassword;