export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import config from "./config";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = config.oauthPortalUrl || window.location.origin;
  const appId = config.appId;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch {
    // Fallback: return a safe relative path if URL construction fails
    return `${window.location.origin}/api/oauth/callback`;
  }
};
