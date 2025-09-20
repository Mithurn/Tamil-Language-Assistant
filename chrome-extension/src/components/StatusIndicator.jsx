import React from 'react';

const StatusIndicator = ({ status, className = "" }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500 animate-pulse';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
        return 'bg-red-500 animate-pulse';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'API Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'API Error';
      default:
        return 'Checking API...';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
      <span className="text-sm text-gray-400">{getStatusText()}</span>
    </div>
  );
};

export default StatusIndicator;

