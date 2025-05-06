import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalProps {
  onCommand: (command: string) => void;
  currentPath: string;
}

const Terminal: React.FC<TerminalProps> = ({ onCommand, currentPath }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const term = useRef<XTerm | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const commandBuffer = useRef<string>('');

  // Initialize terminal on first render
  useEffect(() => {
    // Clean up previous terminal if it exists
    if (term.current) {
      term.current.dispose();
      term.current = null;
      fitAddon.current = null;
    }

    // Wait for the DOM element to be available
    if (!terminalRef.current) return;

    // Create new terminal instance with fixed dimensions
    const newTerm = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#1E1E1E',
        foreground: '#F8F8F8',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      cols: 80, // Set fixed dimensions
      rows: 24,
      convertEol: true,
      disableStdin: false,
    });

    // Store the terminal in ref
    term.current = newTerm;

    // Create and load fit addon
    const newFitAddon = new FitAddon();
    newTerm.loadAddon(newFitAddon);
    fitAddon.current = newFitAddon;

    // Open terminal in the container
    newTerm.open(terminalRef.current);

    // Add a delay before trying to fit
    setTimeout(() => {
      try {
        // Try to fit terminal to container
        if (fitAddon.current) {
          fitAddon.current.fit();
        }

        // Show welcome message
        newTerm.writeln('Welcome to WebTerminal!');
        newTerm.writeln('Type "help" for a list of available commands.');
        newTerm.writeln('');

        // Show initial prompt
        writePrompt(newTerm, currentPath);

        // Set up input handling
        setupKeyboardHandling(newTerm);
      } catch (err) {
        console.error('Terminal initialization error:', err);
      }
    }, 100);

    // Handle window resize events
    const handleResize = () => {
      if (fitAddon.current) {
        try {
          fitAddon.current.fit();
        } catch (e) {
          // Ignore errors during resize
        }
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (term.current) {
        try {
          term.current.dispose();
        } catch (e) {
          console.error('Error disposing terminal:', e);
        }
        term.current = null;
      }
    };
  }, []); // Only run once on initial render

  // Update prompt when currentPath changes
  useEffect(() => {
    if (term.current) {
      // Just store the updated path, don't recreate the terminal
    }
  }, [currentPath]);

  // Set up keyboard handling
  const setupKeyboardHandling = (terminal: XTerm) => {
    commandBuffer.current = '';

    terminal.onKey(({ key, domEvent }: { key: string; domEvent: KeyboardEvent }) => {
      const ev = domEvent;
      const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;
      
      if (ev.keyCode === 13) { // Enter key
        // Process the command
        terminal.writeln('');
        if (commandBuffer.current.trim()) {
          const command = commandBuffer.current;
          commandBuffer.current = '';
          
          // Send command to parent
          onCommand(command);
          
          // Process command locally
          processCommand(terminal, command);
        }
        
        // Show new prompt
        writePrompt(terminal, currentPath);
      } else if (ev.keyCode === 8) { // Backspace
        // Only delete if there's text in the buffer
        if (commandBuffer.current.length > 0) {
          commandBuffer.current = commandBuffer.current.substring(0, commandBuffer.current.length - 1);
          terminal.write('\b \b'); // Erase the character
        }
      } else if (printable) {
        // For normal printable characters
        commandBuffer.current += key;
        terminal.write(key);
      }
    });
  };

  // Write the prompt with username, hostname and path
  const writePrompt = (terminal: XTerm, path: string) => {
    terminal.write(`\r\n\x1b[1;32muser@webterminal\x1b[0m:\x1b[1;34m${path}\x1b[0m$ `);
  };

  // Process commands locally for immediate feedback
  const processCommand = (terminal: XTerm, cmd: string) => {
    const command = cmd.trim();

    if (command === 'clear') {
      terminal.clear();
    } else if (command === 'ls') {
      // Show mock directory listing based on current path
      showListingForPath(terminal, currentPath);
    } else if (command === 'pwd') {
      terminal.writeln(currentPath);
    } else if (command === 'help') {
      terminal.writeln('Available commands:');
      terminal.writeln('  ls           - List files and directories');
      terminal.writeln('  cd [dir]     - Change directory');
      terminal.writeln('  pwd          - Print current directory');
      terminal.writeln('  cat [file]   - Display file contents');
      terminal.writeln('  echo [text]  - Display text');
      terminal.writeln('  clear        - Clear the terminal');
      terminal.writeln('  help         - Display this help message');
    } else if (command.startsWith('echo ')) {
      terminal.writeln(command.substring(5));
    } else {
      terminal.writeln(`Command not found: ${command}`);
    }
  };

  // Show file listing for a specific path
  const showListingForPath = (terminal: XTerm, path: string) => {
    // Mock file system data
    const mockFileSystem: Record<string, Array<{name: string, type: string}>> = {
      '/': [
        { name: 'home', type: 'directory' },
        { name: 'etc', type: 'directory' },
        { name: 'var', type: 'directory' },
      ],
      '/home': [
        { name: 'user', type: 'directory' },
      ],
      '/home/user': [
        { name: 'file1.txt', type: 'file' },
        { name: 'file2.txt', type: 'file' },
        { name: 'projects', type: 'directory' },
        { name: 'documents', type: 'directory' },
      ],
      '/home/user/projects': [
        { name: 'demo', type: 'directory' },
      ],
      '/home/user/projects/demo': [
        { name: 'script.js', type: 'file' },
        { name: 'index.html', type: 'file' },
      ],
      '/home/user/documents': [
        { name: 'notes.txt', type: 'file' },
        { name: 'image.png', type: 'file' },
      ]
    };

    // Get files for the current path
    const files = mockFileSystem[path] || [];
    
    if (files.length === 0) {
      terminal.writeln('');
      return;
    }
    
    // Format output with colors
    let output = '';
    files.forEach(file => {
      if (file.type === 'directory') {
        // Blue for directories
        output += `\x1b[1;34m${file.name}/\x1b[0m  `;
      } else {
        // Normal text for files
        output += `${file.name}  `;
      }
    });
    
    terminal.writeln(output);
  };

  return (
    <div 
      ref={terminalRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        backgroundColor: '#1E1E1E' 
      }}
    />
  );
};

export default Terminal;