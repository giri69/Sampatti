// components/FeatureCard.tsx
import React, { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  colorFrom: string;
  colorTo: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  description, 
  colorFrom, 
  colorTo 
}) => {
  const fromColor = colorFrom.includes('/') ? colorFrom : `${colorFrom}`;
  const toColor = colorTo.includes('/') ? colorTo : `${colorTo}`;
  
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#0070f3]/20 to-[#7928ca]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative bg-white/5 p-6 rounded-xl backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-[${fromColor}] to-[${toColor}] flex items-center justify-center mb-4`}>
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-white/70">
          {description}
        </p>
      </div>
    </div>
  );
};

export default FeatureCard;