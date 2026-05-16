/**
 * BrandingContext — loads white-label branding settings on app startup and
 * exposes them to any component via useBranding().
 *
 * The getBranding procedure is public (no auth required) so the sidebar can
 * render the correct name/logo/colors before the user logs in.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export interface BrandingData {
  businessName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

const DEFAULT_BRANDING: BrandingData = {
  businessName: "PaintersMax",
  logoUrl: null,
  primaryColor: "#1e3a5f",
  secondaryColor: "#3b82f6",
};

interface BrandingContextValue {
  branding: BrandingData;
  isLoading: boolean;
  /** Call after saving branding in Settings to force a refresh */
  refetch: () => void;
}

const BrandingContext = createContext<BrandingContextValue>({
  branding: DEFAULT_BRANDING,
  isLoading: false,
  refetch: () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = trpc.settings.getBranding.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);

  useEffect(() => {
    if (data) {
      setBranding({
        businessName: data.businessName ?? DEFAULT_BRANDING.businessName,
        logoUrl: data.logoUrl ?? null,
        primaryColor: data.primaryColor ?? DEFAULT_BRANDING.primaryColor,
        secondaryColor: data.secondaryColor ?? DEFAULT_BRANDING.secondaryColor,
      });
    }
  }, [data]);

  // Apply CSS custom properties for primary/secondary colors globally
  useEffect(() => {
    const root = document.documentElement;
    // Convert hex to a format usable by Tailwind/CSS
    root.style.setProperty("--brand-primary", branding.primaryColor);
    root.style.setProperty("--brand-secondary", branding.secondaryColor);
  }, [branding.primaryColor, branding.secondaryColor]);

  // Update browser tab title
  useEffect(() => {
    document.title = branding.businessName;
  }, [branding.businessName]);

  return (
    <BrandingContext.Provider value={{ branding, isLoading, refetch }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextValue {
  return useContext(BrandingContext);
}
