import React from 'react';
import { createRoot } from 'react-dom/client';
import Recorder from './Recorder';
import { themeManager } from '../../utils/themeManager';

console.log('Recorder index.tsx loading...');

// Initialize theme manager
themeManager.initialize();

const container = document.getElementById('root');
console.log('Container element:', container);

if (container) {
  console.log('Creating React root...');
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Recorder />
    </React.StrictMode>
  );
  console.log('React root rendered');
} else {
  console.error('Root container not found!');
}
