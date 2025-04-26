import { useState } from 'react';
import { Lock, Shield, Mail, Key } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ErrorState from '../components/common/ErrorState';

const EmergencyAccess = () => {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !accessCode) {
      setError('Please enter both email and access code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/v1/auth/emergency-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          emergency_access_code: accessCode
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid access credentials');
      }
      
      const data = await response.json();
      
      // Store the emergency access token
      localStorage.setItem('emergencyAccessToken', data.access_token);
      
      // Navigate to the emergency data view
      window.location.href = `/emergency-view/${data.user_id}`;
    } catch (err) {
      console.error('Emergency access error:', err);
      setError(err.message || 'Failed to verify access. Please check your email and code.');
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
        
        {error && <ErrorState message={error} className="mb-6" />}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            icon={<Mail size={18} className="text-gray-500" />}
            required
            disabled={isLoading}
          />
          
          <Input
            label="Emergency Access Code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Enter your access code"
            icon={<Key size={18} className="text-gray-500" />}
            required
            disabled={isLoading}
          />
          
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Access Data
          </Button>
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