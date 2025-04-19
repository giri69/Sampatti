import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Users, ChevronRight, ArrowRight, FileText, BarChart3, LineChart } from 'lucide-react';

const HomePage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Features with auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const features = [
    {
      icon: <BarChart3 size={36} />,
      title: "Centralized Tracking",
      description: "Consolidate and monitor all investments across multiple platforms in one secure place."
    },
    {
      icon: <Users size={36} />,
      title: "Nominee Management",
      description: "Ensure your nominees can seamlessly access critical investment details during emergencies."
    },
    {
      icon: <FileText size={36} />,
      title: "Document Storage",
      description: "Securely store and organize all your critical investment documents for easy access."
    },
    {
      icon: <LineChart size={36} />,
      title: "Smart Insights",
      description: "Gain valuable analytics and timely alerts to make informed investment decisions."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Navigation */}
      <header className={`fixed w-full py-4 transition-all duration-300 z-50 ${scrolled ? 'bg-black/90 backdrop-blur-sm' : 'bg-transparent'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center">
            <Lock className="text-white mr-2" size={24} />
            <span className="font-bold text-2xl tracking-tight">Sampatti</span>
          </div>
          
          <nav className="hidden md:flex space-x-10">
            <a href="#features" className="hover:text-gray-300 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-300 transition-colors">How It Works</a>
            <a href="#security" className="hover:text-gray-300 transition-colors">Security</a>
          </nav>
          
          <div className="flex space-x-4">
            <button className="px-4 py-2 rounded-md border border-white/20 hover:bg-white/10 transition-colors">
              Login
            </button>
            <button className="hidden md:block px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent"></div>
        <div className="relative container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Secure Your Financial Legacy
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
              Sampatti solves the problem of investment details being managed by a single person. Track all investments, access their value anytime, and ensure nominees can retrieve essential details in emergencies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 bg-white text-black rounded-md font-medium hover:bg-gray-200 transition-colors">
                Start Your Journey
              </button>
              <button className="px-8 py-4 rounded-md border border-white/20 hover:bg-white/10 transition-colors flex items-center justify-center">
                Learn More <ChevronRight size={18} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Abstract shapes/graphics */}
        <div className="absolute top-1/2 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* Problem Statement Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">The Problem We're Solving</h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Investment details are often managed by a single person, creating a critical vulnerability. When that person is unavailable, accessing this crucial information becomes nearly impossible for family members.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                <h3 className="text-xl font-medium mb-3">Scattered Investments</h3>
                <p className="text-gray-300">Investment records spread across multiple platforms and institutions make tracking and management difficult.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                <h3 className="text-xl font-medium mb-3">Knowledge Gaps</h3>
                <p className="text-gray-300">Family members often lack awareness of all investments and how to access them during emergencies.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                <h3 className="text-xl font-medium mb-3">Limited Accessibility</h3>
                <p className="text-gray-300">Critical documents and access information are not securely shared with trusted nominees.</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-1">
                <div className="h-full w-full rounded-xl bg-black flex items-center justify-center">
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 mb-6">
                      <ShieldCheck size={36} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Sampatti Protection</h3>
                    <p className="text-gray-300">
                      We bridge the gap by creating a secure platform that ensures investment details are protected yet accessible to the right people when needed.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Key Features</h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Sampatti provides a comprehensive solution for managing your investment portfolio and ensuring its accessibility.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="col-span-1 lg:col-span-1 space-y-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={`p-6 rounded-lg border transition-all duration-300 cursor-pointer ${
                    activeFeature === index 
                      ? 'bg-white/10 border-white/20' 
                      : 'bg-transparent border-white/5 hover:bg-white/5'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start">
                    <div className={`mr-4 p-2 rounded-lg ${activeFeature === index ? 'bg-white/10' : 'bg-white/5'}`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-300">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="col-span-1 lg:col-span-2">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-1 h-full">
                <div className="h-full w-full rounded-xl bg-gray-900 flex items-center justify-center overflow-hidden">
                  {/* Feature showcase based on active feature */}
                  <div className="p-8 w-full h-full flex items-center justify-center">
                    {activeFeature === 0 && (
                      <div className="max-w-lg">
                        <h3 className="text-2xl font-bold mb-4">All Your Investments in One Place</h3>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-black p-4 rounded-lg border border-white/10">
                            <div className="text-sm text-gray-400">Stocks</div>
                            <div className="text-xl font-bold">₹8,45,200</div>
                            <div className="text-green-400 text-sm">+12.3%</div>
                          </div>
                          <div className="bg-black p-4 rounded-lg border border-white/10">
                            <div className="text-sm text-gray-400">Mutual Funds</div>
                            <div className="text-xl font-bold">₹5,85,000</div>
                            <div className="text-green-400 text-sm">+8.7%</div>
                          </div>
                          <div className="bg-black p-4 rounded-lg border border-white/10">
                            <div className="text-sm text-gray-400">Fixed Deposits</div>
                            <div className="text-xl font-bold">₹3,50,000</div>
                            <div className="text-blue-400 text-sm">6.8% p.a.</div>
                          </div>
                          <div className="bg-black p-4 rounded-lg border border-white/10">
                            <div className="text-sm text-gray-400">Real Estate</div>
                            <div className="text-xl font-bold">₹65,00,000</div>
                            <div className="text-green-400 text-sm">+15.2%</div>
                          </div>
                        </div>
                        <div className="bg-black p-4 rounded-lg border border-white/10">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm text-gray-400">Total Portfolio Value</div>
                              <div className="text-2xl font-bold">₹82,80,200</div>
                            </div>
                            <div className="text-green-400 font-medium">+10.5% YTD</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeFeature === 1 && (
                      <div className="max-w-lg">
                        <h3 className="text-2xl font-bold mb-4">Secure Nominee Access</h3>
                        <div className="space-y-4">
                          <div className="bg-black p-4 rounded-lg border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-medium">Rahul Sharma</div>
                              <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Active</div>
                            </div>
                            <div className="text-sm text-gray-400">Primary Nominee • Son</div>
                            <div className="mt-3 flex justify-between items-center">
                              <div className="text-sm">Full Access Rights</div>
                              <button className="text-sm flex items-center text-blue-400">
                                Manage <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="bg-black p-4 rounded-lg border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-medium">Priya Verma</div>
                              <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Active</div>
                            </div>
                            <div className="text-sm text-gray-400">Secondary Nominee • Daughter</div>
                            <div className="mt-3 flex justify-between items-center">
                              <div className="text-sm">Document Access Only</div>
                              <button className="text-sm flex items-center text-blue-400">
                                Manage <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <button className="w-full p-3 mt-2 border border-dashed border-white/20 rounded-lg text-gray-300 hover:bg-white/5 transition-colors">
                            + Add New Nominee
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {activeFeature === 2 && (
                      <div className="max-w-lg">
                        <h3 className="text-2xl font-bold mb-4">Document Management</h3>
                        <div className="space-y-4">
                          <div className="bg-black p-4 rounded-lg border border-white/10">
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-500/20 rounded mr-3">
                                <FileText size={24} className="text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium">HDFC Bank Fixed Deposit</div>
                                <div className="text-sm text-gray-400">Certificate • PDF • 2.4 MB</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-black p-4 rounded-lg border border-white/10">
                            <div className="flex items-center">
                              <div className="p-2 bg-green-500/20 rounded mr-3">
                                <FileText size={24} className="text-green-400" />
                              </div>
                              <div>
                                <div className="font-medium">Share Holding Statement</div>
                                <div className="text-sm text-gray-400">Statement • PDF • 3.1 MB</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-black p-4 rounded-lg border border-white/10">
                            <div className="flex items-center">
                              <div className="p-2 bg-yellow-500/20 rounded mr-3">
                                <FileText size={24} className="text-yellow-400" />
                              </div>
                              <div>
                                <div className="font-medium">Property Documents</div>
                                <div className="text-sm text-gray-400">Legal • PDF • 8.5 MB</div>
                              </div>
                            </div>
                          </div>
                          
                          <button className="w-full p-3 mt-2 border border-dashed border-white/20 rounded-lg text-gray-300 hover:bg-white/5 transition-colors">
                            + Upload New Document
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {activeFeature === 3 && (
                      <div className="max-w-lg">
                        <h3 className="text-2xl font-bold mb-4">Smart Insights & Alerts</h3>
                        <div className="space-y-4">
                          <div className="bg-black p-4 rounded-lg border border-red-500/30">
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-medium text-red-400">Fixed Deposit Maturity</div>
                              <div className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">High Priority</div>
                            </div>
                            <div className="text-sm text-gray-300">Your SBI FD of ₹2,00,000 is maturing in 3 days. Consider renewal options.</div>
                          </div>
                          
                          <div className="bg-black p-4 rounded-lg border border-yellow-500/30">
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-medium text-yellow-400">Portfolio Rebalancing</div>
                              <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">Medium Priority</div>
                            </div>
                            <div className="text-sm text-gray-300">Your equity allocation has increased to 65%. Consider rebalancing to maintain your 60% target.</div>
                          </div>
                          
                          <div className="bg-black p-4 rounded-lg border border-green-500/30">
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-medium text-green-400">Dividend Received</div>
                              <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Information</div>
                            </div>
                            <div className="text-sm text-gray-300">You received a dividend of ₹12,500 from Infosys shares on April 15, 2025.</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">How Sampatti Works</h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              A simple, secure process to manage and protect your investment information.
            </p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            {/* Connection line */}
            <div className="absolute left-16 top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 hidden md:block"></div>
            
            {/* Steps */}
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row items-start gap-8 relative">
                <div className="bg-blue-500 text-black font-bold text-xl rounded-full w-12 h-12 flex items-center justify-center shrink-0 md:z-10">1</div>
                <div className="bg-white/5 p-6 rounded-lg border border-white/10 md:ml-8 flex-1">
                  <h3 className="text-xl font-semibold mb-3">Create Your Account</h3>
                  <p className="text-gray-300 mb-4">Sign up for Sampatti and set up your secure profile with multi-factor authentication.</p>
                  <button className="text-blue-400 flex items-center hover:underline">
                    Get Started <ArrowRight size={16} className="ml-2" />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-start gap-8 relative">
                <div className="bg-indigo-500 text-black font-bold text-xl rounded-full w-12 h-12 flex items-center justify-center shrink-0 md:z-10">2</div>
                <div className="bg-white/5 p-6 rounded-lg border border-white/10 md:ml-8 flex-1">
                  <h3 className="text-xl font-semibold mb-3">Add Your Investments</h3>
                  <p className="text-gray-300 mb-4">Easily import or manually add all your investments from various sources in one place.</p>
                  <button className="text-blue-400 flex items-center hover:underline">
                    Learn More <ArrowRight size={16} className="ml-2" />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-start gap-8 relative">
                <div className="bg-violet-500 text-black font-bold text-xl rounded-full w-12 h-12 flex items-center justify-center shrink-0 md:z-10">3</div>
                <div className="bg-white/5 p-6 rounded-lg border border-white/10 md:ml-8 flex-1">
                  <h3 className="text-xl font-semibold mb-3">Upload Critical Documents</h3>
                  <p className="text-gray-300 mb-4">Store important certificates, statements, and legal documents with end-to-end encryption.</p>
                  <button className="text-blue-400 flex items-center hover:underline">
                    Learn More <ArrowRight size={16} className="ml-2" />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-start gap-8 relative">
                <div className="bg-purple-500 text-black font-bold text-xl rounded-full w-12 h-12 flex items-center justify-center shrink-0 md:z-10">4</div>
                <div className="bg-white/5 p-6 rounded-lg border border-white/10 md:ml-8 flex-1">
                  <h3 className="text-xl font-semibold mb-3">Add and Manage Nominees</h3>
                  <p className="text-gray-300 mb-4">Set up trusted nominees with appropriate access levels to ensure they can retrieve information when needed.</p>
                  <button className="text-blue-400 flex items-center hover:underline">
                    Learn More <ArrowRight size={16} className="ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Bank-Grade Security</h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Your financial information deserves the highest level of protection.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-white/5 p-6 rounded-lg border border-white/10">
              <div className="p-3 bg-blue-500/20 rounded-lg inline-block mb-4">
                <Lock size={28} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">End-to-End Encryption</h3>
              <p className="text-gray-300">All your data is encrypted at rest and in transit using industry-leading encryption standards.</p>
            </div>
            
            <div className="bg-white/5 p-6 rounded-lg border border-white/10">
              <div className="p-3 bg-green-500/20 rounded-lg inline-block mb-4">
                <ShieldCheck size={28} className="text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Factor Authentication</h3>
              <p className="text-gray-300">Secure your account with multiple layers of authentication to prevent unauthorized access.</p>
            </div>
            
            <div className="bg-white/5 p-6 rounded-lg border border-white/10">
              <div className="p-3 bg-purple-500/20 rounded-lg inline-block mb-4">
                <Users size={28} className="text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Controlled Access</h3>
              <p className="text-gray-300">Granular access controls ensure nominees can only access what you explicitly authorize.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-blue-900/20 to-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-1 rounded-2xl">
            <div className="bg-black rounded-xl p-10 md:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Secure Your Financial Legacy Today</h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                Join thousands of users who trust Sampatti to protect their investment information and ensure it's accessible to their loved ones when needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-white text-black rounded-md font-medium hover:bg-gray-200 transition-colors">
                  Get Started Free
                </button>
                <button className="px-8 py-4 rounded-md border border-white/20 hover:bg-white/10 transition-colors">
                  Schedule a Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <Lock className="text-white mr-2" size={24} />
              <span className="font-bold text-2xl tracking-tight">Sampatti</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 mb-6 md:mb-0">
              <a href="#features" className="hover:text-gray-300 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-gray-300 transition-colors">How It Works</a>
              <a href="#security" className="hover:text-gray-300 transition-colors">Security</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Pricing</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Support</a>
            </div>
            
            <div className="text-gray-400 text-sm">
              © 2025 Sampatti. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;