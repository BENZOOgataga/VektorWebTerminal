import React from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(13,13,20,0.8)] backdrop-blur-md z-50 flex flex-col items-center justify-center">
      {/* Decorative circles */}
      <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-purple-600 filter blur-[100px] opacity-20"></div>
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full bg-blue-600 filter blur-[100px] opacity-20"></div>
      
      {/* Glass card */}
      <div className="bg-glass backdrop-blur-md border border-glass rounded-2xl p-8 shadow-glass">
        <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
        <div className="text-gray-200 mt-6 font-mono text-lg text-center">
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
    </div>
  );
};

export default LoadingOverlay;