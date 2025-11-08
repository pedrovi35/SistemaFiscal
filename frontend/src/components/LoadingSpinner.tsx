import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-3',
    lg: 'h-16 w-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} rounded-full border-gray-200 dark:border-gray-700`}></div>
        
        {/* Spinning ring with gradient */}
        <div 
          className={`absolute top-0 left-0 ${sizeClasses[size]} rounded-full border-transparent animate-spin`}
          style={{
            borderTopColor: '#3b82f6',
            borderRightColor: '#8b5cf6',
          }}
        ></div>
        
        {/* Inner glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-sm animate-pulse"></div>
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {text && (
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {text}
          </p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;

