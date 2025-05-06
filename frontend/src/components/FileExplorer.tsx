import React from 'react';
import * as FaIcons from 'react-icons/fa';

interface FileItem {
  name: string;
  type: 'directory' | 'file';
  path: string;
  extension?: string;
}

interface FileExplorerProps {
  currentPath: string;
  files: FileItem[];
  onFileClick: (path: string, type: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ currentPath, files, onFileClick }) => {
  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') {
      return <FaIcons.FaFolder className="text-yellow-400" />;
    }
    
    // Determine file icon based on extension
    const extension = file.extension?.toLowerCase();
    switch(extension) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'html':
      case 'css':
      case 'py':
        return <FaIcons.FaFileCode className="text-blue-400" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <FaIcons.FaFileImage className="text-green-400" />;
      case 'md':
      case 'txt':
      case 'log':
        return <FaIcons.FaFileAlt className="text-gray-400" />;
      default:
        return <FaIcons.FaFile className="text-gray-400" />;
    }
  };

  // Function to handle parent directory navigation
  const navigateToParentDirectory = () => {
    // Split the path and remove the last part
    const pathParts = currentPath.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      // We're already at root, don't go up further
      return;
    }
    
    // Remove the last directory from the path
    pathParts.pop();
    
    // Construct new path
    const newPath = pathParts.length === 0 ? '/' : '/' + pathParts.join('/');
    
    // Navigate to parent directory
    onFileClick(newPath, 'directory');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 p-3 bg-glass backdrop-blur-sm border-b border-glass shadow-glass-inner">
        <h2 className="font-bold truncate text-white">
          <span className="opacity-60 mr-1">~/</span>{currentPath}
        </h2>
      </div>
      
      <div className="flex-1 overflow-auto px-2 pb-2">
        <div className="space-y-1 rounded-lg bg-glass backdrop-blur-xs p-2 shadow-glass-inner">
          {/* Parent directory option - only show if not at root */}
          {currentPath !== '/' && (
            <div 
              className="flex items-center p-2.5 hover:bg-white/10 rounded-md cursor-pointer transition-colors duration-150"
              onClick={navigateToParentDirectory}
            >
              <FaIcons.FaFolder className="text-yellow-400 mr-2.5" />
              <span className="text-gray-300 font-medium">..</span>
            </div>
          )}
          
          {/* File list */}
          {files.map((file, index) => (
            <div 
              key={index}
              className="flex items-center p-2.5 hover:bg-white/10 rounded-md cursor-pointer transition-colors duration-150"
              onClick={() => onFileClick(file.path, file.type)}
            >
              <span className="mr-2.5">{getFileIcon(file)}</span>
              <span className="truncate text-gray-300 font-medium">{file.name}</span>
            </div>
          ))}
          
          {/* Empty state */}
          {files.length === 0 && (
            <div className="text-gray-500 italic p-4 text-center">This directory is empty</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;