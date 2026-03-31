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
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { data: settings, refetch } = trpc.settings.get.useQuery();
  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const [stripeKey, setStripeKey] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [reviewLink, setReviewLink] = useState("");

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

  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Configure integrations and business information
        </p>
      </div>

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
