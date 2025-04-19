import React from 'react';
import { BarChart3, Bell, Briefcase, FileText, LockKeyhole, Users } from 'lucide-react';
import FeatureCard from './FeatureCard';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Briefcase className="h-6 w-6 text-white" />,
      title: "Centralized Asset Tracking",
      description: "Track all your investments from stocks and mutual funds to real estate and gold in one secure dashboard.",
      colorFrom: "#0070f3",
      colorTo: "#0070f3/70"
    },
    {
      icon: <Users className="h-6 w-6 text-white" />,
      title: "Nominee Management",
      description: "Ensure your nominees can access critical investment details when they need them most.",
      colorFrom: "#7928ca",
      colorTo: "#7928ca/70"
    },
    {
      icon: <FileText className="h-6 w-6 text-white" />,
      title: "Document Storage",
      description: "Store and organize all your investment certificates, statements, and important documents.",
      colorFrom: "#0070f3",
      colorTo: "#0070f3/70"
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-white" />,
      title: "Smart Insights",
      description: "Get intelligent portfolio analysis, risk assessment, and personalized recommendations.",
      colorFrom: "#7928ca",
      colorTo: "#7928ca/70"
    },
    {
      icon: <Bell className="h-6 w-6 text-white" />,
      title: "Alerts & Notifications",
      description: "Receive timely alerts for maturity dates, price changes, and important investment events.",
      colorFrom: "#0070f3",
      colorTo: "#0070f3/70"
    },
    {
      icon: <LockKeyhole className="h-6 w-6 text-white" />,
      title: "Bank-Grade Security",
      description: "Rest easy with robust encryption, secure authentication, and comprehensive data protection.",
      colorFrom: "#7928ca",
      colorTo: "#7928ca/70"
    }
  ];

  return (
    <div id="features" className="relative z-10 py-24 bg-black">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#0070f3]/5 rounded-full blur-[120px]" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-[#0070f3]/10 to-[#7928ca]/10 border border-[#0070f3]/20 text-sm font-medium text-[#0070f3] mb-4">
            Features
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
            Everything you need to <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0070f3] to-[#7928ca]">manage your portfolio</span>
          </h3>
          <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
            Sampatti provides a comprehensive suite of tools to track, monitor, and secure your investments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              colorFrom={feature.colorFrom}
              colorTo={feature.colorTo}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;