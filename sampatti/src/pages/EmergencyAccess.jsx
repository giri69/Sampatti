import { useState } from 'react';
import { Shield, Mail, Key, ArrowRight, LogOut, User, PieChart, FileText, Download } from 'lucide-react';

// Format utilities
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return 'N/A';
  }
};

const EmergencyAccess = () => {
  // Form state
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data state
  const [userData, setUserData] = useState(null);
  const [accessGranted, setAccessGranted] = useState(false);
  
  /**
   * Handles form submission to request emergency access
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !accessCode) {
      setError('Please enter both email and access code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the emergency access API directly
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
        throw new Error(errorData.error || `Emergency access failed (${response.status})`);
      }
      
      // Parse the response which now contains all needed data
      const data = await response.json();
      
      // Store token for potential use in later requests
      if (data.access_token) {
        localStorage.setItem('emergencyAccessToken', data.access_token);
      }
      
      // Set the data directly from the response
      setUserData(data);
      
      // Grant access to view data
      setAccessGranted(true);
    } catch (err) {
      console.error('Emergency access error:', err);
      setError(err.message || 'Invalid credentials. Please check your email and access code.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Logs out and resets the emergency access view
   */
  const handleLogout = () => {
    localStorage.removeItem('emergencyAccessToken');
    setAccessGranted(false);
    setUserData(null);
    setEmail('');
    setAccessCode('');
  };
  
  // Login form view
  if (!accessGranted) {
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
  }
  
  // Emergency data view (when access is granted)
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <Shield size={24} className="text-indigo-400 mr-2" />
          <h1 className="text-xl font-bold text-white">Emergency Access</h1>
        </div>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 flex items-center"
        >
          <LogOut size={18} className="mr-2" />
          Exit Access
        </button>
      </header>
      
      <div className="container mx-auto p-6 space-y-6">
        {/* User info card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-start">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mr-4">
              <User size={24} className="text-blue-400" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-white">{userData?.user?.name || 'User'}</h2>
              <p className="text-gray-400">{userData?.user?.email || ''}</p>
              
              <div className="mt-3">
                <span className="text-sm">
                  You have <span className={`font-medium ${
                    userData?.access_level === 'Full' ? 'text-green-400' : 
                    userData?.access_level === 'Limited' ? 'text-blue-400' : 
                    'text-yellow-400'
                  }`}>{userData?.access_level} Access</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Assets Section - visible for Full and Limited access */}
        {(userData?.access_level === 'Full' || userData?.access_level === 'Limited') && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center">
              <PieChart size={20} className="mr-2 text-blue-400" />
              Investments
            </h2>
            
            {!userData?.assets || userData.assets.length === 0 ? (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
                <p className="text-gray-400">No investments are available to view</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userData.assets.map(asset => (
                  <div key={asset.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">{asset.asset_name}</h3>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400">
                        {asset.asset_type}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-3">{asset.institution || 'No institution'}</p>
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-gray-500">Current Value</p>
                        <p className="text-lg font-semibold text-white">{formatCurrency(asset.current_value)}</p>
                      </div>
                      
                      {asset.account_number && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Account</p>
                          <p className="text-sm text-gray-300">{asset.account_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Documents Section - visible for all access levels */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center">
            <FileText size={20} className="mr-2 text-purple-400" />
            Documents
          </h2>
          
          {!userData?.documents || userData.documents.length === 0 ? (
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
              <p className="text-gray-400">No accessible documents found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userData.documents.map(document => (
                <div key={document.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-start">
                    <div className="mr-3 text-2xl">📄</div>
                    <div className="flex-grow">
                      <h3 className="font-medium text-white">{document.title}</h3>
                      <p className="text-sm text-gray-400">
                        {document.document_type} • {document.file_size ? (document.file_size > 1048576 ? 
                          `${(document.file_size/1048576).toFixed(1)} MB` : 
                          `${(document.file_size/1024).toFixed(1)} KB`) : ''}
                      </p>
                    </div>
                    <div>
                      <button 
                        className="text-blue-400 hover:text-blue-300"
                        title="Download document"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {document.description && (
                    <p className="text-sm text-gray-300 mt-2 ml-10">{document.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* If DocumentsOnly access level and no documents */}
        {userData?.access_level === 'DocumentsOnly' && (!userData?.documents || userData.documents.length === 0) && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-red-500/30 text-center">
            <p className="text-white font-medium mb-1">No Available Documents</p>
            <p className="text-gray-400">
              You have documents-only access but there are no documents available for viewing.
            </p>
          </div>
        )}
        
        <div className="text-center text-gray-500 text-sm mt-8">
          This is an emergency access view. All activity is being logged.
        </div>
      </div>
    </div>
  );
};

export default EmergencyAccess;