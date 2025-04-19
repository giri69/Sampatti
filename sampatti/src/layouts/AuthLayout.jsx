import { Outlet, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-black flex">
      {/* Left side - Brand/Info */}
      <div className="hidden lg:flex lg:flex-col lg:w-1/2 bg-gradient-to-br from-gray-900 to-black p-12 justify-between">
        <div>
          <Link to="/" className="flex items-center">
            <Lock className="text-white mr-2" size={24} />
            <span className="font-bold text-2xl tracking-tight text-white">Sampatti</span>
          </Link>
        </div>
        
        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-white mb-6">Secure Your Financial Legacy</h1>
          <p className="text-lg text-gray-300 mb-8">
            Sampatti helps you track all your investments in one place and ensures your nominees can access essential details when needed.
          </p>
          
          <div className="space-y-6">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-blue-500/20 text-blue-400">
                01
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-white">Centralized Management</h3>
                <p className="mt-1 text-gray-400">All your investments in one secure place.</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500/20 text-indigo-400">
                02
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-white">Nominee Access</h3>
                <p className="mt-1 text-gray-400">Ensure seamless access during emergencies.</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-purple-500/20 text-purple-400">
                03
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-white">Bank-Grade Security</h3>
                <p className="mt-1 text-gray-400">Your data is protected with advanced encryption.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-gray-400">
          © 2025 Sampatti. All rights reserved.
        </div>
      </div>
      
      {/* Right side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Outlet for Login/Register/ForgotPassword */}
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;