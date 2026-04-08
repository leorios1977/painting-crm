# Painting CRM - Project TODO

## Phase 1: Foundation
- [x] Design system tokens (white/slate/blue theme)
- [x] Install required packages (dnd-kit, tiptap, stripe)
- [x] Global CSS variables and typography

## Phase 2: Database Schema
- [x] leads table (contact info, project type, budget, status, pipeline stage)
- [x] email_templates table (name, subject, body, trigger, variables)
- [x] automation_rules table (trigger type, stage, template, delay)
- [x] communication_log table (type, content, timestamps, lead FK)
- [x] attachments table (file url, name, type, lead FK)
- [x] app_settings table (company info, Stripe key, Google Calendar ID)
- [x] Run migrations

## Phase 3: Backend API
- [x] leads CRUD router
- [x] pipeline stage update router (with automation trigger)
- [x] email_templates CRUD router
- [x] automation_rules CRUD router
- [x] communication_log router (list, create, search)
- [x] dashboard stats router (revenue, pipeline counts, upcoming jobs)
- [x] attachments router (upload, list, delete)
- [x] settings router (company info, Stripe, Calendar)
- [x] stripe router (payment link generation, mark paid)

## Phase 4: Admin Dashboard
- [x] DashboardLayout with sidebar navigation
- [x] Dashboard overview page (revenue metrics, pipeline summary, upcoming jobs, activity feed)
- [x] Navigation: Dashboard, Pipeline, Leads, Email Automation, Communication Log, Docs, Settings

## Phase 5: Kanban Pipeline
- [x] Draggable Kanban board (Lead → Quoted → Scheduled → In Progress → Completed → Paid)
- [x] Lead cards (name, project type, value, last contact)
- [x] Drag-and-drop stage changes with automation triggers
- [x] Click card to navigate to lead detail

## Phase 6: Lead Management
- [x] Leads list page with search and filters
- [x] Lead detail page (profile, project details, notes, attachments)
- [x] Create lead form
- [x] File attachment upload (quotes, invoices)
- [x] Contact history timeline
- [x] Stage selector on lead detail

## Phase 7: Email Automation
- [x] Email Automation Center page
- [x] Automation rules list and create form
- [x] WYSIWYG email template editor (TipTap)
- [x] Variable placeholder support ({customer_name}, {project_address}, {quote_amount})
- [x] Template preview modal
- [x] Pre-loaded default templates (Welcome, Quote, Scheduled, Completion, Follow-up)

## Phase 8: Communication Log
- [x] Communication log list page
- [x] Search by subject or content
- [x] Filter by type (email, call, note, sms, system)
- [x] Add manual note/call log entry from lead detail

## Phase 9: Integrations
- [x] Stripe payment link generation (real + mock fallback)
- [x] Mark paid mutation (manual payment confirmation)
- [x] Settings page for Stripe key and Google Calendar ID
- [ ] Stripe webhook for automatic payment status updates (requires public URL)
- [ ] Google Calendar event creation (requires service account key)

## Phase 10: UI Polish
- [x] White/slate/blue color scheme
- [x] Mobile-responsive navigation (DashboardLayout)
- [x] Status badges with color coding (StageBadge)
- [x] Loading skeletons and empty states
- [x] Toast notifications for actions
- [x] Plus Jakarta Sans + Inter typography

## Phase 11: Tests & Documentation
- [x] Vitest tests for core routers (19 tests passing)
- [x] Documentation page (Customer Guide + Admin Setup Guide)
- [x] Final checkpoint

## Phase 12: Environment Variable Audit & Centralization
- [x] Audit all hardcoded URLs and credentials in frontend and backend
- [x] Create client/src/config.ts as single source of truth for all frontend env vars
- [x] Replace all import.meta.env references in frontend with config.ts imports
- [x] Audit backend for hardcoded URLs/credentials and ensure process.env usage via ENV object
- [x] Add STRIPE_SECRET_KEY, TWILIO_*, APP_URL to server/_core/env.ts ENV object
- [x] Update stripe router to use ENV.stripeSecretKey instead of direct process.env
- [x] Create env.example listing every required environment variable
- [x] Run tests and save checkpoint

## Phase 13: Twilio SMS Integration
- [x] Add conversations table to drizzle/schema.ts
- [x] Generate and apply migration for conversations table
- [x] Create server/services/sms.ts with sendSMS(to, message, tenantId)
- [x] Add sms tRPC router (list conversations, send SMS mutation, status check)
- [x] Add POST /webhook/sms inbound Twilio webhook Express route with signature validation
- [x] Create client/src/components/SMS.tsx chat-style thread UI
- [x] Add SMS tab to LeadDetail.tsx
- [x] Write Vitest tests for SMS router (6 tests passing)
- [x] Save checkpoint

## Phase 14: Scheduling System
- [x] Add appointments table to drizzle/schema.ts
- [x] Generate and apply migration for appointments table
- [x] Create server/services/schedule.ts (createAppointment, updateAppointment, cancelAppointment)
- [x] Create server/routers/appointments.ts tRPC router
- [x] Register appointments router in server/routers.ts
- [x] Create client/src/pages/Schedule.tsx weekly calendar view
- [x] Add Schedule route to App.tsx and sidebar nav
- [x] Add Book Appointment modal to LeadDetail.tsx
- [x] Auto-trigger confirmation SMS + email on booking
- [x] Write Vitest tests for appointments router (8 tests)
- [x] Save checkpoint

## Phase 15: Invoicing System
- [x] Add invoices table to drizzle/schema.ts
- [x] Generate and apply migration for invoices table
- [x] Create server/services/invoices.ts (generateInvoice, sendInvoice, markPaid)
- [x] Create server/routers/invoices.ts tRPC router
- [x] Register invoices router in server/routers.ts
- [x] Create client/src/pages/Invoices.tsx with status badges and revenue summary cards
- [x] Add Invoices route to App.tsx and sidebar nav
- [x] Add Create Invoice line-item builder modal to LeadDetail.tsx
- [x] Stripe payment link generation on send (real + mock fallback)
- [x] SMS delivery of payment link on send
- [x] Write Vitest tests for invoices router (6 tests)
- [x] Save checkpoint

## Phase 16: Customer-Facing Portal
- [x] Add portal_token and portal_photos columns to leads table in schema.ts
- [x] Generate and apply migration for portal columns
- [x] Create server/services/portal.ts (generatePortalToken, buildPortalUrl, getPortalData, addPortalPhoto, removePortalPhoto)
- [x] Create server/routers/portal.ts public tRPC router
- [x] Register portal router in server/routers.ts
- [x] Build client/src/pages/CustomerPortal.tsx (progress tracker, invoice, appointment, photo gallery)
- [x] Register /portal/:token route in App.tsx outside DashboardLayout
- [x] Update invoices.ts to include portal link in SMS on send
- [x] Add Copy Portal Link button to LeadDetail.tsx
- [x] Write Vitest tests for portal router (8 tests)
- [x] Save checkpoint
