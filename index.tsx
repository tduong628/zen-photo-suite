
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Inject API key for the @google/genai SDK (reads process.env.API_KEY).
// The actual key lives in .env.local (gitignored) and is baked in at build time.
(window as any).process = {
  env: {
    API_KEY: import.meta.env.VITE_GEMINI_API_KEY
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
