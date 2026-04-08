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
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  Star,
  ToggleLeft,
  ToggleRight,
  Palette,
  Upload,
  X,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useBranding } from "@/contexts/BrandingContext";

export default function Settings() {
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

  const [stripeKey, setStripeKey] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [reviewLink, setReviewLink] = useState("");
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [autoReviewEnabled, setAutoReviewEnabled] = useState<boolean | null>(null);

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

  function saveStripe() {
    if (!stripeKey.trim()) return;
    updateSettings.mutate({ stripeSecretKey: stripeKey });
    setStripeKey("");
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

  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Configure integrations and business information
        </p>
      </div>

      {/* Branding */}
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

          <Button
            size="sm"
            onClick={saveBranding}
            disabled={updateSettings.isPending}
          >
            Save Branding
          </Button>
        </CardContent>
      </Card>

      {/* Company Info */}
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
          <Button
            size="sm"
            onClick={saveCompany}
            disabled={updateSettings.isPending}
          >
            Save Business Info
          </Button>
        </CardContent>
      </Card>

      {/* Stripe */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            Stripe Payments
            {settings?.stripeEnabled ? (
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
            Add your Stripe secret key to enable real payment links and invoice generation.
            Get your key from{" "}
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Stripe Dashboard → API Keys
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Stripe Secret Key</Label>
            <Input
              type="password"
              placeholder="sk_live_... or sk_test_..."
              value={stripeKey}
              onChange={(e) => setStripeKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your key is stored securely and never exposed to the browser.
            </p>
          </div>
          <Button size="sm" onClick={saveStripe} disabled={!stripeKey || updateSettings.isPending}>
            Save Stripe Key
          </Button>
        </CardContent>
      </Card>

      {/* Google Review Automation */}
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

      {/* Google Calendar */}
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

      {/* Current Config Display */}
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
              <span className="text-muted-foreground">Stripe</span>
              <span className={settings.stripeEnabled ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                {settings.stripeEnabled ? "Enabled" : "Not configured"}
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
