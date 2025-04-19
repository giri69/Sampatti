import React from 'react';
import { ChevronRight } from 'lucide-react';
import DashboardMock from './DashboardMock';

interface HeroSectionProps {
  mounted: boolean;
  onRegisterClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ mounted, onRegisterClick }) => {
  return (
    <div className="relative z-10 pt-16 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-[#0070f3]/10 to-[#7928ca]/10 border border-[#0070f3]/20 text-sm font-medium text-[#0070f3] mb-6">
              Your personal investment manager
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
              <span className="block">Manage all</span>
              <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-[#0070f3] to-[#7928ca]">
                your investments
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-2xl">
              Track and monitor all your assets, ensure nominee access during emergencies, and get real-time valuations with Sampatti's comprehensive investment management platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button
                onClick={onRegisterClick}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#0070f3] to-[#7928ca] text-white font-medium flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
              <a
                href="#features"
                className="px-6 py-3 rounded-full border border-white/20 text-white/80 hover:text-white font-medium flex items-center justify-center hover:border-white/40 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
          <div className="relative">
            {mounted && <DashboardMock />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;