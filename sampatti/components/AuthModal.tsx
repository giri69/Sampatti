// components/AuthModal.tsx
import React from 'react';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitchMode: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, mode, onClose, onSwitchMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0070f3]/20 to-[#7928ca]/20"></div>
          <div className="relative bg-black/80 backdrop-blur-sm border border-white/10 px-4 pt-5 pb-4 sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-xl leading-6 font-semibold text-white" id="modal-title">
                  {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
                </h3>
                <div className="mt-6">
                  {mode === 'login' ? (
                    <LoginForm />
                  ) : (
                    <RegisterForm />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="relative bg-black/90 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-white/10">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-[#0070f3] to-[#7928ca] text-base font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0070f3] sm:ml-3 sm:w-auto sm:text-sm"
            >
              {mode === 'login' ? 'Sign in' : 'Register'}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-lg border border-white/10 shadow-sm px-4 py-2 bg-white/5 text-base font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0070f3] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
          <div className="relative bg-black/80 px-4 py-3 text-center text-sm border-t border-white/10">
            {mode === 'login' ? (
              <p className="text-white/70">
                Don't have an account?{' '}
                <button 
                  onClick={onSwitchMode} 
                  className="text-[#0070f3] hover:text-[#0070f3]/80 font-medium"
                >
                  Register now
                </button>
              </p>
            ) : (
              <p className="text-white/70">
                Already have an account?{' '}
                <button 
                  onClick={onSwitchMode} 
                  className="text-[#0070f3] hover:text-[#0070f3]/80 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginForm: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white/70">Email</label>
        <input 
          type="email" 
          name="email" 
          id="email" 
          className="mt-1 block w-full border border-white/10 rounded-lg shadow-sm bg-white/5 text-white focus:ring-[#0070f3] focus:border-[#0070f3] sm:text-sm px-4 py-2" 
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-white/70">Password</label>
        <input 
          type="password" 
          name="password" 
          id="password" 
          className="mt-1 block w-full border border-white/10 rounded-lg shadow-sm bg-white/5 text-white focus:ring-[#0070f3] focus:border-[#0070f3] sm:text-sm px-4 py-2" 
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input 
            id="remember_me" 
            name="remember_me" 
            type="checkbox" 
            className="h-4 w-4 text-[#0070f3] focus:ring-[#0070f3] border-white/20 rounded bg-white/5" 
          />
          <label htmlFor="remember_me" className="ml-2 block text-sm text-white/70">Remember me</label>
        </div>
        <div className="text-sm">
          <a href="#" className="font-medium text-[#0070f3] hover:text-[#0070f3]/80">Forgot your password?</a>
        </div>
      </div>
    </div>
  );
};

const RegisterForm: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white/70">Full Name</label>
        <input 
          type="text" 
          name="name" 
          id="name" 
          className="mt-1 block w-full border border-white/10 rounded-lg shadow-sm bg-white/5 text-white focus:ring-[#0070f3] focus:border-[#0070f3] sm:text-sm px-4 py-2" 
        />
      </div>
      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-white/70">Email</label>
        <input 
          type="email" 
          name="reg-email" 
          id="reg-email" 
          className="mt-1 block w-full border border-white/10 rounded-lg shadow-sm bg-white/5 text-white focus:ring-[#0070f3] focus:border-[#0070f3] sm:text-sm px-4 py-2" 
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-white/70">Phone Number</label>
        <input 
          type="text" 
          name="phone" 
          id="phone" 
          className="mt-1 block w-full border border-white/10 rounded-lg shadow-sm bg-white/5 text-white focus:ring-[#0070f3] focus:border-[#0070f3] sm:text-sm px-4 py-2" 
        />
      </div>
      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-white/70">Password</label>
        <input 
          type="password" 
          name="reg-password" 
          id="reg-password" 
          className="mt-1 block w-full border border-white/10 rounded-lg shadow-sm bg-white/5 text-white focus:ring-[#0070f3] focus:border-[#0070f3] sm:text-sm px-4 py-2" 
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-white/70">Confirm Password</label>
        <input 
          type="password" 
          name="confirm-password" 
          id="confirm-password" 
          className="mt-1 block w-full border border-white/10 rounded-lg shadow-sm bg-white/5 text-white focus:ring-[#0070f3] focus:border-[#0070f3] sm:text-sm px-4 py-2" 
        />
      </div>
    </div>
  );
};

export default AuthModal;