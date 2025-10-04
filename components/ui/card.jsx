import React from 'react';

export function Card({ children, className = '', neumorphic = false, ...props }) {
  const baseClasses = neumorphic ? 'neumorphic-card' : 'rounded-2xl border-2 border-yellow-200 bg-gradient-to-br from-white via-yellow-50 to-orange-50 shadow-xl hover:shadow-2xl transition-shadow duration-300';
  return (
    <div
      className={`${baseClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
