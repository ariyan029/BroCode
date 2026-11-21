import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem',
      textAlign: 'center',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        marginBottom: '0.5rem',
        background: 'linear-gradient(to right, #38bdf8, #818cf8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        ⚡ Welcome to VibeCode
      </h1>
      <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '480px', marginBottom: '2rem' }}>
        A blazing fast in-browser React + TypeScript development environment powered by WebContainers.
      </p>
      <div style={{
        backgroundColor: '#1e293b',
        padding: '1.5rem 2.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      }}>
        <button
          onClick={() => setCount((c) => c + 1)}
          style={{
            backgroundColor: '#38bdf8',
            color: '#0f172a',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.1s ease',
          }}
        >
          Count is {count}
        </button>
        <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
          Edit <code>src/App.tsx</code> to see live hot-reloading!
        </p>
      </div>
    </div>
  );
}
