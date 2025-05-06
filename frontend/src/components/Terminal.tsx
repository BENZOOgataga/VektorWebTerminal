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
          newTerm.writeln("\x1b[38;2;147;114;229m║\x1b[0m   \x1b[1;38;2;142;209;252mWelcome to Vektor Terminal\x1b[0m                                  \x1b[38;2;147;114;229m    ║\x1b[0m");
          newTerm.writeln("\x1b[38;2;147;114;229m║\x1b[0m   \x1b[3;38;2;189;189;189mA modern cloud-based terminal experience\x1b[0m                    \x1b[38;2;147;114;229m    ║\x1b[0m");
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

  // Stylized prompt that fits the glassmorphic theme
  const writePrompt = (terminal: XTerm, path: string) => {
    terminal.write(`\r\n\x1b[1;38;2;111;194;255muser\x1b[0;38;2;170;170;170m@\x1b[1;38;2;170;111;255mvektor\x1b[0;38;2;170;170;170m:\x1b[1;38;2;111;148;255m${path}\x1b[0;38;2;170;170;170m$ \x1b[0m`);
  };

  // Your existing functions remain the same
  const getFileContents = (filePath: string): string | null => {
    // Existing code...
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
    // Existing code...
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
    // Existing code with enhanced styling...
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
        output += `\x1b[1;38;2;111;148;255m${file.name}/\x1b[0m  `;
      } else {
        // Normal text for files
        output += `\x1b[38;2;220;220;220m${file.name}\x1b[0m  `;
      }
    });
    
    terminal.writeln(output);
  };

  // Show man page for a command
  const showManPage = (terminal: XTerm, command: string) => {
    // Existing code...
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
    // Existing code...
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
        terminal.writeln(`\x1b[1;38;2;111;148;255m${currentPath}\x1b[0m`);
        const files = getMockFilesForPath(currentPath);
        files.forEach(file => {
          if (file.type === 'directory') {
            terminal.writeln(`├── \x1b[1;38;2;111;148;255m${file.name}/\x1b[0m`);
          } else {
            terminal.writeln(`├── \x1b[38;2;220;220;220m${file.name}\x1b[0m`);
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
        terminal.writeln("\x1b[1;38;2;142;209;252mAvailable commands:\x1b[0m");
        terminal.writeln("  \x1b[1;38;2;255;189;89mls\x1b[0m           - List files and directories");
        terminal.writeln("  \x1b[1;38;2;255;189;89mcd [dir]\x1b[0m     - Change directory");
        terminal.writeln("  \x1b[1;38;2;255;189;89mpwd\x1b[0m          - Print current directory");
        terminal.writeln("  \x1b[1;38;2;255;189;89mcat [file]\x1b[0m   - Display file contents");
        terminal.writeln("  \x1b[1;38;2;255;189;89mhead [file]\x1b[0m  - Display first lines of a file");
        terminal.writeln("  \x1b[1;38;2;255;189;89mtail [file]\x1b[0m  - Display last lines of a file");
        terminal.writeln("  \x1b[1;38;2;255;189;89mgrep [pattern] [file]\x1b[0m - Search for pattern in file");
        terminal.writeln("  \x1b[1;38;2;255;189;89mtree\x1b[0m         - Display directory structure as a tree");
        terminal.writeln("  \x1b[1;38;2;255;189;89mecho [text]\x1b[0m  - Display text");
        terminal.writeln("  \x1b[1;38;2;255;189;89mman [command]\x1b[0m - Display manual for command");
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

      {/* Terminal toolbar (optional touch) */}
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
