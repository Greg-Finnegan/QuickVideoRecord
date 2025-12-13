import React from 'react';
import { createRoot } from 'react-dom/client';
import SidePanel from './SidePanel';
import { themeManager } from '../../utils/themeManager';

console.log('SidePanel index.tsx loading...');

// Initialize theme manager
themeManager.initialize();

const container = document.getElementById('root');
console.log('Container element:', container);

if (container) {
  console.log('Creating React root for SidePanel...');
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <SidePanel />
    </React.StrictMode>
  );
  console.log('SidePanel React root rendered');
} else {
  console.error('Root container not found!');
}
