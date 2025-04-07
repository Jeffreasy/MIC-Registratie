import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
          <div className="h-24 bg-muted rounded w-64 mx-auto"></div>
          <div className="h-8 bg-muted rounded w-40 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState; 