import React from 'react';

export default function Notification({ message, type, onClose }) {
  if (!message) return null;

  const bannerStyles = {
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    fontWeight: '600',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: type === 'success' ? '#def7ec' : '#fde8e8',
    color: type === 'success' ? '#03543f' : '#9b1c1c',
    border: `1px solid ${type === 'success' ? '#bcf0da' : '#f8b4b4'}`,
  };

  return (
    <div style={bannerStyles}>
      <span>{message}</span>
      <button 
        onClick={onClose} 
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}
      >
        &times;
      </button>
    </div>
  );
}
