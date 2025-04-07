import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-slate-900">
      <div className="absolute top-4 right-4">
        {/* Theme Toggle in top-right corner */}
      </div>
      <div className="w-full max-w-md px-4 sm:px-6 py-6 sm:py-8">
        <div className="animate-pulse flex justify-center">
          <div className="h-12 w-48 bg-blue-100 dark:bg-blue-900 rounded mb-4"></div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-3/4 mx-auto bg-blue-100 dark:bg-blue-900 rounded"></div>
          <div className="h-12 bg-blue-100 dark:bg-blue-900 rounded"></div>
          <div className="h-12 bg-blue-100 dark:bg-blue-900 rounded"></div>
          <div className="h-12 bg-blue-100 dark:bg-blue-900 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState; 