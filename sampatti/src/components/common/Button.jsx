// src/components/common/Button.jsx
import React from 'react';

// Button variants
const variants = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "border border-gray-600 text-gray-300 hover:bg-gray-700",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  success: "bg-green-600 hover:bg-green-700 text-white",
  white: "bg-white hover:bg-gray-200 text-black",
  link: "text-blue-400 hover:text-blue-300 underline"
};

// Button sizes
const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg"
};

const Button = ({ 
  children, 
  variant = "primary", 
  size = "md", 
  icon = null,
  isLoading = false,
  disabled = false,
  className = "",
  type = "button",
  onClick = null,
  ...rest
}) => {
  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;
  
  return (
    <button
      type={type}
      className={`
        ${variantClass} 
        ${sizeClass} 
        rounded-lg font-medium transition-colors
        flex items-center justify-center
        disabled:opacity-70 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={isLoading || disabled}
      onClick={onClick}
      {...rest}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;