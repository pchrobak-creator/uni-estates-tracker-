import React from 'react';

export default function AgentAvatar({ name, color, size = 40 }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: color || '#1D9E75',
        fontSize: size * 0.38,
        letterSpacing: '-0.02em',
      }}
    >
      {initials}
    </div>
  );
}
