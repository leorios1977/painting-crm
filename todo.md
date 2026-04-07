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
