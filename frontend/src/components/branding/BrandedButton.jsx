import React from 'react';
import { useBranding } from '../../context/BrandingContext';

/**
 * BrandedButton
 * Button that automatically uses organization's primary/secondary colors
 */
export default function BrandedButton({ 
  children, 
  variant = 'primary', 
  className = '',
  ...props 
}) {
  const { branding } = useBranding();

  const getStyles = () => {
    if (!branding.isCustom) {
      // Use default Tailwind classes when no custom branding
      const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600/10'
      };
      return variants[variant] || variants.primary;
    }

    // Use custom branding colors
    const color = variant === 'secondary' ? branding.secondaryColor : branding.primaryColor;
    
    return {
      backgroundColor: variant === 'outline' ? 'transparent' : color,
      borderColor: color,
      color: variant === 'outline' ? color : 'white',
      borderWidth: variant === 'outline' ? '2px' : '0'
    };
  };

  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const hoverEffect = branding.isCustom ? 'hover:opacity-90 hover:shadow-lg' : '';

  if (branding.isCustom) {
    return (
      <button 
        className={`${baseClasses} ${hoverEffect} ${className}`}
        style={getStyles()}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button 
      className={`${baseClasses} ${getStyles()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
