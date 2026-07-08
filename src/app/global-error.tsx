'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          <div style={{ textAlign: 'center', padding: '0 24px' }}>
            <h1 style={{ fontSize: '60px', fontWeight: 700, color: '#0B3C6D', marginBottom: '16px' }}>500</h1>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>Critical Error</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px', maxWidth: '400px' }}>
              A critical error occurred. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: '10px 24px',
                background: '#0B3C6D',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
