import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the Terminal component
jest.mock('./components/Terminal', () => {
  return {
    __esModule: true,
    default: ({ currentPath }: { currentPath: string, onCommand: (command: string) => void }) => (
      <div data-testid="mock-terminal" className="mock-terminal">
        Mock Terminal: {currentPath}
      </div>
    )
  };
});

test('renders the App with mocked terminal', () => {
  render(<App />);
  const mockTerminalElement = screen.getByTestId('mock-terminal');
  expect(mockTerminalElement).toBeInTheDocument();
});
