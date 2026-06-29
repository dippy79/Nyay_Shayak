import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>कुछ गलत हो गया</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
            {this.props.fallbackMessage ||
              'कृपया पेज रिफ्रेश करें। समस्या बनी रहे तो सहायता से संपर्क करें।'}
          </p>
          <button onClick={() => this.setState({ hasError: false })}>दोबारा कोशिश करें</button>
        </div>
      );
    }

    return this.props.children;
  }
}

