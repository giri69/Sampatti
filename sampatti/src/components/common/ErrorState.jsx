// src/components/common/ErrorState.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ErrorState = ({ 
  message = "Something went wrong", 
  details = null,
  onRetry = null 
}) => {
  return (
    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 mb-6">
      <h3 className="font-medium mb-2 flex items-center">
        <AlertTriangle size={18} className="mr-2" />
        Error
      </h3>
      <p>{message}</p>
      {details && <p className="text-sm mt-2 text-red-300">{details}</p>}
      
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="mt-3 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorState;