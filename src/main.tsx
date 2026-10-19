import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Filter out and prevent non-fatal browser extension errors (e.g. MetaMask, Phantom, wallet scripts)
// from bubbling up or breaking the application.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const message = typeof reason === 'string' ? reason : reason?.message || '';
    const stack = reason?.stack || '';

    // Ignore known extension injection errors
    if (
      message.includes('MetaMask') ||
      message.includes('chrome-extension://') ||
      stack.includes('chrome-extension://') ||
      stack.includes('inpage.js') ||
      message.includes('Failed to connect to MetaMask')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
  });

  window.addEventListener(
    'error',
    (event) => {
      const filename = event?.filename || '';
      const message = event?.message || '';

      if (
        filename.includes('chrome-extension://') ||
        filename.includes('inpage.js') ||
        message.includes('MetaMask') ||
        message.includes('Failed to connect to MetaMask')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    },
    true
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
