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
  const [terminalReady, setTerminalReady] = useState(false);

  // Initialize terminal only after component is fully mounted
  useEffect(() => {
    // Make sure DOM is fully rendered before attempting terminal initialization
    const initTimeout = setTimeout(() => {
      initTerminal();
    }, 500); // Give the DOM time to render completely

    return () => {
      clearTimeout(initTimeout);
      cleanupTerminal();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update when currentPath changes
  useEffect(() => {
    if (term.current && terminalReady) {
      // Handle path changes if needed
    }
  }, [currentPath, terminalReady]);

  // Separate function to initialize the terminal
  const initTerminal = () => {
    // Clean up existing terminal if it exists
    cleanupTerminal();

    // Wait for the DOM element to be available
    if (!terminalRef.current) return;

    try {
      // Create new terminal instance
      const newTerm = new XTerm({
        cursorBlink: true,
        theme: {
          background: '#1E1E1E',
          foreground: '#F8F8F8',
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        cols: 80,
        rows: 24,
        convertEol: true,
        disableStdin: false,
      });

      // Store in ref
      term.current = newTerm;

      // Create and load fit addon
      const newFitAddon = new FitAddon();
      newTerm.loadAddon(newFitAddon);
      fitAddon.current = newFitAddon;

      // Open terminal in container - this is where the error can occur
      newTerm.open(terminalRef.current);

      // Setup resize handler
      const handleResize = () => {
        if (fitAddon.current) {
          try {
            fitAddon.current.fit();
          } catch (e) {
            console.error('Terminal resize error:', e);
          }
        }
      };
      
      window.addEventListener('resize', handleResize);

      // Additional delay to make sure dimensions are properly set
      setTimeout(() => {
        try {
          // Try to fit terminal
          if (fitAddon.current) {
            fitAddon.current.fit();
          }

          // Show welcome message
          newTerm.writeln('Welcome to Vektor!');
          newTerm.writeln('Type "help" for a list of available commands.');
          newTerm.writeln('');

          // Show initial prompt
          writePrompt(newTerm, currentPath);

          // Set up input handling
          setupKeyboardHandling(newTerm);
          
          // Mark terminal as ready
          setTerminalReady(true);
          
          // Dispatch a custom event to signal terminal is ready
          window.dispatchEvent(new CustomEvent('terminal-ready'));
        } catch (err) {
          console.error('Terminal initialization error:', err);
        }
      }, 200);
    } catch (err) {
      console.error('Terminal creation error:', err);
    }
  };

  // Clean up terminal
  const cleanupTerminal = () => {
    if (term.current) {
      try {
        term.current.dispose();
      } catch (e) {
        console.error('Error disposing terminal:', e);
      }
      term.current = null;
    }
    fitAddon.current = null;
  };

  // Rest of your terminal component code remains the same
  const setupKeyboardHandling = (terminal: XTerm) => {
    // Your existing setupKeyboardHandling code
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

  // Your existing writePrompt, getFileContents, etc. functions remain the same
  const writePrompt = (terminal: XTerm, path: string) => {
    terminal.write(`\r\n\x1b[1;32muser@vektor\x1b[0m:\x1b[1;34m${path}\x1b[0m$ `);
  };

  const getFileContents = (filePath: string): string | null => {
    const mockFileContents: Record<string, string> = {
      '/home/user/file1.txt': 'Hello World!',
      '/home/user/file2.txt': 'Sample Content',
      '/home/user/projects/demo/script.js': 'console.log(\'Hello World\');',
      '/home/user/projects/demo/index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>Demo</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>',
      '/home/user/documents/notes.txt': 'Important notes:\n- Remember to update the documentation\n- Fix the bug in the navigation\n- Add unit tests',
    };

    return mockFileContents[filePath] || null;
  };

  // Get mock files for a path
  const getMockFilesForPath = (path: string) => {
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

    return mockFileSystem[path] || [];
  };

  // Show file listing for a specific path
  const showListingForPath = (terminal: XTerm, path: string) => {
    const files = getMockFilesForPath(path);
    
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

  // Show man page for a command
  const showManPage = (terminal: XTerm, command: string) => {
    const manPages: Record<string, string> = {
      ls: 'NAME\n    ls - list directory contents\n\nSYNOPSIS\n    ls [DIRECTORY]\n\nDESCRIPTION\n    List information about the DIRECTORY (current directory by default).',
      
      cd: 'NAME\n    cd - change the working directory\n\nSYNOPSIS\n    cd [DIRECTORY]\n\nDESCRIPTION\n    Change the current working directory to DIRECTORY.',
      
      pwd: 'NAME\n    pwd - print name of current/working directory\n\nSYNOPSIS\n    pwd\n\nDESCRIPTION\n    Print the full filename of the current working directory.',
      
      cat: 'NAME\n    cat - concatenate files and print on the standard output\n\nSYNOPSIS\n    cat [FILE]\n\nDESCRIPTION\n    Concatenate FILE to standard output.',
      
      echo: 'NAME\n    echo - display a line of text\n\nSYNOPSIS\n    echo [STRING]\n\nDESCRIPTION\n    Echo the STRING(s) to standard output.',
      
      head: 'NAME\n    head - output the first part of files\n\nSYNOPSIS\n    head [FILE]\n\nDESCRIPTION\n    Print the first 10 lines of FILE to standard output.',
      
      tail: 'NAME\n    tail - output the last part of files\n\nSYNOPSIS\n    tail [FILE]\n\nDESCRIPTION\n    Print the last 10 lines of FILE to standard output.',
      
      grep: 'NAME\n    grep - print lines matching a pattern\n\nSYNOPSIS\n    grep PATTERN [FILE]\n\nDESCRIPTION\n    Search for PATTERN in FILE and print matching lines.',
      
      tree: 'NAME\n    tree - list contents of directories in a tree-like format\n\nSYNOPSIS\n    tree [DIRECTORY]\n\nDESCRIPTION\n    List contents of DIRECTORY (current directory by default) in a tree-like format.',
      
      clear: 'NAME\n    clear - clear the terminal screen\n\nSYNOPSIS\n    clear\n\nDESCRIPTION\n    Clear the terminal screen.'
    };
    
    if (command in manPages) {
      terminal.writeln(manPages[command]);
    } else {
      terminal.writeln(`No manual entry for ${command}`);
    }
  };

  // Process commands locally for immediate feedback
  const processCommand = (terminal: XTerm, cmd: string) => {
    const command = cmd.trim();
    const args = command.split(' ');
    const mainCommand = args[0].toLowerCase();

    switch (mainCommand) {
      case 'clear':
        terminal.clear();
        break;

      case 'ls':
        // Show mock directory listing based on current path
        showListingForPath(terminal, currentPath);
        break;

      case 'cd':
        // cd is handled by the parent component through onCommand
        // We don't need to do anything here as the parent will update currentPath
        if (args.length < 2) {
          terminal.writeln('cd: missing operand');
        }
        break;

      case 'pwd':
        terminal.writeln(currentPath);
        break;

      case 'echo':
        terminal.writeln(command.substring(5));
        break;

      case 'cat':
        if (args.length < 2) {
          terminal.writeln('cat: missing file operand');
        } else {
          const fileName = args[1];
          let filePath = fileName;
          
          // Handle relative paths
          if (!fileName.startsWith('/')) {
            filePath = `${currentPath}/${fileName}`;
          }
          
          const content = getFileContents(filePath);
          if (content) {
            terminal.writeln(content);
          } else {
            terminal.writeln(`cat: ${fileName}: No such file or directory`);
          }
        }
        break;
        
      case 'head':
        if (args.length < 2) {
          terminal.writeln('head: missing file operand');
        } else {
          const fileName = args[1];
          let filePath = fileName;
          
          // Handle relative paths
          if (!fileName.startsWith('/')) {
            filePath = `${currentPath}/${fileName}`;
          }
          
          const content = getFileContents(filePath);
          if (content) {
            // Show first 10 lines or less
            const lines = content.split('\n').slice(0, 10);
            terminal.writeln(lines.join('\n'));
          } else {
            terminal.writeln(`head: ${fileName}: No such file or directory`);
          }
        }
        break;
        
      case 'tail':
        if (args.length < 2) {
          terminal.writeln('tail: missing file operand');
        } else {
          const fileName = args[1];
          let filePath = fileName;
          
          // Handle relative paths
          if (!fileName.startsWith('/')) {
            filePath = `${currentPath}/${fileName}`;
          }
          
          const content = getFileContents(filePath);
          if (content) {
            // Show last 10 lines or less
            const lines = content.split('\n');
            const startLine = Math.max(0, lines.length - 10);
            terminal.writeln(lines.slice(startLine).join('\n'));
          } else {
            terminal.writeln(`tail: ${fileName}: No such file or directory`);
          }
        }
        break;
        
      case 'grep':
        if (args.length < 3) {
          terminal.writeln('grep: missing arguments');
          terminal.writeln('Usage: grep PATTERN FILE');
        } else {
          const pattern = args[1];
          const fileName = args[2];
          let filePath = fileName;
          
          // Handle relative paths
          if (!fileName.startsWith('/')) {
            filePath = `${currentPath}/${fileName}`;
          }
          
          const content = getFileContents(filePath);
          if (content) {
            // Find lines matching pattern
            const lines = content.split('\n');
            const matchingLines = lines.filter(line => 
              line.includes(pattern)
            );
            
            if (matchingLines.length > 0) {
              terminal.writeln(matchingLines.join('\n'));
            }
          } else {
            terminal.writeln(`grep: ${fileName}: No such file or directory`);
          }
        }
        break;
        
      case 'tree':
        // Simple tree implementation for the current directory
        terminal.writeln(`\x1b[1;34m${currentPath}\x1b[0m`);
        const files = getMockFilesForPath(currentPath);
        files.forEach(file => {
          if (file.type === 'directory') {
            terminal.writeln(`├── \x1b[1;34m${file.name}/\x1b[0m`);
          } else {
            terminal.writeln(`├── ${file.name}`);
          }
        });
        break;

      case 'man':
        if (args.length < 2) {
          terminal.writeln('What manual page do you want?');
        } else {
          const commandName = args[1];
          showManPage(terminal, commandName);
        }
        break;

      case 'help':
        terminal.writeln('Available commands:');
        terminal.writeln('  ls           - List files and directories');
        terminal.writeln('  cd [dir]     - Change directory');
        terminal.writeln('  pwd          - Print current directory');
        terminal.writeln('  cat [file]   - Display file contents');
        terminal.writeln('  head [file]  - Display first lines of a file');
        terminal.writeln('  tail [file]  - Display last lines of a file');
        terminal.writeln('  grep [pattern] [file] - Search for pattern in file');
        terminal.writeln('  tree         - Display directory structure as a tree');
        terminal.writeln('  echo [text]  - Display text');
        terminal.writeln('  man [command] - Display manual for command');
        terminal.writeln('  clear        - Clear the terminal');
        terminal.writeln('  help         - Display this help message');
        break;

      default:
        terminal.writeln(`Command not found: ${command}`);
    }
  };

  return (
    <div 
      ref={terminalRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        backgroundColor: '#1E1E1E',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
};

export default Terminal;
