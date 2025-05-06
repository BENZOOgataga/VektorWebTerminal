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
      // Create new terminal instance with glassmorphic styling
      const newTerm = new XTerm({
        cursorBlink: true,
        theme: {
          background: 'rgba(18, 18, 25, 0.4)', // Semi-transparent background
          foreground: '#F8F8F8',
          cursor: '#f0f0f0',
          cursorAccent: 'rgba(255, 255, 255, 0.3)',
          selectionBackground: 'rgba(255, 255, 255, 0.25)',
          black: '#121216',
          red: '#ff5b5b',
          green: '#57d9a2',
          yellow: '#f7c856',
          blue: '#7AA2F7',
          magenta: '#C678DD',
          cyan: '#70C0BA',
          white: '#DEDEDE',
          brightBlack: '#666666',
          brightRed: '#FF8080',
          brightGreen: '#9AEDCF',
          brightYellow: '#FBDB99',
          brightBlue: '#A9BCFF',
          brightMagenta: '#E2ADFF',
          brightCyan: '#A5E6E2',
          brightWhite: '#FFFFFF',
        },
        fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.3,
        letterSpacing: 0.5,
        fontWeight: '400',
        fontWeightBold: '700',
        cols: 80,
        rows: 24,
        convertEol: true,
        disableStdin: false,
        allowTransparency: true, // Enable transparency for glass effect
        drawBoldTextInBrightColors: true,
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

          // Show welcome message with styled header
          newTerm.writeln("");
          newTerm.writeln("\x1b[38;2;147;114;229m╔═══════════════════════════════════════════════════════════════════╗\x1b[0m");
          newTerm.writeln("\x1b[38;2;147;114;229m║                                                                   ║\x1b[0m");
          newTerm.writeln("\x1b[38;2;147;114;229m║\x1b[0m   \x1b[1;38;2;142;209;252mWelcome to Vektor Terminal\x1b[0m                                  \x1b[38;2;147;114;229m║\x1b[0m");
          newTerm.writeln("\x1b[38;2;147;114;229m║\x1b[0m   \x1b[3;38;2;189;189;189mA modern cloud-based terminal experience\x1b[0m                    \x1b[38;2;147;114;229m║\x1b[0m");
          newTerm.writeln("\x1b[38;2;147;114;229m║                                                                   ║\x1b[0m");
          newTerm.writeln("\x1b[38;2;147;114;229m╚═══════════════════════════════════════════════════════════════════╝\x1b[0m");
          newTerm.writeln("");
          newTerm.writeln("\x1b[38;2;170;170;170mType \x1b[1;38;2;87;199;255mhelp\x1b[0;38;2;170;170;170m for available commands\x1b[0m");
          newTerm.writeln("");

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
      }, 300);
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

  // Rest of your terminal component code
  const setupKeyboardHandling = (terminal: XTerm) => {
    commandBuffer.current = '';
    // Track cursor position within the command
    const cursorPosition = { current: 0 };
    // Command history management
    const commandHistory = useRef<string[]>([]);
    const historyIndex = useRef<number>(-1);
    
    terminal.onKey(({ key, domEvent }: { key: string; domEvent: KeyboardEvent }) => {
      const ev = domEvent;
      const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;
      
      // Handle special key presses
      if (ev.keyCode === 13) { // Enter key
        // Process the command
        terminal.writeln('');
        if (commandBuffer.current.trim()) {
          const command = commandBuffer.current;
          
          // Add to history only if it's not the same as the last command
          if (commandHistory.current.length === 0 || 
              commandHistory.current[commandHistory.current.length - 1] !== command) {
            commandHistory.current.push(command);
          }
          
          // Reset history navigation
          historyIndex.current = -1;
          commandBuffer.current = '';
          cursorPosition.current = 0;
          
          // Send command to parent
          onCommand(command);
          
          // Process command locally
          processCommand(terminal, command);
        }
        
        // Show new prompt
        writePrompt(terminal, currentPath);
      } 
      else if (ev.keyCode === 8) { // Backspace
        // Only delete if there's text in the buffer and cursor is not at start
        if (commandBuffer.current.length > 0 && cursorPosition.current > 0) {
          // Delete character at cursor position - 1
          const newBuffer = 
            commandBuffer.current.substring(0, cursorPosition.current - 1) + 
            commandBuffer.current.substring(cursorPosition.current);
          
          // Handle backspace by redrawing the line
          terminal.write('\r'); // Move to start of line
          terminal.write(`\x1b[1;38;2;111;194;255muser\x1b[0;38;2;170;170;170m@\x1b[1;38;2;170;111;255mvektor\x1b[0;38;2;170;170;170m:\x1b[1;38;2;111;148;255m${currentPath}\x1b[0;38;2;170;170;170m$ \x1b[0m`);
          terminal.write(newBuffer);
          
          // Clear rest of the line if the command got shorter
          if (newBuffer.length < commandBuffer.current.length) {
            terminal.write(' '); // Add space to cover the character being deleted
            terminal.write('\b'); // Move cursor back after the space
          }
          
          // Move cursor back to the right position
          if (cursorPosition.current < commandBuffer.current.length) {
            // If cursor was in the middle, move it back to the right position
            const moveBack = commandBuffer.current.length - cursorPosition.current;
            terminal.write('\b'.repeat(moveBack));
          }
          
          // Update command buffer and cursor position
          commandBuffer.current = newBuffer;
          cursorPosition.current--;
        }
      }
      else if (ev.keyCode === 38) { // Up arrow - previous command
        if (commandHistory.current.length > 0) {
          // Move up in history or stay at the first item
          if (historyIndex.current < commandHistory.current.length - 1) {
            historyIndex.current++;
          }
          
          // Get command from history
          const historyCommand = commandHistory.current[commandHistory.current.length - 1 - historyIndex.current];
          
          // Clear current line and replace with history command
          terminal.write('\r'); // Move to start of line
          terminal.write(`\x1b[1;38;2;111;194;255muser\x1b[0;38;2;170;170;170m@\x1b[1;38;2;170;111;255mvektor\x1b[0;38;2;170;170;170m:\x1b[1;38;2;111;148;255m${currentPath}\x1b[0;38;2;170;170;170m$ \x1b[0m`);
          terminal.write(historyCommand);
          
          // Clear the rest of the line if previous command was longer
          if (commandBuffer.current.length > historyCommand.length) {
            const extraChars = commandBuffer.current.length - historyCommand.length;
            terminal.write(' '.repeat(extraChars));
            terminal.write('\b'.repeat(extraChars));
          }
          
          // Update command buffer and cursor position
          commandBuffer.current = historyCommand;
          cursorPosition.current = historyCommand.length;
        }
      }
      else if (ev.keyCode === 40) { // Down arrow - next command
        // Move down in history or clear if at the end
        if (historyIndex.current > 0) {
          historyIndex.current--;
          
          // Get command from history
          const historyCommand = commandHistory.current[commandHistory.current.length - 1 - historyIndex.current];
          
          // Clear current line and replace with history command
          terminal.write('\r'); // Move to start of line
          terminal.write(`\x1b[1;38;2;111;194;255muser\x1b[0;38;2;170;170;170m@\x1b[1;38;2;170;111;255mvektor\x1b[0;38;2;170;170;170m:\x1b[1;38;2;111;148;255m${currentPath}\x1b[0;38;2;170;170;170m$ \x1b[0m`);
          terminal.write(historyCommand);
          
          // Clear the rest of the line if previous command was longer
          if (commandBuffer.current.length > historyCommand.length) {
            const extraChars = commandBuffer.current.length - historyCommand.length;
            terminal.write(' '.repeat(extraChars));
            terminal.write('\b'.repeat(extraChars));
          }
          
          // Update command buffer and cursor position
          commandBuffer.current = historyCommand;
          cursorPosition.current = historyCommand.length;
        }
        else if (historyIndex.current === 0) {
          // Clear the command when reaching the end of history
          historyIndex.current = -1;
          
          // Clear current line
          terminal.write('\r'); // Move to start of line
          terminal.write(`\x1b[1;38;2;111;194;255muser\x1b[0;38;2;170;170;170m@\x1b[1;38;2;170;111;255mvektor\x1b[0;38;2;170;170;170m:\x1b[1;38;2;111;148;255m${currentPath}\x1b[0;38;2;170;170;170m$ \x1b[0m`);
          
          // Clear the rest of the line if previous command was longer
          if (commandBuffer.current.length > 0) {
            terminal.write(' '.repeat(commandBuffer.current.length));
            terminal.write('\b'.repeat(commandBuffer.current.length));
          }
          
          // Clear command buffer and reset cursor
          commandBuffer.current = '';
          cursorPosition.current = 0;
        }
      }
      else if (ev.keyCode === 37) { // Left arrow - move cursor left
        if (cursorPosition.current > 0) {
          terminal.write('\b'); // Move cursor back
          cursorPosition.current--;
        }
      }
      else if (ev.keyCode === 39) { // Right arrow - move cursor right
        if (cursorPosition.current < commandBuffer.current.length) {
          // Move cursor forward by printing the character at the current position
          terminal.write(commandBuffer.current[cursorPosition.current]);
          cursorPosition.current++;
        }
      }
      else if (printable) {
        // For normal printable characters
        if (cursorPosition.current === commandBuffer.current.length) {
          // If cursor is at the end, simply append
          commandBuffer.current += key;
          terminal.write(key);
          cursorPosition.current++;
        } else {
          // If cursor is in the middle, insert character and redraw
          const newBuffer = 
            commandBuffer.current.substring(0, cursorPosition.current) + 
            key + 
            commandBuffer.current.substring(cursorPosition.current);
          
          // Redraw the line from cursor position to the end
          const restOfLine = commandBuffer.current.substring(cursorPosition.current);
          terminal.write(key + restOfLine);
          
          // Move cursor back to the right position (just after inserted char)
          terminal.write('\b'.repeat(restOfLine.length));
          
          // Update command buffer and cursor position
          commandBuffer.current = newBuffer;
          cursorPosition.current++;
        }
      }
    });
  };

  // Show prompt
  const writePrompt = (terminal: XTerm, path: string) => {
    terminal.write(`\x1b[1;38;2;111;194;255muser\x1b[0;38;2;170;170;170m@\x1b[1;38;2;170;111;255mvektor\x1b[0;38;2;170;170;170m:\x1b[1;38;2;111;148;255m${path}\x1b[0;38;2;170;170;170m$ \x1b[0m`);
  };

  // Mock function to get file contents
  const getFileContents = (filePath: string) => {
    // Mock file contents
    const files: Record<string, string> = {
      '/home/user/file1.txt': 'This is the content of file1.txt',
      '/home/user/file2.txt': 'This is the content of file2.txt',
    };
    return files[filePath] || null;
  };

  // Mock function to get files for a path
  const getMockFilesForPath = (path: string) => {
    // Mock file structure
    const fileStructure: Record<string, { name: string; type: 'file' | 'directory' }[]> = {
      '/home/user': [
        { name: 'file1.txt', type: 'file' },
        { name: 'file2.txt', type: 'file' },
        { name: 'documents', type: 'directory' },
      ],
      '/home/user/documents': [
        { name: 'doc1.txt', type: 'file' },
        { name: 'doc2.txt', type: 'file' },
      ],
    };
    return fileStructure[path] || [];
  };

  // Show directory listing for a path
  const showListingForPath = (terminal: XTerm, path: string) => {
    const files = getMockFilesForPath(path);
    let output = '';
    files.forEach(file => {
      if (file.type === 'directory') {
        output += `\x1b[1;38;2;111;148;255m${file.name}/\x1b[0m  `;
      } else {
        output += `\x1b[38;2;220;220;220m${file.name}\x1b[0m  `;
      }
    });
    
    terminal.writeln(output);
  };

  // Process commands locally for terminal feedback
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

      case 'help':
        terminal.writeln("\x1b[1;38;2;142;209;252mAvailable commands:\x1b[0m");
        terminal.writeln("  \x1b[1;38;2;255;189;89mls\x1b[0m           - List files and directories");
        terminal.writeln("  \x1b[1;38;2;255;189;89mcd [dir]\x1b[0m     - Change directory");
        terminal.writeln("  \x1b[1;38;2;255;189;89mpwd\x1b[0m          - Print current directory");
        terminal.writeln("  \x1b[1;38;2;255;189;89mcat [file]\x1b[0m   - Display file contents");
        terminal.writeln("  \x1b[1;38;2;255;189;89mecho [text]\x1b[0m  - Display text");
        terminal.writeln("  \x1b[1;38;2;255;189;89mclear\x1b[0m        - Clear the terminal");
        terminal.writeln("  \x1b[1;38;2;255;189;89mhelp\x1b[0m         - Display this help message");
        break;

      default:
        terminal.writeln(`\x1b[38;2;255;108;108mCommand not found:\x1b[0m ${command}`);
    }
  };

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden">
      {/* Frosted glass background effect */}
      <div 
        className="absolute inset-0 z-0"
        style={{ 
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(20, 21, 30, 0.5)',
          boxShadow: 'inset 0 0 4px rgba(255, 255, 255, 0.1), 0 4px 30px rgba(0, 0, 0, 0.2)',
          borderRadius: 'inherit',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      />
      
      {/* Terminal inner container */}
      <div 
        ref={terminalRef}
        className="absolute inset-1.5 z-10 rounded-lg overflow-hidden"
        style={{ 
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(16, 17, 25, 0.6)',
          boxShadow: 'inset 0 0 2px rgba(255, 255, 255, 0.05)',
        }}
      />

      {/* Terminal toolbar */}
      <div 
        className="absolute top-0 left-0 right-0 h-8 z-20 px-4 flex items-center"
        style={{
          backgroundColor: 'rgba(24, 25, 36, 0.6)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex space-x-1.5">
          <div className="w-3 h-3 bg-red-500 rounded-full opacity-70" />
          <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-70" />
          <div className="w-3 h-3 bg-green-500 rounded-full opacity-70" />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 text-xs font-mono text-white/40">
          vektor terminal
        </div>
      </div>
      
      {/* Add some decorative elements */}
      <div className="absolute bottom-3 right-3 text-xs font-mono z-20 opacity-30 select-none">
        vektor@{new Date().getFullYear()}
      </div>
    </div>
  );
};

export default Terminal;
