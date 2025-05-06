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
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  // Initialize terminal
  useEffect(() => {
    // Only initialize if the ref is available
    if (!terminalRef.current) return;

    try {
      // Create terminal instance
      const term = new XTerm({
        cursorBlink: true,
        theme: {
          background: '#1E1E1E',
          foreground: '#F8F8F8',
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        cols: 80,
        rows: 24,
        convertEol: true,
      });

      // Store in ref
      xtermRef.current = term;

      // Open terminal in container
      term.open(terminalRef.current);

      // Create fit addon
      const fitAddon = new FitAddon();
      fitAddonRef.current = fitAddon;
      term.loadAddon(fitAddon);

      // Try to fit the terminal
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (e) {
          console.error('Error fitting terminal:', e);
        }

        // Display welcome message
        term.writeln('Welcome to WebTerminal!');
        term.writeln('Type "help" for a list of available commands.');
        term.writeln('');
        
        // Show initial prompt
        displayPrompt(term, currentPath);
        
        // Setup input handling
        setupTerminalInput(term);
      }, 100);

      // Handle resize
      const handleResize = () => {
        try {
          if (fitAddonRef.current) {
            fitAddonRef.current.fit();
          }
        } catch (e) {
          console.error('Error resizing terminal:', e);
        }
      };
      
      window.addEventListener('resize', handleResize);

      // Clean up function
      return () => {
        window.removeEventListener('resize', handleResize);
        if (xtermRef.current) {
          xtermRef.current.dispose();
          xtermRef.current = null;
        }
      };
    } catch (e) {
      console.error('Error initializing terminal:', e);
    }
  }, [currentPath]); // Include currentPath to update prompt when it changes

  // Setup terminal input handling
  const setupTerminalInput = (term: XTerm) => {
    let currentCommand = '';
    
    term.onKey(({ key, domEvent }: { key: string; domEvent: KeyboardEvent }) => {
      const charCode = key.charCodeAt(0);
      
      // Handle Enter key
      if (domEvent.key === 'Enter') {
        term.writeln('');
        if (currentCommand.trim()) {
          // Pass command to parent
          onCommand(currentCommand);
          
          // Handle command locally
          handleCommand(term, currentCommand);
        }
        
        // Reset command buffer and show new prompt
        currentCommand = '';
        displayPrompt(term, currentPath);
      }
      // Handle Backspace
      else if (domEvent.key === 'Backspace') {
        if (currentCommand.length > 0) {
          currentCommand = currentCommand.slice(0, -1);
          term.write('\b \b');
        }
      }
      // Handle printable characters
      else if (charCode >= 32 && charCode <= 126) {
        currentCommand += key;
        term.write(key);
      }
    });
  };
  
  const displayPrompt = (term: XTerm, path: string) => {
    const username = 'term-user';
    const hostname = 'webterminal';
    const prompt = `\r\n\x1b[1;32m${username}@${hostname}\x1b[0m:\x1b[1;34m${path}\x1b[0m$ `;
    term.write(prompt);
  };
  
  const handleCommand = (term: XTerm, command: string) => {
    const cmd = command.trim();
    
    if (cmd === 'clear') {
      term.clear();
      return;
    }
    
    if (cmd === 'ls') {
      term.writeln('file1.txt  file2.txt  directory1/  directory2/');
      return;
    }
    
    if (cmd === 'pwd') {
      term.writeln(currentPath);
      return;
    }
    
    if (cmd === 'help') {
      term.writeln('Available commands:');
      term.writeln('  ls           - List files and directories');
      term.writeln('  cd [dir]     - Change directory');
      term.writeln('  pwd          - Print current directory');
      term.writeln('  cat [file]   - Display file contents');
      term.writeln('  echo [text]  - Display text');
      term.writeln('  clear        - Clear the terminal');
      term.writeln('  help         - Display this help message');
      return;
    }
    
    if (cmd.startsWith('echo ')) {
      const text = cmd.substring(5);
      term.writeln(text);
      return;
    }
    
    term.writeln(`Command not found: ${cmd}`);
  };

  return (
    <div 
      ref={terminalRef} 
      className="h-full" 
      style={{
        backgroundColor: '#1E1E1E',
        padding: '8px',
        position: 'relative',
        minHeight: '200px'
      }}
    />
  );
};

export default Terminal;