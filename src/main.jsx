import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

class RuntimeErrorBoundary extends React.Component {
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

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RuntimeErrorBoundary>
      <App />
    </RuntimeErrorBoundary>
  </React.StrictMode>
);
