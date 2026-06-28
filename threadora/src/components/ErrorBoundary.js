import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          padding: '24px',
          boxSizing: 'border-box',
          backgroundColor: 'hsl(var(--background, 0 0% 4%))',
          color: 'hsl(var(--foreground, 0 0% 98%))',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: 'hsl(var(--surface, 0 0% 9%))',
            border: '1px solid hsl(var(--border, 0 0% 15%))',
            borderRadius: '12px',
            padding: '40px 32px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <img 
                src="/threadmark-icon.png" 
                alt="Threadora Logo" 
                style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover' }} 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              margin: '0 0 12px 0',
              color: 'hsl(var(--text-title, 0 0% 98%))'
            }}>
              Something went wrong
            </h1>
            
            <p style={{
              fontSize: '14px',
              color: 'hsl(var(--text-body, 0 0% 65%))',
              margin: '0 0 24px 0',
              lineHeight: 1.6
            }}>
              An unexpected error occurred in the application. You can try reloading the page.
            </p>

            <button
              onClick={() => window.location.reload()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '44px',
                padding: '0 24px',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: 'hsl(var(--primary, 0 0% 96%))',
                color: 'hsl(var(--primary-foreground, 0 0% 9%))',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '24px',
                width: '100%',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              Reload Application
            </button>

            {this.state.error && (
              <details style={{
                textAlign: 'left',
                border: '1px solid hsl(var(--border, 0 0% 15%))',
                borderRadius: '6px',
                padding: '12px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                fontSize: '12px',
                color: 'hsl(var(--text-muted, 0 0% 46%))'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  outline: 'none',
                  userSelect: 'none',
                  color: 'hsl(var(--text-meta, 0 0% 62%))'
                }}>
                  Error details
                </summary>
                <pre style={{
                  marginTop: '10px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  margin: 0
                }}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
