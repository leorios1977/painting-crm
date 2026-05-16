/**
 * config.ts — Centralized frontend configuration
 *
 * All environment variables are read here and exported as a single typed
 * config object. No component or module should ever import from
 * `import.meta.env` directly — always import from this file instead.
 *
 * Frontend env vars must be prefixed with VITE_ to be exposed by Vite.
 * Backend-only secrets (STRIPE_SECRET_KEY, DATABASE_URL, etc.) are never
 * exposed here; they live exclusively in server/_core/env.ts.
 */

const config = {
  /**
   * Manus OAuth portal URL used to build the login redirect link.
   * Injected at build time via VITE_OAUTH_PORTAL_URL.
   */
  oauthPortalUrl: import.meta.env.VITE_OAUTH_PORTAL_URL as string ?? "",

  /**
   * Manus OAuth application ID.
   * Injected at build time via VITE_APP_ID.
   */
  appId: import.meta.env.VITE_APP_ID as string ?? "",

  /**
   * Manus Forge API key for frontend-accessible built-in APIs (maps proxy, etc.).
   * Injected at build time via VITE_FRONTEND_FORGE_API_KEY.
   */
  forgeApiKey: import.meta.env.VITE_FRONTEND_FORGE_API_KEY as string ?? "",

  /**
   * Manus Forge API base URL for frontend-accessible built-in APIs.
   * Falls back to the public Forge endpoint if not set.
   * Injected at build time via VITE_FRONTEND_FORGE_API_URL.
   */
  forgeApiUrl: (import.meta.env.VITE_FRONTEND_FORGE_API_URL as string) || "https://forge.butterfly-effect.dev",

  /**
   * Analytics endpoint for Umami page-view tracking.
   * Injected at build time via VITE_ANALYTICS_ENDPOINT.
   * Used in client/index.html directly via Vite HTML env replacement.
   */
  analyticsEndpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT as string ?? "",

  /**
   * Analytics website ID for Umami.
   * Injected at build time via VITE_ANALYTICS_WEBSITE_ID.
   * Used in client/index.html directly via Vite HTML env replacement.
   */
  analyticsWebsiteId: import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string ?? "",

  /**
   * Public-facing app URL (e.g. https://paintcrm-h9zwcmfu.manus.space).
   * Used for building absolute URLs in frontend code (share links, redirects).
   * Injected at build time via VITE_APP_URL.
   * Falls back to the current browser origin at runtime if not set.
   */
  appUrl: (import.meta.env.VITE_APP_URL as string) || (typeof window !== "undefined" ? window.location.origin : ""),

  /**
   * Stripe publishable key for frontend Stripe.js usage (e.g. custom payment forms).
   * NOTE: The secret key is NEVER exposed here — it lives in server/_core/env.ts only.
   * Injected at build time via VITE_STRIPE_PUBLISHABLE_KEY.
   */
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string ?? "",

  /**
   * App title shown in the browser tab and UI header.
   * Injected at build time via VITE_APP_TITLE.
   */
  appTitle: (import.meta.env.VITE_APP_TITLE as string) || "PaintersMax",

  /**
   * App logo URL shown in the sidebar.
   * Injected at build time via VITE_APP_LOGO.
   */
  appLogo: import.meta.env.VITE_APP_LOGO as string ?? "",
} as const;

export default config;
