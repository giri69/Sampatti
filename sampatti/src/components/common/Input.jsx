// src/components/common/Input.jsx
import React, { forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({ 
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  icon = null,
  error = null,
  required = false,
  disabled = false,
  className = '',
  showPasswordToggle = false,
  onTogglePassword = null,
  showPassword = false,
  hint = null,
  ...rest
}, ref) => {
  const inputId = name || Math.random().toString(36).substring(2, 9);
  
  return (
    <div className={`${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium mb-2 text-white">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          className={`
            block w-full 
            ${icon ? 'pl-10' : 'pl-3'} 
            ${showPasswordToggle ? 'pr-10' : 'pr-3'} 
            py-3 
            border ${error ? 'border-red-500' : 'border-white/10'} 
            bg-white/5 
            rounded-lg 
            focus:ring-2 
            focus:ring-blue-500 
            focus:border-transparent 
            transition-colors 
            text-white 
            placeholder-gray-400
            disabled:opacity-60
            disabled:cursor-not-allowed
          `}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          {...rest}
        />
        
        {showPasswordToggle && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={onTogglePassword}
            disabled={disabled}
          >
            {showPassword ? (
              <EyeOff size={18} className="text-gray-500" />
            ) : (
              <Eye size={18} className="text-gray-500" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
      
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;