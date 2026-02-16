
import React from 'react';

const Logo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="48" height="48" rx="8" fill="hsl(var(--primary))" />
    <text
      x="50%"
      y="55%"
      dominantBaseline="middle"
      textAnchor="middle"
      fontSize="28"
      fontWeight="bold"
      fill="hsl(var(--primary-foreground))"
    >
      S
    </text>
  </svg>
);

export default Logo;
