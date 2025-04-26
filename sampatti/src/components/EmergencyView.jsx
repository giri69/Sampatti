import { useState, useEffect } from 'react';
import { FileText, PieChart, Shield, AlertTriangle, User, ExternalLink } from 'lucide-react';
import Card from '../components/common/Card';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

// Asset Component for rendering investment items
const AssetItem = ({ asset }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
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
  );
};

// Document Component for rendering document items
const DocumentItem = ({ document }) => {
  const getDocumentIcon = (mimeType) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('text')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    return '📎';
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start">
        <div className="mr-3 text-2xl">{getDocumentIcon(document.mime_type)}</div>
        <div className="flex-grow">
          <h3 className="font-medium text-white">{document.title}</h3>
          <p className="text-sm text-gray-400">{document.document_type} • {formatFileSize(document.file_size)}</p>
        </div>
        <div>
          <button className="text-blue-400 hover:text-blue-300">
            <ExternalLink size={18} />
          </button>
        </div>
      </div>
      
      {document.description && (
        <p className="text-sm text-gray-300 mt-2 ml-10">{document.description}</p>
      )}
    </div>
  );
};

const EmergencyView = () => {
  const [userData, setUserData] = useState(null);
  const [accessLevel, setAccessLevel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);
  
  // Extract userId from URL path
  const path = window.location.pathname;
  const userId = path.split('/').pop();
  
  useEffect(() => {
    const fetchEmergencyData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if we have an emergency access token
        const accessToken = localStorage.getItem('emergencyAccessToken');
        if (!accessToken) {
          throw new Error('Access token missing. Please enter your emergency access code again.');
        }
        
        // Get user data
        const dataResponse = await fetch(`/api/v1/emergency-access/data/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (!dataResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await dataResponse.json();
        setUserData(data);
        setOwnerInfo(data.owner);
        
        // Get access level from response header or data
        setAccessLevel(data.accessLevel || 'Limited');
        
      } catch (err) {
        console.error('Error fetching emergency data:', err);
        setError(err.message || 'Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEmergencyData();
  }, [userId]);
  
  const handleLogout = () => {
    localStorage.removeItem('emergencyAccessToken');
    window.location.href = '/emergency-access';
  };
  
  if (isLoading) {
    return <LoadingState message="Loading data..." />;
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex flex-col items-center justify-center">
        <ErrorState 
          message={error} 
          details="You may need to re-enter your emergency access code."
          onRetry={() => window.location.href = '/emergency-access'}
        />
      </div>
    );
  }
  
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
          className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700"
        >
          Exit Access
        </button>
      </header>
      
      <div className="container mx-auto p-6 space-y-6">
        {/* User info card */}
        <Card>
          <div className="flex items-start">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mr-4">
              <User size={24} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{ownerInfo?.name || 'User'}</h1>
              <p className="text-gray-400">{ownerInfo?.email || ''}</p>
              
              <div className="mt-3 flex items-center">
                <Shield size={16} className="text-yellow-400 mr-2" />
                <span className="text-sm">
                  You have <span className="font-medium text-white">{accessLevel} Access</span> as a nominee
                </span>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Assets Section - visible for Full and Limited access */}
        {(accessLevel === 'Full' || accessLevel === 'Limited') && userData?.assets && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center">
              <PieChart size={20} className="mr-2 text-blue-400" />
              Investments
            </h2>
            
            {userData.assets.length === 0 ? (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
                <AlertTriangle size={24} className="mx-auto text-gray-500 mb-2" />
                <p className="text-gray-400">No investments found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userData.assets.map(asset => (
                  <AssetItem key={asset.id} asset={asset} />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Documents Section - visible for all access levels */}
        {userData?.documents && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center">
              <FileText size={20} className="mr-2 text-purple-400" />
              Documents
            </h2>
            
            {userData.documents.length === 0 ? (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
                <AlertTriangle size={24} className="mx-auto text-gray-500 mb-2" />
                <p className="text-gray-400">No accessible documents found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userData.documents.map(document => (
                  <DocumentItem key={document.id} document={document} />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* If DocumentsOnly access level and no documents */}
        {accessLevel === 'DocumentsOnly' && (!userData?.documents || userData.documents.length === 0) && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
            <AlertTriangle size={24} className="mx-auto text-gray-500 mb-2" />
            <p className="text-white font-medium mb-1">No Documents Available</p>
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

export default EmergencyView;