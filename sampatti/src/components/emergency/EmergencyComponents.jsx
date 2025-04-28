// src/components/emergency/EmergencyComponents.jsx
import React from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatFileSize, getDocumentIcon } from '../../utils/emergencyUtils';

/**
 * Component for displaying an asset in emergency access view
 */
export const EmergencyAssetItem = ({ asset }) => {
  if (!asset) return null;
  
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

/**
 * Component for displaying a document in emergency access view
 */
export const EmergencyDocumentItem = ({ document, onDownload }) => {
  if (!document) return null;
  
  const handleDownload = () => {
    if (onDownload && typeof onDownload === 'function') {
      onDownload(document);
    }
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
          <button 
            onClick={handleDownload}
            className="text-blue-400 hover:text-blue-300"
            title="View document"
          >
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

/**
 * Component for displaying when no assets are available
 */
export const EmptyAssetsState = ({ message = "No investments found" }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
      <AlertTriangle size={24} className="mx-auto text-gray-500 mb-2" />
      <p className="text-gray-400">{message}</p>
    </div>
  );
};

/**
 * Component for displaying when no documents are available
 */
export const EmptyDocumentsState = ({ message = "No accessible documents found" }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
      <AlertTriangle size={24} className="mx-auto text-gray-500 mb-2" />
      <p className="text-gray-400">{message}</p>
    </div>
  );
};

/**
 * Component for displaying user info in emergency access
 */
export const EmergencyUserInfo = ({ user, accessLevel }) => {
  if (!user) return null;
  
  let accessLevelClass = '';
  switch (accessLevel) {
    case 'Full':
      accessLevelClass = 'text-green-400';
      break;
    case 'Limited':
      accessLevelClass = 'text-blue-400';
      break;
    case 'DocumentsOnly':
      accessLevelClass = 'text-yellow-400';
      break;
    default:
      accessLevelClass = 'text-gray-400';
  }
  
  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-bold text-white">{user.name || 'User'}</h2>
      <p className="text-gray-400">{user.email || ''}</p>
      
      <div className="mt-3">
        <span className="text-sm">
          You have <span className={`font-medium ${accessLevelClass}`}>{accessLevel} Access</span>
        </span>
      </div>
    </div>
  );
};