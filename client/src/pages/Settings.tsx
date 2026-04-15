import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building2,
  Star,
  Palette,
  Upload,
  X,
  Loader2,
  Eye,
  EyeOff,
  BarChart3,
  Share2,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  MessageCircle,
  Music,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useBranding } from "@/contexts/BrandingContext";
import { useIndustry } from "@/contexts/IndustryContext";

export default function Settings() {
  const { jobTerminology, customerTerminology } = useIndustry();
  const { data: settings, refetch } = trpc.settings.get.useQuery();
  const { refetch: refetchBranding } = useBranding();

  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      refetch();
      refetchBranding();
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadLogo = trpc.settings.uploadLogo.useMutation({
    onSuccess: () => {
      refetch();
      refetchBranding();
      toast.success("Logo uploaded");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeLogo = trpc.settings.removeLogo.useMutation({
    onSuccess: () => {
      refetch();
      refetchBranding();
      toast.success("Logo removed");
    },
    onError: (e) => toast.error(e.message),
  });

  const testStripeConnection = trpc.settings.testStripeConnection.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message ?? "Stripe connection verified!");
        setStripeTestResult("success");
      } else {
        toast.error(data.error ?? "Stripe connection failed");
        setStripeTestResult("error");
      }
    },
    onError: (e) => {
      toast.error(e.message);
      setStripeTestResult("error");
    },
  });

  // General state
  const [calendarId, setCalendarId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [reviewLink, setReviewLink] = useState("");
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [autoReviewEnabled, setAutoReviewEnabled] = useState<boolean | null>(null);

  // Payment Settings state
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [stripeTestResult, setStripeTestResult] = useState<"success" | "error" | null>(null);

  // Branding state
  const [businessName, setBusinessName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setLogoPreview(base64);
      setLogoFile({ base64, mimeType: file.type, name: file.name });
    };
    reader.readAsDataURL(file);
  }

  function uploadLogoFile() {
    if (!logoFile) return;
    uploadLogo.mutate({
      base64Data: logoFile.base64,
      mimeType: logoFile.mimeType,
      originalName: logoFile.name,
    });
    setLogoPreview(null);
    setLogoFile(null);
  }

  function saveBranding() {
    updateSettings.mutate({
      businessName: businessName || undefined,
      primaryColor: primaryColor || undefined,
      secondaryColor: secondaryColor || undefined,
    });
  }

  function savePaymentSettings() {
    const update: { stripeSecretKey?: string; stripePublishableKey?: string } = {};
    if (stripeSecretKey.trim()) update.stripeSecretKey = stripeSecretKey.trim();
    if (stripePublishableKey.trim()) update.stripePublishableKey = stripePublishableKey.trim();
    if (!update.stripeSecretKey && !update.stripePublishableKey) return;
    updateSettings.mutate(update, {
      onSuccess: () => {
        setStripeSecretKey("");
        setStripePublishableKey("");
        setStripeTestResult(null);
      },
    });
  }

  function handleTestConnection() {
    const keyToTest = stripeSecretKey.trim() || "";
    if (!keyToTest) {
      toast.error("Enter a Stripe Secret Key to test");
      return;
    }
    setStripeTestResult(null);
    testStripeConnection.mutate({ secretKey: keyToTest });
  }

  function saveCalendar() {
    if (!calendarId.trim()) return;
    updateSettings.mutate({ googleCalendarId: calendarId });
    setCalendarId("");
  }

  function saveCompany() {
    updateSettings.mutate({
      companyName: companyName || undefined,
      companyEmail: companyEmail || undefined,
      reviewLink: reviewLink || undefined,
    });
  }

  function saveGoogleReview() {
    updateSettings.mutate({
      googleReviewLink: googleReviewLink || undefined,
    });
    setGoogleReviewLink("");
  }

  function toggleAutoReview(enabled: boolean) {
    setAutoReviewEnabled(enabled);
    updateSettings.mutate({ autoReviewEnabled: enabled });
  }

  // Analytics state
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");

  function saveAnalytics() {
    updateSettings.mutate({ googleAnalyticsId: googleAnalyticsId.trim() || null });
    setGoogleAnalyticsId("");
  }

  // Social Media state
  const [socialMediaEnabled, setSocialMediaEnabled] = useState<boolean | null>(null);
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  function saveSocialMedia() {
    updateSettings.mutate({
      facebookUrl: facebookUrl.trim() || undefined,
      instagramUrl: instagramUrl.trim() || undefined,
      whatsappNumber: whatsappNumber.trim() || undefined,
      twitterUrl: twitterUrl.trim() || undefined,
      youtubeUrl: youtubeUrl.trim() || undefined,
      tiktokUrl: tiktokUrl.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
    });
    setFacebookUrl(""); setInstagramUrl(""); setWhatsappNumber("");
    setTwitterUrl(""); setYoutubeUrl(""); setTiktokUrl(""); setLinkedinUrl("");
  }

  function togglePlatform(platform: string, enabled: boolean) {
    updateSettings.mutate({ [platform]: enabled } as Parameters<typeof updateSettings.mutate>[0]);
  }

  function toggleSocialMedia(enabled: boolean) {
    setSocialMediaEnabled(enabled);
    updateSettings.mutate({ socialMediaEnabled: enabled });
  }

  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Configure integrations and business information
        </p>
      </div>

      {/* ── Branding ─────────────────────────────────────────────────────────── */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" />
            White-Label Branding
          </CardTitle>
          <CardDescription>
            Customize the app name, logo, and colors. Changes apply immediately across the sidebar and browser tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Business Name */}
          <div className="space-y-1.5">
            <Label>Business Name</Label>
            <Input
              placeholder={settings?.businessName || "PaintPro CRM"}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Replaces "PaintPro CRM" in the sidebar and browser tab.</p>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {(logoPreview || settings?.logoUrl) && (
                <img
                  src={logoPreview ?? settings?.logoUrl ?? ""}
                  alt="Logo preview"
                  className="h-12 w-12 rounded-lg object-cover border"
                />
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadLogo.isPending}
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {logoPreview ? "Change" : "Upload Logo"}
                </Button>
                {logoPreview && (
                  <Button size="sm" onClick={uploadLogoFile} disabled={uploadLogo.isPending}>
                    Save Logo
                  </Button>
                )}
                {settings?.logoUrl && !logoPreview && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeLogo.mutate()}
                    disabled={removeLogo.isPending}
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Remove
                  </Button>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoSelect}
              />
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPG, SVG or WebP — max 2 MB. Displayed in the sidebar header.</p>
          </div>

          <Separator />

          {/* Color Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Primary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor || settings?.primaryColor || "#1e3a5f"}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-12 rounded border cursor-pointer p-0.5"
                />
                <Input
                  placeholder="#1e3a5f"
                  value={primaryColor || settings?.primaryColor || ""}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">Sidebar logo background and accent color.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Secondary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor || settings?.secondaryColor || "#3b82f6"}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-9 w-12 rounded border cursor-pointer p-0.5"
                />
                <Input
                  placeholder="#3b82f6"
                  value={secondaryColor || settings?.secondaryColor || ""}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">Button and link accent color.</p>
            </div>
          </div>

          <Button size="sm" onClick={saveBranding} disabled={updateSettings.isPending}>
            Save Branding
          </Button>
        </CardContent>
      </Card>

      {/* ── Company Info ─────────────────────────────────────────────────────── */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            Business Information
          </CardTitle>
          <CardDescription>
            Used in email templates as {"{company_name}"} and {"{review_link}"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input
                placeholder={settings?.companyName || "Your Painting Co."}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reply-To Email</Label>
              <Input
                type="email"
                placeholder={settings?.companyEmail || "hello@yourcompany.com"}
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Google Review Link</Label>
            <Input
              placeholder={settings?.reviewLink || "https://g.page/r/..."}
              value={reviewLink}
              onChange={(e) => setReviewLink(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={saveCompany} disabled={updateSettings.isPending}>
            Save Business Info
          </Button>
        </CardContent>
      </Card>

      {/* ── Payment Settings ─────────────────────────────────────────────────── */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            Payment Settings
            {settings?.stripeEnabled ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs ml-1">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs ml-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not configured
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Enter your Stripe API keys to enable real payment links and invoice generation. Get your keys from{" "}
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Stripe Dashboard → API Keys
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Publishable Key */}
          <div className="space-y-1.5">
            <Label>Stripe Publishable Key</Label>
            <Input
              placeholder={settings?.stripePublishableKey ? `${settings.stripePublishableKey.slice(0, 12)}...` : "pk_live_... or pk_test_..."}
              value={stripePublishableKey}
              onChange={(e) => setStripePublishableKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Starts with <code className="font-mono bg-muted px-1 rounded">pk_live_</code> or <code className="font-mono bg-muted px-1 rounded">pk_test_</code>. Safe to expose to the browser.
            </p>
          </div>

          {/* Secret Key */}
          <div className="space-y-1.5">
            <Label>Stripe Secret Key</Label>
            <div className="relative">
              <Input
                type={showSecretKey ? "text" : "password"}
                placeholder={settings?.stripeSecretKeySet ? "••••••••••••••••••••••••• (configured)" : "sk_live_... or sk_test_..."}
                value={stripeSecretKey}
                onChange={(e) => {
                  setStripeSecretKey(e.target.value);
                  setStripeTestResult(null);
                }}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Starts with <code className="font-mono bg-muted px-1 rounded">sk_live_</code> or <code className="font-mono bg-muted px-1 rounded">sk_test_</code>. Stored securely — never exposed to the browser.
            </p>
          </div>

          {/* Test Connection result banner */}
          {stripeTestResult === "success" && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Stripe connection verified — keys are valid.
            </div>
          )}
          {stripeTestResult === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Connection failed — check your secret key and try again.
            </div>
          )}

          <div className="flex gap-2">
            {/* Test Connection */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestConnection}
              disabled={!stripeSecretKey.trim() || testStripeConnection.isPending}
            >
              {testStripeConnection.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Test Connection
            </Button>

            {/* Save */}
            <Button
              size="sm"
              onClick={savePaymentSettings}
              disabled={(!stripeSecretKey.trim() && !stripePublishableKey.trim()) || updateSettings.isPending}
            >
              Save Payment Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Google Review Automation ─────────────────────────────────────────── */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4 text-amber-500" />
            Google Review Automation
            {settings?.googleReviewLink ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Link configured
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not configured
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Paste your Google Business review URL so customers can leave reviews with one click.
            Enable auto-requests to send an SMS 2 hours after a job is marked Completed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Google Review Link</Label>
            <Input
              placeholder={settings?.googleReviewLink || "https://g.page/r/..."}
              value={googleReviewLink}
              onChange={(e) => setGoogleReviewLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find this in Google Business Profile → Get more reviews → Share review form.
            </p>
          </div>
          <Button
            size="sm"
            onClick={saveGoogleReview}
            disabled={!googleReviewLink.trim() || updateSettings.isPending}
          >
            Save Review Link
          </Button>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Auto-request review when job is completed</Label>
              <p className="text-xs text-muted-foreground">
                Automatically sends a review request SMS 2 hours after a lead is moved to{" "}
                <span className="font-medium text-foreground">Completed</span>.
              </p>
            </div>
            <Switch
              checked={autoReviewEnabled !== null ? autoReviewEnabled : (settings?.autoReviewEnabled ?? false)}
              onCheckedChange={toggleAutoReview}
              disabled={updateSettings.isPending || !settings?.googleReviewLink}
            />
          </div>
          {!settings?.googleReviewLink && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Save a Google Review Link above to enable the auto-request toggle.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Google Calendar ──────────────────────────────────────────────────── */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Google Calendar
            {settings?.calendarEnabled ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not configured
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Sync scheduled jobs to Google Calendar and send calendar invites to customers.
            See the Admin Setup Guide in Documentation for full setup instructions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Google Calendar ID</Label>
            <Input
              placeholder="your-calendar@gmail.com or calendar ID"
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={saveCalendar} disabled={!calendarId || updateSettings.isPending}>
            Save Calendar ID
          </Button>
        </CardContent>
      </Card>

      {/* ── Google Analytics ─────────────────────────────────────────────────── */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Google Analytics
            {settings?.googleAnalyticsId ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Not configured</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Track website visitors and customer portal usage with Google Analytics 4.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Google Analytics Measurement ID</Label>
            <Input
              placeholder={settings?.googleAnalyticsId || "G-XXXXXXXXXX"}
              value={googleAnalyticsId}
              onChange={(e) => setGoogleAnalyticsId(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Find this in{" "}
              <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="underline text-primary">
                Google Analytics
              </a>{" "}
              → Admin → Data Streams → your stream → Measurement ID (starts with G-).
            </p>
          </div>
          {settings?.googleAnalyticsId && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Tracking active: <span className="font-mono font-medium">{settings.googleAnalyticsId}</span></span>
            </div>
          )}
          <Button
            size="sm"
            onClick={saveAnalytics}
            disabled={!googleAnalyticsId.trim() || updateSettings.isPending}
          >
            Save Measurement ID
          </Button>
          {settings?.googleAnalyticsId && (
            <Button
              size="sm"
              variant="outline"
              className="ml-2 text-destructive hover:text-destructive"
              onClick={() => updateSettings.mutate({ googleAnalyticsId: null })}
              disabled={updateSettings.isPending}
            >
              Remove
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Social Media ─────────────────────────────────────────────────────── */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-primary" />
            Social Media
          </CardTitle>
          <CardDescription>
            Add social media links that appear in the website footer and customer portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Show Social Media on Website</Label>
              <p className="text-xs text-muted-foreground">Display social links in the footer and customer portal.</p>
            </div>
            <Switch
              checked={socialMediaEnabled !== null ? socialMediaEnabled : (settings?.socialMediaEnabled ?? true)}
              onCheckedChange={toggleSocialMedia}
              disabled={updateSettings.isPending}
            />
          </div>

          <Separator />

          {/* Platform rows */}
          {([
            { key: "facebook", label: "Facebook", icon: <Facebook className="h-4 w-4" />, placeholder: "https://facebook.com/yourpage", urlState: facebookUrl, setUrl: setFacebookUrl, enabledKey: "facebookEnabled" },
            { key: "instagram", label: "Instagram", icon: <Instagram className="h-4 w-4" />, placeholder: "https://instagram.com/yourhandle", urlState: instagramUrl, setUrl: setInstagramUrl, enabledKey: "instagramEnabled" },
            { key: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="h-4 w-4" />, placeholder: "+1 555 000 0000", urlState: whatsappNumber, setUrl: setWhatsappNumber, enabledKey: "whatsappEnabled" },
            { key: "twitter", label: "X / Twitter", icon: <Twitter className="h-4 w-4" />, placeholder: "https://x.com/yourhandle", urlState: twitterUrl, setUrl: setTwitterUrl, enabledKey: "twitterEnabled" },
            { key: "youtube", label: "YouTube", icon: <Youtube className="h-4 w-4" />, placeholder: "https://youtube.com/@yourchannel", urlState: youtubeUrl, setUrl: setYoutubeUrl, enabledKey: "youtubeEnabled" },
            { key: "tiktok", label: "TikTok", icon: <Music className="h-4 w-4" />, placeholder: "https://tiktok.com/@yourhandle", urlState: tiktokUrl, setUrl: setTiktokUrl, enabledKey: "tiktokEnabled" },
            { key: "linkedin", label: "LinkedIn", icon: <Linkedin className="h-4 w-4" />, placeholder: "https://linkedin.com/company/yourco", urlState: linkedinUrl, setUrl: setLinkedinUrl, enabledKey: "linkedinEnabled" },
          ] as const).map(({ key, label, icon, placeholder, urlState, setUrl, enabledKey }) => {
            const currentUrl = (settings as Record<string, unknown>)?.[`${key === "whatsapp" ? "whatsapp" : key}${key === "whatsapp" ? "Number" : "Url"}`] as string | null;
            const isEnabled = (settings as Record<string, unknown>)?.[enabledKey] as boolean ?? true;
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="text-muted-foreground shrink-0">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-24 shrink-0">{label}</span>
                    <Input
                      placeholder={currentUrl || placeholder}
                      value={urlState}
                      onChange={(e) => setUrl(e.target.value)}
                      className="text-sm h-8"
                    />
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(v) => togglePlatform(enabledKey, v)}
                  disabled={updateSettings.isPending}
                />
              </div>
            );
          })}

          <Button
            size="sm"
            onClick={saveSocialMedia}
            disabled={updateSettings.isPending}
            className="mt-2"
          >
            Save Social Media Links
          </Button>
        </CardContent>
      </Card>

      {/* ── Current Config Display ───────────────────────────────────────────── */}
      {settings && (
        <Card className="border shadow-sm bg-muted/20">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground">Current Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Company Name</span>
              <span className="font-medium">{settings.companyName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Company Email</span>
              <span className="font-medium">{settings.companyEmail || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stripe Publishable Key</span>
              <span className="font-medium">
                {settings.stripePublishableKey
                  ? `${settings.stripePublishableKey.slice(0, 12)}...`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stripe Secret Key</span>
              <span className={settings.stripeSecretKeySet ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                {settings.stripeSecretKeySet ? "Configured ✓" : "Not configured"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Google Calendar</span>
              <span className={settings.calendarEnabled ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                {settings.calendarEnabled ? "Enabled" : "Not configured"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
