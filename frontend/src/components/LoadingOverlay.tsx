import React from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      <div className="text-gray-200 mt-4 font-mono text-lg">
        <div className="flex items-center justify-center">
          <span className="mr-2">Initializing terminal</span>
          <span className="inline-flex">
            <span className="animate-[bounce_1s_infinite_0ms]">.</span>
            <span className="animate-[bounce_1s_infinite_200ms]">.</span>
            <span className="animate-[bounce_1s_infinite_400ms]">.</span>
          </span>
        </div>
        <div className="text-sm text-gray-400 mt-2 text-center">Vektor v1.0.0</div>
      </div>
    </div>
  );
};

export default LoadingOverlay;