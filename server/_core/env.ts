export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerName: process.env.OWNER_NAME ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "admin@paintpro.com",
  ownerPassword: process.env.OWNER_PASSWORD ?? "paintpro2026",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Stripe — secret key is backend-only, never exposed to the frontend
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  // Stripe webhook signing secret — used to verify incoming webhook payloads
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  // Twilio — for future SMS integration
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
  // App public URL — used for building absolute URLs in backend (webhooks, email links)
  appUrl: process.env.APP_URL ?? "",
};
