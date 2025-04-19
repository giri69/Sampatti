import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import HowItWorksSection from './HowItWorksSection';
import CTASection from './CTASection';
import Footer from './Footer';
import AuthModal from './AuthModal';

const HomePage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleRegisterClick = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-0 w-[500px] h-[500px] bg-[#0070f3]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-[#7928ca]/20 rounded-full blur-[120px]" />
      </div>
      
      <Navbar onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />
      <HeroSection mounted={mounted} onRegisterClick={handleRegisterClick} />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection onRegisterClick={handleRegisterClick} />
      <Footer />
      
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal}
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        />
      )}
    </div>
  );
};

export default HomePage;