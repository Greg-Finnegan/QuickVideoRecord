import React from 'react';
import { createRoot } from 'react-dom/client';
import Recordings from './Recordings';

console.log('Recordings index.tsx loading...');

const container = document.getElementById('root');
console.log('Container element:', container);

if (container) {
  console.log('Creating React root for Recordings...');
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Recordings />
    </React.StrictMode>
  );
  console.log('Recordings React root rendered');
} else {
  console.error('Root container not found!');
}
