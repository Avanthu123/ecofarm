

import React from 'react';

// Module-scoped click audio (created lazily to avoid SSR issues)
let _clickAudio = null;

function playClickSound() {
  try {
    if (typeof window === 'undefined') return;
    if (!_clickAudio) {
      _clickAudio = new Audio('/sounds/buttonclick.mp3');
      _clickAudio.preload = 'auto';
    }
    _clickAudio.currentTime = 0;
    _clickAudio.play().catch(() => {});
  } catch (e) {
    // ignore playback errors
  }
}

export function Button({ children, variant = 'default', className = '', onClick, disabled, ...props }) {
  const baseClasses = 'inline-flex items-center justify-center text-sm font-bold uppercase transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    default: 'bg-beige text-green-800 border-4 border-green-600 hover:bg-beige focus:ring-green-600 rounded-full',
    outlineGreen: 'bg-beige text-green-800 border-4 border-green-600 hover:bg-beige focus:ring-green-600 rounded-full',
    outlineRed: 'bg-beige text-red-800 border-4 border-red-600 hover:bg-beige focus:ring-red-600 rounded-full',
    outlineBrown: 'bg-beige text-yellow-900 border-4 border-yellow-800 hover:bg-beige focus:ring-yellow-800 rounded-full',
    outlineViolet: 'bg-beige text-purple-800 border-4 border-purple-600 hover:bg-beige focus:ring-purple-600 rounded-full',
    ghost: 'bg-transparent text-green-800 border-4 border-green-600 hover:bg-transparent focus:ring-green-600 rounded-full',
    menu: 'game-button menu-button',
    icon: 'game-button icon-button'
  };

  const handleClick = (e) => {
    if (disabled) return;
    playClickSound();
    if (typeof onClick === 'function') onClick(e);
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant] || variants.default} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
