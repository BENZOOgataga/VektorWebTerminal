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
    <div className="p-2">
      <div className="mb-4 p-2 bg-gray-800 rounded">
        <h2 className="font-bold truncate">{currentPath}</h2>
      </div>
      
      <div className="space-y-1">
        {/* Parent directory option - only show if not at root */}
        {currentPath !== '/' && (
          <div 
            className="flex items-center p-2 hover:bg-gray-800 rounded cursor-pointer"
            onClick={navigateToParentDirectory}
          >
            <FaIcons.FaFolder className="text-yellow-400 mr-2" />
            <span>..</span>
          </div>
        )}
        
        {/* File list */}
        {files.map((file, index) => (
          <div 
            key={index}
            className="flex items-center p-2 hover:bg-gray-800 rounded cursor-pointer"
            onClick={() => onFileClick(file.path, file.type)}
          >
            <span className="mr-2">{getFileIcon(file)}</span>
            <span className="truncate">{file.name}</span>
          </div>
        ))}
        
        {/* Empty state */}
        {files.length === 0 && (
          <div className="text-gray-500 italic p-2">This directory is empty</div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;