import React, { useEffect, useState } from 'react';
import './App.css';
import Terminal from './components/Terminal';
import FileExplorer from './components/FileExplorer';
import ContextPanel from './components/ContextPanel';
import LoadingOverlay from './components/LoadingOverlay';

// Define types for files
interface FileItem {
  name: string;
  type: 'directory' | 'file';
  path: string;
  extension?: string;
}

// Mock file system data - this would come from your backend in a real app
const mockFileSystem: Record<string, FileItem[]> = {
  '/': [
    { name: 'home', type: 'directory', path: '/home' },
    { name: 'etc', type: 'directory', path: '/etc' },
    { name: 'var', type: 'directory', path: '/var' },
  ],
  '/home': [
    { name: 'user', type: 'directory', path: '/home/user' },
  ],
  '/home/user': [
    { name: 'file1.txt', type: 'file', path: '/home/user/file1.txt', extension: 'txt' },
    { name: 'file2.txt', type: 'file', path: '/home/user/file2.txt', extension: 'txt' },
    { name: 'projects', type: 'directory', path: '/home/user/projects' },
    { name: 'documents', type: 'directory', path: '/home/user/documents' },
  ],
  '/home/user/projects': [
    { name: 'demo', type: 'directory', path: '/home/user/projects/demo' },
  ],
  '/home/user/projects/demo': [
    { name: 'script.js', type: 'file', path: '/home/user/projects/demo/script.js', extension: 'js' },
    { name: 'index.html', type: 'file', path: '/home/user/projects/demo/index.html', extension: 'html' },
  ],
  '/home/user/documents': [
    { name: 'notes.txt', type: 'file', path: '/home/user/documents/notes.txt', extension: 'txt' },
    { name: 'image.png', type: 'file', path: '/home/user/documents/image.png', extension: 'png' },
  ],
};

function App() {
  const [currentPath, setCurrentPath] = useState('/home/user');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [showContextPanel, setShowContextPanel] = useState(true);
  // Add loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Update file explorer when path changes
  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);
  
  // Add a loading effect with an adequate duration
  useEffect(() => {
    // Use a longer loading time to ensure terminal initialization completes
    const minLoadingTime = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // 2.5 seconds minimum loading time
    
    // Listen for terminal-ready event
    const handleTerminalReady = () => {
      // Add a small delay to ensure loading animation completes gracefully
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    };
    
    window.addEventListener('terminal-ready', handleTerminalReady);
    
    return () => {
      clearTimeout(minLoadingTime);
      window.removeEventListener('terminal-ready', handleTerminalReady);
    };
  }, []);
  
  const fetchFiles = async (path: string) => {
    try {
      // In a real app, this would be an API call to your backend
      // For now, we'll use our mock file system
      const normalizedPath = normalizePath(path);
      const filesInPath = mockFileSystem[normalizedPath] || [];
      setFiles(filesInPath);
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]); // Empty array on error
    }
  };

  // Normalize paths to handle ../ and ensure they're valid
  const normalizePath = (path: string): string => {
    // Split path into segments
    const segments = path.split('/').filter(Boolean);
    const resultSegments: string[] = [];
    
    // Process each segment
    for (const segment of segments) {
      if (segment === '..') {
        // Go up one level
        resultSegments.pop();
      } else if (segment !== '.') {
        // Add segment to path (skip '.' which means current directory)
        resultSegments.push(segment);
      }
    }
    
    // Construct normalized path
    return '/' + resultSegments.join('/');
  };

  const handleCommand = (command: string) => {
    setCommandHistory(prev => [...prev, command]);
    
    // Handle cd command specifically to update file explorer
    if (command.startsWith('cd ')) {
      const target = command.substring(3).trim();
      let newPath;
      
      // Handle absolute paths
      if (target.startsWith('/')) {
        newPath = target;
      } 
      // Handle relative paths
      else {
        // Ensure current path ends with / for proper joining
        const base = currentPath.endsWith('/') ? currentPath : `${currentPath}/`;
        newPath = base + target;
      }
      
      // Normalize the path to handle ../, etc.
      const normalizedPath = normalizePath(newPath);
      
      // Only update if the path exists in our mock file system
      if (normalizedPath === '/' || mockFileSystem[normalizedPath]) {
        setCurrentPath(normalizedPath);
      }
    }
  };

  const handleFileClick = (path: string, type: string) => {
    if (type === 'directory') {
      // Normalize the path to handle ../
      const normalizedPath = normalizePath(path);
      setCurrentPath(normalizedPath);
    } else {
      // For files, you might want to simulate a cat command or show a preview
      // For now, just add it to command history as if user typed "cat filename"
      const filename = path.split('/').pop() || '';
      setCommandHistory(prev => [...prev, `cat ${filename}`]);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />
      
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
    </>
  );
}

export default App;
