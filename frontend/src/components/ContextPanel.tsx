import React from 'react';

interface ContextPanelProps {
  commandHistory: string[];
  resourceUsage: { cpu: string; memory: string };
}

const ContextPanel: React.FC<ContextPanelProps> = ({ commandHistory, resourceUsage }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between border-b border-gray-700 pb-1 mb-2">
        <h3 className="font-bold">Context Panel</h3>
        <div className="text-sm">
          <span className="mr-3">CPU: {resourceUsage.cpu}</span>
          <span>Memory: {resourceUsage.memory}</span>
        </div>
      </div>
      
      <div className="flex-grow overflow-auto">
        <div className="mb-3">
          <h4 className="text-sm font-semibold mb-1">Command History</h4>
          <div className="text-sm bg-gray-800 p-1 rounded">
            {commandHistory.length > 0 ? (
              <ul className="list-none">
                {commandHistory.map((cmd, index) => (
                  <li key={index} className="py-0.5">$ {cmd}</li>
                ))}
              </ul>
            ) : (
              <p className="italic text-gray-500">No commands executed yet</p>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-1">User Info</h4>
          <div className="text-sm bg-gray-800 p-1 rounded">
            <p>username: term-user</p>
            <p>permissions: standard</p>
            <p>session: ephemeral</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextPanel;