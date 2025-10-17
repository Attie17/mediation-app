import React from "react";

/**
 * Plasmic-ready HomeLayout component
 * @param {object} props
 * @param {React.ReactNode} props.left - Left panel content
 * @param {React.ReactNode} props.right - Right panel content
 */
export default function HomeLayout(props) {
  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '1280px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px'
        }}
      >
        {/* Left Panel */}
        <div 
          style={{
            borderRadius: '12px',
            backgroundColor: '#2563eb',
            border: '1px solid #60a5fa',
            padding: '48px',
            minHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            color: 'white'
          }}
        >
          {props.left || <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Left Panel - Add content here</div>}
        </div>
        {/* Right Panel */}
        <div 
          style={{
            borderRadius: '12px',
            backgroundColor: '#2563eb',
            border: '1px solid #60a5fa',
            padding: '48px',
            minHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            color: 'white'
          }}
        >
          {props.right || <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Right Panel - Add content here</div>}
        </div>
      </div>
    </div>
  );
}
