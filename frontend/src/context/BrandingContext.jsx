import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/apiClient';

const BrandingContext = createContext();

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return context;
}

/**
 * BrandingProvider
 * Loads and provides organization-specific branding throughout the app
 * 
 * Branding is determined by:
 * 1. User's organization_id (for mediators)
 * 2. Case's organization_id (for divorcees)
 * 3. Custom domain (for white-label portals)
 * 4. Falls back to default app branding
 */
export function BrandingProvider({ children }) {
  const { user } = useAuth();
  const [branding, setBranding] = useState(getDefaultBranding());
  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState(null);

  useEffect(() => {
    loadBranding();
  }, [user]);

  const loadBranding = async () => {
    if (!user) {
      setBranding(getDefaultBranding());
      return;
    }

    try {
      setLoading(true);

      // Determine which organization's branding to load
      let orgId = null;

      // Mediators: Use their organization_id
      if (user.role === 'mediator' && user.organization_id) {
        orgId = user.organization_id;
      }

      // Divorcees: Load from their active case's organization
      if (user.role === 'divorcee') {
        try {
          const caseData = await apiFetch('/api/cases/my-case');
          if (caseData.case?.organization_id) {
            orgId = caseData.case.organization_id;
          }
        } catch (err) {
          console.warn('Could not load case organization:', err);
        }
      }

      // Lawyers: Could load from case organization similar to divorcees
      if (user.role === 'lawyer') {
        // TODO: Implement lawyer case lookup
      }

      if (orgId) {
        setOrganizationId(orgId);
        const orgData = await apiFetch(`/api/organizations/${orgId}/branding`);
        if (orgData.branding) {
          setBranding({
            ...getDefaultBranding(),
            ...orgData.branding,
            isCustom: true
          });
          applyBrandingToDOM(orgData.branding);
        }
      } else {
        setBranding(getDefaultBranding());
      }
    } catch (err) {
      console.error('Error loading branding:', err);
      setBranding(getDefaultBranding());
    } finally {
      setLoading(false);
    }
  };

  return (
    <BrandingContext.Provider value={{ branding, loading, organizationId, reload: loadBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

/**
 * Get default app branding
 */
function getDefaultBranding() {
  return {
    organizationName: 'Mediation Platform',
    displayName: 'Divorce Mediation Services',
    tagline: 'Professional Mediation for Family Matters',
    primaryColor: '#3b82f6', // Blue
    secondaryColor: '#10b981', // Green
    logoUrl: null,
    website: null,
    email: 'support@mediation.com',
    phone: null,
    isCustom: false
  };
}

/**
 * Apply branding colors to DOM via CSS variables
 */
function applyBrandingToDOM(branding) {
  if (!branding) return;

  const root = document.documentElement;
  
  if (branding.primaryColor) {
    root.style.setProperty('--brand-primary', branding.primaryColor);
  }
  
  if (branding.secondaryColor) {
    root.style.setProperty('--brand-secondary', branding.secondaryColor);
  }
}
