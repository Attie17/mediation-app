import React from 'react';
import { useBranding } from '../../context/BrandingContext';
import { Building2 } from 'lucide-react';

/**
 * OrganizationBrand
 * Displays organization logo and name with custom branding
 * Used in headers, footers, and navigation
 */
export default function OrganizationBrand({ 
  size = 'md', 
  showTagline = false,
  className = '' 
}) {
  const { branding, loading } = useBranding();

  if (loading) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="animate-pulse bg-slate-700 rounded h-8 w-32"></div>
      </div>
    );
  }

  const sizes = {
    sm: { logo: 'h-6 w-6', text: 'text-sm', tagline: 'text-xs' },
    md: { logo: 'h-8 w-8', text: 'text-base', tagline: 'text-sm' },
    lg: { logo: 'h-12 w-12', text: 'text-2xl', tagline: 'text-base' },
    xl: { logo: 'h-16 w-16', text: 'text-3xl', tagline: 'text-lg' }
  };

  const sizeClasses = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {branding.logoUrl ? (
        <img 
          src={branding.logoUrl} 
          alt={branding.displayName}
          className={`${sizeClasses.logo} object-contain`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      {/* Fallback icon if no logo */}
      <div 
        className={`${sizeClasses.logo} flex items-center justify-center rounded-lg ${branding.logoUrl ? 'hidden' : 'flex'}`}
        style={{ 
          backgroundColor: branding.primaryColor + '20',
          color: branding.primaryColor 
        }}
      >
        <Building2 className="w-1/2 h-1/2" />
      </div>

      <div className="flex flex-col">
        <h1 
          className={`font-bold ${sizeClasses.text}`}
          style={{ color: branding.isCustom ? branding.primaryColor : undefined }}
        >
          {branding.displayName}
        </h1>
        {showTagline && branding.tagline && (
          <p className={`text-slate-400 ${sizeClasses.tagline}`}>
            {branding.tagline}
          </p>
        )}
      </div>

      {branding.isCustom && (
        <div className="ml-2 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
          Custom
        </div>
      )}
    </div>
  );
}
