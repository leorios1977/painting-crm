import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Settings, User } from "lucide-react";

export default function Docs() {
  return (
    <div className="space-y-5 pb-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          User guides and setup instructions for PaintersMax
        </p>
      </div>

      <Tabs defaultValue="customer">
        <TabsList>
          <TabsTrigger value="customer">
            <User className="h-4 w-4 mr-2" />
            Customer Guide
          </TabsTrigger>
          <TabsTrigger value="admin">
            <Settings className="h-4 w-4 mr-2" />
            Admin Setup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="mt-4">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Customer User Guide
                <Badge variant="secondary">v1.0</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-6">
              <section>
                <h2 className="text-lg font-bold">Getting Started</h2>
                <p className="text-muted-foreground">Welcome to PaintersMax — your painting business management hub. This guide walks you through the key features.</p>
              </section>

              <section>
                <h3 className="font-semibold text-base">1. Signing In</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>Navigate to the CRM URL provided by your administrator</li>
                  <li>Click <strong>Sign In</strong> on the login screen</li>
                  <li>Complete the OAuth authentication flow</li>
                  <li>You will be redirected to the Dashboard upon success</li>
                </ol>
              </section>

              <section>
                <h3 className="font-semibold text-base">2. Dashboard Overview</h3>
                <p className="text-sm text-muted-foreground">The Dashboard provides a real-time snapshot of your business:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li><strong>Total Leads</strong> — count of all active leads across all pipeline stages</li>
                  <li><strong>Pipeline Value</strong> — estimated revenue from all leads</li>
                  <li><strong>Revenue Collected</strong> — total from paid invoices</li>
                  <li><strong>Upcoming Jobs</strong> — jobs scheduled in the next 7 days</li>
                  <li><strong>Recent Activity</strong> — latest emails, calls, and notes</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base">3. Managing Leads</h3>
                <p className="text-sm text-muted-foreground">Navigate to <strong>Leads</strong> in the sidebar to view all customers.</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>Use the search bar to find leads by name, email, or phone</li>
                  <li>Filter by pipeline stage using the stage buttons</li>
                  <li>Click <strong>New Lead</strong> to add a customer</li>
                  <li>Click any row to open the full lead profile</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base">4. Lead Detail Page</h3>
                <p className="text-sm text-muted-foreground">Each lead has a dedicated profile page with:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li><strong>Contact Info</strong> — email, phone, and project address</li>
                  <li><strong>Stage Selector</strong> — move the lead through the pipeline</li>
                  <li><strong>Activity Tab</strong> — log calls, notes, and emails; view full history</li>
                  <li><strong>Files Tab</strong> — upload and download quotes, invoices, and photos</li>
                  <li><strong>Create Invoice</strong> — generate a Stripe payment link</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base">5. Pipeline Board</h3>
                <p className="text-sm text-muted-foreground">The <strong>Pipeline</strong> page shows a Kanban board with 6 stages:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li><strong>New Lead</strong> → <strong>Quoted</strong> → <strong>Scheduled</strong> → <strong>In Progress</strong> → <strong>Completed</strong> → <strong>Paid</strong></li>
                  <li>Drag and drop cards between columns to update the stage</li>
                  <li>Automation rules fire automatically when stages change</li>
                  <li>Click any card to open the lead detail</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base">6. Communication Log</h3>
                <p className="text-sm text-muted-foreground">The <strong>Communication Log</strong> shows all interactions across every lead:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>Search by subject or content</li>
                  <li>Filter by type: Email, Call, Note, SMS, or System</li>
                  <li>Click any entry to navigate to the associated lead</li>
                </ul>
              </section>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="mt-4">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Admin Owner Setup Guide
                <Badge variant="secondary">v1.0</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-6">
              <section>
                <h2 className="text-lg font-bold">Initial Setup</h2>
                <p className="text-muted-foreground text-sm">This guide covers the one-time setup steps for administrators deploying PaintersMax.</p>
              </section>

              <section>
                <h3 className="font-semibold text-base">1. Stripe Integration (Payments)</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>Log in to <a href="https://dashboard.stripe.com" className="text-primary underline" target="_blank">dashboard.stripe.com</a></li>
                  <li>Navigate to <strong>Developers → API Keys</strong></li>
                  <li>Copy your <strong>Secret Key</strong> (starts with <code>sk_live_</code> or <code>sk_test_</code>)</li>
                  <li>In the CRM Settings page, enter the key as <code>STRIPE_SECRET_KEY</code></li>
                  <li>Payment links will now be real Stripe checkout sessions</li>
                </ol>
              </section>

              <section>
                <h3 className="font-semibold text-base">2. Google Calendar Integration</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>Go to <a href="https://console.cloud.google.com" className="text-primary underline" target="_blank">Google Cloud Console</a></li>
                  <li>Create a project and enable the <strong>Google Calendar API</strong></li>
                  <li>Create OAuth 2.0 credentials and download the JSON</li>
                  <li>Add <code>GOOGLE_CALENDAR_ID</code> and <code>GOOGLE_SERVICE_ACCOUNT_KEY</code> to Settings</li>
                  <li>Scheduled jobs will now sync to Google Calendar automatically</li>
                </ol>
              </section>

              <section>
                <h3 className="font-semibold text-base">3. Managing Email Templates</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>Navigate to <strong>Email Automation → Templates</strong></li>
                  <li>Five default templates are pre-loaded (Welcome, Quote, Scheduled, Completion, Follow-up)</li>
                  <li>Click <strong>Edit</strong> on any template to open the WYSIWYG editor</li>
                  <li>Use variable placeholders like <code>{"{customer_name}"}</code> for dynamic content</li>
                  <li>Toggle templates on/off with the switch — disabled templates won't auto-send</li>
                </ol>
              </section>

              <section>
                <h3 className="font-semibold text-base">4. Automation Rules</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>Navigate to <strong>Email Automation → Automation Rules</strong></li>
                  <li>Default rules are created for each pipeline stage</li>
                  <li>Click <strong>New Rule</strong> to create custom triggers</li>
                  <li>Set a delay (in hours) to send emails after a stage change</li>
                  <li>Toggle rules on/off without deleting them</li>
                </ol>
              </section>

              <section>
                <h3 className="font-semibold text-base">5. Managing Staff Access</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>All users who sign in receive the <strong>user</strong> role by default</li>
                  <li>To promote a user to admin, update their <code>role</code> field to <code>admin</code> in the database</li>
                  <li>Admin users can access all leads, templates, and settings</li>
                  <li>Use the Database panel in the Management UI to manage roles</li>
                </ol>
              </section>

              <section>
                <h3 className="font-semibold text-base">6. Pipeline Stage Workflow</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>The recommended workflow for each lead:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li><strong>New Lead</strong> — Customer inquiry received; welcome email auto-sent</li>
                    <li><strong>Quoted</strong> — Quote prepared and sent; quote email auto-sent</li>
                    <li><strong>Scheduled</strong> — Job date confirmed; confirmation email + calendar invite sent</li>
                    <li><strong>In Progress</strong> — Work has started on-site</li>
                    <li><strong>Completed</strong> — Work finished; completion + payment email auto-sent</li>
                    <li><strong>Paid</strong> — Invoice paid; follow-up + review request email auto-sent</li>
                  </ol>
                </div>
              </section>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
