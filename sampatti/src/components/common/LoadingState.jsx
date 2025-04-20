// src/components/common/LoadingState.jsx
import React from 'react';
import { Loader } from 'lucide-react';

const LoadingState = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader size={36} className="animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-300">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;