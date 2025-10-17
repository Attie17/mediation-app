import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#1e293b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1400px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '40px'
      }}>
        {/* Left Panel */}
        <div style={{
          borderRadius: '16px',
          backgroundColor: '#3b82f6',
          border: '2px solid #60a5fa',
          padding: '60px 40px',
          minHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'center',
          color: 'white',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 'bold', margin: '0 0 20px 0', letterSpacing: '-1px' }}>
              Accord
            </h1>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '500', margin: '0 0 30px 0' }}>
              Mediation
            </h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', margin: '0 0 20px 0', opacity: 0.95 }}>
              Fair, guided, confidential resolution.
            </p>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.7', margin: '0', opacity: 0.9, maxWidth: '400px' }}>
              In South Africa, Rule 41A requires divorcing spouses to formally consider mediation before the courts will hear their case  a requirement now reinforced by Gauteng's 2025 directive that no trial date will be set without a mediator's report.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                padding: '14px 32px',
                fontSize: '1rem',
                fontWeight: '600',
                backgroundColor: '#000',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Register
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '14px 32px',
                fontSize: '1rem',
                fontWeight: '600',
                backgroundColor: '#60a5fa',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
          </div>

          <div style={{ marginTop: '40px', fontSize: '0.85rem', opacity: 0.8' }}>
             2025 Accord Mediation. All rights reserved.
          </div>
        </div>

        {/* Right Panel */}
        <div style={{
          borderRadius: '16px',
          backgroundColor: '#3b82f6',
          border: '2px solid #60a5fa',
          padding: '60px 40px',
          minHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: 'white',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
        }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 'bold', margin: '0 0 20px 0', letterSpacing: '-1px' }}>
            Accord
          </h1>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '500', margin: '0 0 40px 0' }}>
            Mediation
          </h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6', margin: '0 0 40px 0', opacity: 0.95 }}>
            Fair, guided, confidential resolution.
          </p>
          
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', margin: '0 0 20px 0' }}>
              Good morning, Attie.
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: '1.7', margin: '0', opacity: 0.9, fontStyle: 'italic', maxWidth: '450px' }}>
              Welcome, Attie. As a mediator, you help families find resolution in a fair, guided, and confidential way.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
