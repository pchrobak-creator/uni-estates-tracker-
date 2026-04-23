import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 fade-in"
      style={{
        background: type === 'success' ? '#1D9E75' : '#D85A30',
        color: 'white',
        padding: '12px 20px',
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 14,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  );
}
