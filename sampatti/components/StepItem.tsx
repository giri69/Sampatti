// components/StepItem.tsx
import React, { ReactNode } from 'react';

interface StepItemProps {
  icon: ReactNode;
  title: string;
  description: string;
  isLast: boolean;
}

const StepItem: React.FC<StepItemProps> = ({ icon, title, description, isLast }) => {
  return (
    <div className="relative">
      <div className="p-1 rounded-full bg-gradient-to-r from-[#0070f3] to-[#7928ca] w-16 h-16 mb-6 flex items-center justify-center">
        <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
          {icon}
        </div>
      </div>
      
      {!isLast && (
        <div className="absolute top-16 left-8 w-full h-1 bg-gradient-to-r from-[#0070f3] to-transparent md:w-1 md:h-full md:top-16 md:left-8"></div>
      )}
      
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/70">
        {description}
      </p>
    </div>
  );
};

export default StepItem;