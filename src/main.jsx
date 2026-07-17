import { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './mobileProgressFix.css';
import './mobileProgressFix.js';

class RuntimeErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Runtime render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="runtime-fallback">
          <h1>Summer Math Battle Tutor Loaded</h1>
          <p>The app hit a runtime issue, but fallback mode is visible.</p>
          <p>Please refresh to retry.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const mountFallback = (message) => {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;
  rootEl.innerHTML = `<div class="runtime-fallback"><h1>Summer Math Battle Tutor Loaded</h1><p>${message}</p></div>`;
};

async function bootstrap() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Missing #root element in index.html');
    return;
  }

  try {
    const { default: App } = await import('./App');
    createRoot(rootElement).render(
      <StrictMode>
        <RuntimeErrorBoundary>
          <App />
        </RuntimeErrorBoundary>
      </StrictMode>
    );
  } catch (error) {
    console.error('Bootstrap error:', error);
    mountFallback('Unable to load the full dashboard right now.');
  }
}

bootstrap();
