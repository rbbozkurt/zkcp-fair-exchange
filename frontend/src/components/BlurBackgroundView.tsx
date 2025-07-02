// src/components/ui/BlurBackgroundView.tsx
import React from 'react';
import clsx from 'clsx';

interface BlurBackgroundViewProps {
  className?: string;
  children: React.ReactNode;
}

const BlurBackgroundView: React.FC<BlurBackgroundViewProps> = ({ className, children }) => {
  return (
    <div
      className={clsx(
        'backdrop-blur-lg bg-black/20 rounded-full px-6 py-2 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200',
        className
      )}
    >
      {children}
    </div>
  );
};

export default BlurBackgroundView;
