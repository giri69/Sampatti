// components/CTASection.tsx
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CTASectionProps {
  onRegisterClick: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onRegisterClick }) => {
  return (
    <div className="relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0070f3] to-[#7928ca] opacity-90"></div>
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20"></div>
          <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-20 lg:py-24 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to take control of your investments?
            </h2>
            <p className="mt-4 text-lg leading-6 text-white/80 max-w-2xl mx-auto">
              Join thousands of users who are securely managing their investment portfolios with Sampatti.
            </p>
            <div className="mt-10 flex justify-center">
              <button
                onClick={onRegisterClick}
                className="px-8 py-3 rounded-full bg-white text-[#0070f3] font-medium inline-flex items-center hover:bg-opacity-90 transition-opacity"
              >
                Get started
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTASection;