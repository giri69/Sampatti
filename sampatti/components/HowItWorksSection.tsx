// components/HowItWorksSection.tsx
import React from 'react';
import { CheckCircle, PlusCircle, User } from 'lucide-react';
import StepItem from './StepItem';

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      icon: <PlusCircle className="h-6 w-6 text-white" />,
      title: "1. Add Your Assets",
      description: "Easily add all your investments and upload related documents to create your portfolio."
    },
    {
      icon: <User className="h-6 w-6 text-white" />,
      title: "2. Nominate Trusted Contacts",
      description: "Add nominees and set appropriate access levels for emergency situations."
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-white" />,
      title: "3. Manage & Monitor",
      description: "Track performance, receive alerts, and make informed decisions with our insights."
    }
  ];

  return (
    <div className="relative z-10 py-24 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#7928ca]/5 rounded-full blur-[120px]" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-[#7928ca]/10 to-[#0070f3]/10 border border-[#7928ca]/20 text-sm font-medium text-[#7928ca] mb-4">
            How It Works
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7928ca] to-[#0070f3]">Simple steps</span> to financial clarity
          </h3>
          <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
            Managing your investment portfolio has never been easier
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <StepItem 
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection;