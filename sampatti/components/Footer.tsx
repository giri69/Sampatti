// components/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
  const footerLinks = {
    company: [
      { name: "About", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Contact Us", href: "#" }
    ],
    resources: [
      { name: "Help Center", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Guides", href: "#" }
    ],
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Security", href: "#" }
    ]
  };

  return (
    <footer className="relative z-10 bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#7928ca] to-[#0070f3]"></div>
              <div className="text-xl font-bold tracking-tight text-white">Sampatti</div>
            </div>
            <p className="text-white/60 text-sm">
              The most secure platform to manage all your investments in one place.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-sm text-white/60 text-center">
            &copy; {new Date().getFullYear()} Sampatti. All rights reserved.
          </p>
          </div>
        </div>
        </footer>
    );
}
export default Footer;