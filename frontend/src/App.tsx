import React, { useEffect, useState } from 'react';
import './App.css';
import Terminal from './components/Terminal';
import FileExplorer from './components/FileExplorer';
import ContextPanel from './components/ContextPanel';

// Define types for files
interface FileItem {
  name: string;
  type: 'directory' | 'file';
  path: string;
  extension?: string;
}

function App() {
  const [currentPath, setCurrentPath] = useState('/home/term-user');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [showContextPanel, setShowContextPanel] = useState(true);
  
  // Update file explorer when path changes
  useEffect(() => {
    // In a real app, we'd fetch files from the backend here
    fetchFiles(currentPath);
  }, [currentPath]);
  
  const fetchFiles = async (path: string) => {
    try {
      // This would be a real API call in the complete implementation
      const response = await fetch(`http://localhost:3001/api/files?path=${path}`);
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleCommand = (command: string) => {
    setCommandHistory(prev => [...prev, command]);
    
    // Handle cd command specifically to update file explorer
    if (command.startsWith('cd ')) {
      const newPath = command.substring(3).trim();
      // In real app, we'd validate this path server-side
      setCurrentPath(newPath);
    }
  };

  const handleFileClick = (path: string, type: string) => {
    if (type === 'directory') {
      setCurrentPath(path);
    }
    // Handle file clicks (cat, view, etc.) in the complete implementation
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      {/* File Explorer */}
      <div className="w-1/4 border-r border-gray-700 overflow-auto">
        <FileExplorer 
          currentPath={currentPath}
          files={files}
          onFileClick={handleFileClick}
        />
      </div>
      
      {/* Terminal and Context Panel */}
      <div className="w-3/4 flex flex-col">
        {/* Terminal */}
        <div className="flex-grow">
          <Terminal 
            onCommand={handleCommand}
            currentPath={currentPath}
          />
        </div>
        
        {/* Contextual Information Panel (Optional) */}
        {showContextPanel && (
          <div className="h-1/4 border-t border-gray-700 p-2 overflow-auto">
            <ContextPanel 
              commandHistory={commandHistory}
              resourceUsage={{ cpu: '2%', memory: '128MB' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
