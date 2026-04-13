/**
 * IndustryContext.tsx — Provides the active industry configuration to all components.
 *
 * Wrap the app with <IndustryProvider config={...}> and consume with useIndustry().
 */

import { createContext, useContext, type ReactNode } from "react";
import { type IndustryConfig, defaultIndustryConfig } from "@/config/industryConfig";

const IndustryContext = createContext<IndustryConfig>(defaultIndustryConfig);

export function IndustryProvider({
  config,
  children,
}: {
  config: IndustryConfig;
  children: ReactNode;
}) {
  return (
    <IndustryContext.Provider value={config}>
      {children}
    </IndustryContext.Provider>
  );
}

export function useIndustry(): IndustryConfig {
  return useContext(IndustryContext);
}
