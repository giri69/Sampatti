// src/components/common/Card.jsx
import React from 'react';

const Card = ({ 
  children, 
  title = null,
  titleRight = null,
  className = '',
  bodyClassName = '',
  noPadding = false
}) => {
  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      {title && (
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          {typeof title === 'string' ? (
            <h3 className="font-medium text-white">{title}</h3>
          ) : (
            title
          )}
          
          {titleRight && (
            <div>{titleRight}</div>
          )}
        </div>
      )}
      
      <div className={`${noPadding ? '' : 'p-5'} ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;