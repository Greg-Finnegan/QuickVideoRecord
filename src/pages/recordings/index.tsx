import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Recordings from './Recordings';
import Settings from '../settings/Settings';
import { themeManager } from '../../utils/themeManager';

console.log('Recordings index.tsx loading...');

// Initialize theme manager
themeManager.initialize();

const container = document.getElementById('root');
console.log('Container element:', container);

if (container) {
  console.log('Creating React root for Recordings...');
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Recordings />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </HashRouter>
    </React.StrictMode>
  );
  console.log('Recordings React root rendered');
} else {
  console.error('Root container not found!');
}
