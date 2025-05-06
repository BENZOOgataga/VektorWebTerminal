import React from 'react';

interface ContextPanelProps {
  commandHistory: string[];
  resourceUsage: { cpu: string; memory: string };
}

const ContextPanel: React.FC<ContextPanelProps> = ({ commandHistory, resourceUsage }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between border-b border-glass pb-2 mb-2">
        <h3 className="font-bold text-white/80">Context Panel</h3>
        <div className="text-sm bg-glass px-3 py-1 rounded-full backdrop-blur-sm">
          <span className="mr-3 text-blue-400">CPU: {resourceUsage.cpu}</span>
          <span className="text-green-400">Memory: {resourceUsage.memory}</span>
        </div>
      </div>
      
      <div className="flex-grow overflow-auto px-1">
        <div className="mb-3">
          <h4 className="text-sm font-semibold mb-1 text-white/70">Command History</h4>
          <div className="text-sm bg-glass backdrop-blur-sm p-3 rounded-lg border border-glass shadow-glass-inner">
            {commandHistory.length > 0 ? (
              <ul className="list-none">
                {commandHistory.map((cmd, index) => (
                  <li key={index} className="py-0.5 font-mono">
                    <span className="text-cyan-400">$</span> <span className="text-white/90">{cmd}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="italic text-gray-500">No commands executed yet</p>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-1 text-white/70">User Info</h4>
          <div className="text-sm bg-glass backdrop-blur-sm p-3 rounded-lg border border-glass shadow-glass-inner">
            <p><span className="text-gray-400">username:</span> <span className="text-white/90">user</span></p>
            <p><span className="text-gray-400">permissions:</span> <span className="text-white/90">standard</span></p>
            <p><span className="text-gray-400">session:</span> <span className="text-white/90">ephemeral</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextPanel;