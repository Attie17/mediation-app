import React from 'react';

export default function TestBox({ text }) {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'red',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold',
      border: '3px solid yellow',
      minHeight: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {text || 'TEST BOX - I am visible!'}
    </div>
  );
}
