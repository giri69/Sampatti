import React from 'react';

interface NavbarProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onRegisterClick }) => {
  return (
    <nav className="relative z-10 border-b border-white/10 backdrop-blur-sm bg-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#7928ca] to-[#0070f3]"></div>
              <div className="text-2xl font-bold tracking-tight">Sampatti</div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={onLoginClick}
              className="px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Login
            </button>
            <button 
              onClick={onRegisterClick}
              className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-[#0070f3] to-[#7928ca] hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;