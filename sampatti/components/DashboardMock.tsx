import React from 'react';

const DashboardMock: React.FC = () => {
  return (
    <div className="w-full aspect-square relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0070f3]/20 to-[#7928ca]/20 backdrop-blur-xl rounded-lg"></div>
      <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#0070f3]/40 rounded-full blur-xl"></div>
      <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-[#7928ca]/30 rounded-full blur-2xl"></div>
      
      {/* Dashboard Mock Content */}
      <div className="absolute inset-8 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 overflow-hidden p-4 shadow-2xl">
        <div className="h-2 w-16 bg-white/20 rounded-full mb-6"></div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="h-24 rounded bg-gradient-to-r from-[#0070f3]/30 to-[#0070f3]/10 p-3">
            <div className="h-3 w-16 bg-white/40 rounded-sm mb-2"></div>
            <div className="h-8 w-8 rounded-full bg-[#0070f3]/40 mt-4"></div>
          </div>
          <div className="h-24 rounded bg-gradient-to-r from-[#7928ca]/30 to-[#7928ca]/10 p-3">
            <div className="h-3 w-12 bg-white/40 rounded-sm mb-2"></div>
            <div className="h-8 w-16 rounded-sm bg-[#7928ca]/40 mt-4"></div>
          </div>
        </div>
        <div className="h-40 rounded bg-gradient-to-b from-black/40 to-black/0 border border-white/10 p-3">
          <div className="flex justify-between items-center mb-4">
            <div className="h-2 w-24 bg-white/30 rounded-full"></div>
            <div className="h-4 w-4 rounded-full bg-[#0070f3]/60"></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-[#0070f3]/60 mr-2"></div>
              <div className="h-2 w-32 bg-white/20 rounded-full"></div>
              <div className="h-2 w-12 bg-[#0070f3]/40 rounded-full ml-auto"></div>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-[#7928ca]/60 mr-2"></div>
              <div className="h-2 w-24 bg-white/20 rounded-full"></div>
              <div className="h-2 w-16 bg-[#7928ca]/40 rounded-full ml-auto"></div>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-[#0070f3]/60 mr-2"></div>
              <div className="h-2 w-28 bg-white/20 rounded-full"></div>
              <div className="h-2 w-10 bg-[#0070f3]/40 rounded-full ml-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMock;