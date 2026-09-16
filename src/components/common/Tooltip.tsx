import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'bottom' }) => {
  const posClasses = {
    bottom: 'top-full mt-1.5 left-1/2 -translate-x-1/2',
    top: 'bottom-full mb-1.5 left-1/2 -translate-x-1/2',
    left: 'right-full mr-1.5 top-1/2 -translate-y-1/2',
    right: 'left-full ml-1.5 top-1/2 -translate-y-1/2',
  }[position];

  return (
    <div className="relative group inline-flex items-center justify-center">
      {children}
      <div
        role="tooltip"
        className={`pointer-events-none absolute ${posClasses} z-50 hidden group-hover:flex whitespace-nowrap rounded bg-neutral-900/95 px-2 py-0.5 text-[10px] font-ocra text-neutral-200 border border-white/15 shadow-xl transition-all duration-100 select-none`}
      >
        {text}
      </div>
    </div>
  );
};
