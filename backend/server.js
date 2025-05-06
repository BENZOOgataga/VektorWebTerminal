const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Docker = require('dockerode');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure middleware
app.use(cors());
app.use(bodyParser.json());

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Docker client
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Store active containers
const sessions = new Map();

// WebSocket connection handler
wss.on('connection', async (ws) => {
  console.log('Client connected');
  let containerId;
  
  try {
    // Create a container for this session
    const container = await createContainer();
    containerId = container.id;
    sessions.set(ws, containerId);
    
    // Start the container
    await container.start();
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'output',
      data: 'Welcome to WebTerminal! Container started successfully.\n'
    }));
    
    // Handle messages from client
    ws.on('message', async (message) => {
      const parsedMsg = JSON.parse(message);
      
      if (parsedMsg.type === 'command') {
        const command = parsedMsg.data;
        
        // Check if command is allowed
        if (isCommandAllowed(command)) {
          try {
            const output = await executeCommand(containerId, command);
            ws.send(JSON.stringify({
              type: 'output',
              data: output
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              data: `Error executing command: ${error.message}`
            }));
          }
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            data: 'Command not allowed for security reasons.'
          }));
        }
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      cleanupContainer(containerId);
      sessions.delete(ws);
      console.log('Client disconnected');
    });
    
  } catch (error) {
    console.error('Error setting up session:', error);
    ws.send(JSON.stringify({
      type: 'error',
      data: 'Failed to start terminal session'
    }));
    ws.close();
  }
});

// Helper functions
async function createContainer() {
  return await docker.createContainer({
    Image: 'debian:latest',
    Cmd: ['/bin/bash'],
    Tty: true,
    OpenStdin: true,
    StdinOnce: false,
    WorkingDir: '/home/term-user',
    HostConfig: {
      NetworkMode: 'none',
      ReadonlyRootfs: true,
      Binds: [
        // You would set up appropriate volume bindings here
      ]
    }
  });
}

async function executeCommand(containerId, command) {
  // In a real implementation, you would execute this command
  // inside the Docker container and stream back the results
  
  // For now, just simulate some basic commands
  if (command === 'ls') {
    return 'file1.txt  file2.txt  directory1/  directory2/\n';
  } else if (command === 'pwd') {
    return '/home/term-user\n';
  } else {
    return `Simulated output for: ${command}\n`;
  }
}

function isCommandAllowed(command) {
  // Parse command (simple implementation)
  const cmd = command.split(' ')[0];
  
  // List of allowed commands
  const allowedCommands = [
    'ls', 'cd', 'cat', 'echo', 'pwd', 
    'head', 'tail', 'grep', 'tree', 'man'
  ];
  
  // List of forbidden commands
  const forbiddenCommands = [
    'rm', 'sudo', 'apt', 'apt-get', 'reboot',
    'shutdown', 'kill', 'chmod', 'chown'
  ];
  
  if (forbiddenCommands.includes(cmd)) {
    return false;
  }
  
  return allowedCommands.includes(cmd) || cmd.startsWith('./');
}

async function cleanupContainer(containerId) {
  try {
    const container = docker.getContainer(containerId);
    await container.stop();
    await container.remove();
    console.log(`Container ${containerId} removed`);
  } catch (error) {
    console.error(`Error cleaning up container ${containerId}:`, error);
  }
}

// API Routes
app.get('/api/files', async (req, res) => {
  const { path: dirPath = '/home/term-user' } = req.query;
  
  // In a real implementation, you would list files from the container
  // For now, just return mock data
  const mockFiles = [
    { name: 'file1.txt', type: 'file', path: `${dirPath}/file1.txt`, extension: 'txt' },
    { name: 'file2.txt', type: 'file', path: `${dirPath}/file2.txt`, extension: 'txt' },
    { name: 'directory1', type: 'directory', path: `${dirPath}/directory1` },
    { name: 'directory2', type: 'directory', path: `${dirPath}/directory2` }
  ];
  
  res.json(mockFiles);
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});