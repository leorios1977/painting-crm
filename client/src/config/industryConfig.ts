/**
 * industryConfig.ts — Industry-agnostic configuration definitions
 *
 * Each config defines terminology, pipeline stages, form fields, KPI labels,
 * and default email templates for a specific industry vertical.
 *
 * The "painting" config is the default and exactly matches all current
 * hardcoded values so nothing changes visually when applied.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PipelineStage {
  id: string;
  label: string;
  color: string; // Tailwind CSS class suffix, e.g. "stage-lead"
}

export interface LeadFormField {
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "number" | "select" | "textarea";
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select fields
}

export interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
}

export interface DashboardKPILabels {
  totalLeads: string;
  pipelineValue: string;
  revenueCollected: string;
  upcomingJobs: string;
  conversionRate: string;
}

export interface IndustryConfig {
  industryName: string;
  appTitle: string;
  primaryColor: string;

  // Terminology
  jobTerminology: string;         // "Job", "Case", "Appointment", "Visit", "Service Call"
  jobTerminologyPlural: string;   // "Jobs", "Cases", "Appointments", "Visits", "Service Calls"
  customerTerminology: string;    // "Customer", "Patient", "Client", "Resident"
  customerTerminologyPlural: string;
  teamTerminology: string;        // "Crew Member", "Technician", "Attorney", "Doctor", "Staff"
  teamTerminologyPlural: string;  // "Crew Members", "Technicians", "Attorneys", "Doctors", "Staff"
  teamGroupName: string;          // "Crew", "Team", "Staff", "Associates"
  revenueLabel: string;           // "Revenue Collected", "Fees Collected", "Payments Received"

  // Pipeline
  pipelineStages: PipelineStage[];

  // Lead form
  projectTypeLabel: string;       // "Project Type", "Service Type", "Case Type"
  projectTypes: string[];
  leadSources: string[];
  leadFormFields: LeadFormField[];

  // Dashboard
  dashboardKPILabels: DashboardKPILabels;

  // Email templates
  defaultEmailTemplates: EmailTemplate[];

  // Portal stage labels
  portalStages: { key: string; label: string }[];

  // AI assistant system prompt
  aiSystemPrompt: string;
  aiSuggestedPrompts: { label: string; prompt: string }[];

  // Blog / content marketing
  blogTagline: string;
  blogEmptyText: string;
  blogCTAText: string;
}

// ─── Painting (Default) ──────────────────────────────────────────────────────

export const paintingConfig: IndustryConfig = {
  industryName: "Painting",
  appTitle: "PaintPro CRM",
  primaryColor: "blue",

  jobTerminology: "Job",
  jobTerminologyPlural: "Jobs",
  customerTerminology: "Customer",
  customerTerminologyPlural: "Customers",
  teamTerminology: "Crew Member",
  teamTerminologyPlural: "Crew Members",
  teamGroupName: "Crew",
  revenueLabel: "Revenue Collected",

  pipelineStages: [
    { id: "lead", label: "New Lead", color: "stage-lead" },
    { id: "quoted", label: "Quoted", color: "stage-quoted" },
    { id: "scheduled", label: "Scheduled", color: "stage-scheduled" },
    { id: "in_progress", label: "In Progress", color: "stage-in_progress" },
    { id: "completed", label: "Completed", color: "stage-completed" },
    { id: "paid", label: "Paid", color: "stage-paid" },
  ],

  projectTypeLabel: "Project Type",
  projectTypes: [
    "Interior Painting",
    "Exterior Painting",
    "Cabinet Painting",
    "Deck Staining",
    "Fence Painting",
    "Commercial Painting",
    "Pressure Washing",
    "Drywall Repair",
    "Other",
  ],
  leadSources: [
    "Website",
    "Google",
    "Referral",
    "Social Media",
    "Door Hanger",
    "Yard Sign",
    "Yelp",
    "Angi",
    "HomeAdvisor",
    "Other",
  ],
  leadFormFields: [
    { name: "firstName", label: "First Name", type: "text", required: true, placeholder: "John" },
    { name: "lastName", label: "Last Name", type: "text", required: true, placeholder: "Smith" },
    { name: "email", label: "Email", type: "email", required: false, placeholder: "john@example.com" },
    { name: "phone", label: "Phone", type: "phone", required: false, placeholder: "(555) 000-0000" },
    { name: "projectType", label: "Project Type", type: "select", required: false, options: [] }, // uses projectTypes
    { name: "estimatedValue", label: "Estimated Value ($)", type: "number", required: false, placeholder: "2500" },
    { name: "projectAddress", label: "Project Address", type: "text", required: false, placeholder: "123 Main St, City, State" },
    { name: "projectDescription", label: "Project Description", type: "textarea", required: false, placeholder: "Describe the project..." },
    { name: "source", label: "Lead Source", type: "select", required: false, options: [] }, // uses leadSources
  ],

  dashboardKPILabels: {
    totalLeads: "Total Leads",
    pipelineValue: "Pipeline Value",
    revenueCollected: "Revenue Collected",
    upcomingJobs: "Upcoming Jobs",
    conversionRate: "Conversion Rate",
  },

  defaultEmailTemplates: [
    {
      name: "Welcome",
      subject: "Thanks for reaching out, {customer_name}!",
      body: "Hi {customer_name},\n\nThank you for contacting us about your painting project at {project_address}. We'd love to help!\n\nWe'll review your request and get back to you shortly with a free estimate.\n\nBest regards,\nYour Painting Team",
    },
    {
      name: "Quote Sent",
      subject: "Your painting estimate is ready, {customer_name}",
      body: "Hi {customer_name},\n\nWe've prepared an estimate for your {project_type} project at {project_address}.\n\nEstimated cost: {quote_amount}\n\nPlease let us know if you have any questions or would like to schedule the work.\n\nBest regards,\nYour Painting Team",
    },
    {
      name: "Job Scheduled",
      subject: "Your painting job is scheduled!",
      body: "Hi {customer_name},\n\nGreat news! Your {project_type} project has been scheduled.\n\nOur crew will arrive at {project_address} on the confirmed date. We'll send a reminder the day before.\n\nBest regards,\nYour Painting Team",
    },
    {
      name: "Job Complete",
      subject: "Your painting project is complete!",
      body: "Hi {customer_name},\n\nWe're happy to let you know that your {project_type} project at {project_address} is now complete!\n\nWe hope you love the results. If you have a moment, we'd really appreciate a review.\n\nThank you for choosing us!\n\nBest regards,\nYour Painting Team",
    },
    {
      name: "Follow-up",
      subject: "Just checking in, {customer_name}",
      body: "Hi {customer_name},\n\nWe wanted to follow up on your painting inquiry. Are you still interested in getting an estimate for your project at {project_address}?\n\nWe'd love to help — just reply to this email or give us a call.\n\nBest regards,\nYour Painting Team",
    },
  ],

  portalStages: [
    { key: "lead", label: "Inquiry Received" },
    { key: "quoted", label: "Quote Sent" },
    { key: "scheduled", label: "Job Scheduled" },
    { key: "in_progress", label: "Work In Progress" },
    { key: "completed", label: "Job Complete" },
    { key: "paid", label: "Payment Received" },
  ],

  aiSystemPrompt:
    "You are an expert business assistant for a professional painting company. " +
    "Help the owner with: writing customer follow-up messages and SMS scripts, " +
    "drafting professional estimate emails, pricing advice for different job types, " +
    "responding to negative reviews professionally, writing job completion thank-you messages, " +
    "creating social media captions about completed projects, and general business advice for " +
    "growing a painting company. Keep all responses practical, professional, and focused on the painting industry.",
  aiSuggestedPrompts: [
    { label: "Follow-up SMS", prompt: "Draft a follow-up SMS for a lead who hasn't responded in 3 days" },
    { label: "Estimate email", prompt: "Write a professional estimate email for an exterior repaint job" },
    { label: "Pricing advice", prompt: "What should I charge for a 2400 sqft interior paint job in Dallas?" },
    { label: "Review response", prompt: "Help me respond to a 3-star Google review" },
    { label: "Job completion thank-you", prompt: "Write a job completion thank-you message for a residential client" },
    { label: "Social media caption", prompt: "Create a social media caption for a before-and-after exterior project" },
  ],

  blogTagline: "Explore our latest painting projects, tips, and industry insights. See the transformations we deliver for our customers.",
  blogEmptyText: "Check back soon for project updates and painting tips.",
  blogCTAText: "Get a free estimate for your painting project. Our team delivers quality results every time.",
};

// ─── HVAC ─────────────────────────────────────────────────────────────────────

export const hvacConfig: IndustryConfig = {
  industryName: "HVAC",
  appTitle: "HVAC Pro CRM",
  primaryColor: "blue",

  jobTerminology: "Service Call",
  jobTerminologyPlural: "Service Calls",
  customerTerminology: "Customer",
  customerTerminologyPlural: "Customers",
  teamTerminology: "Technician",
  teamTerminologyPlural: "Technicians",
  teamGroupName: "Team",
  revenueLabel: "Revenue Collected",

  pipelineStages: [
    { id: "lead", label: "New Lead", color: "stage-lead" },
    { id: "quoted", label: "Quoted", color: "stage-quoted" },
    { id: "scheduled", label: "Scheduled", color: "stage-scheduled" },
    { id: "in_progress", label: "In Progress", color: "stage-in_progress" },
    { id: "completed", label: "Completed", color: "stage-completed" },
    { id: "paid", label: "Paid", color: "stage-paid" },
  ],

  projectTypeLabel: "Service Type",
  projectTypes: [
    "AC Repair",
    "AC Installation",
    "Furnace Repair",
    "Furnace Installation",
    "Duct Cleaning",
    "Maintenance Plan",
    "Heat Pump Service",
    "Thermostat Installation",
    "Other",
  ],
  leadSources: [
    "Website",
    "Google",
    "Referral",
    "Social Media",
    "Yelp",
    "Angi",
    "HomeAdvisor",
    "Other",
  ],
  leadFormFields: [
    { name: "firstName", label: "First Name", type: "text", required: true, placeholder: "John" },
    { name: "lastName", label: "Last Name", type: "text", required: true, placeholder: "Smith" },
    { name: "email", label: "Email", type: "email", required: false, placeholder: "john@example.com" },
    { name: "phone", label: "Phone", type: "phone", required: false, placeholder: "(555) 000-0000" },
    { name: "projectType", label: "Service Type", type: "select", required: false, options: [] },
    { name: "estimatedValue", label: "Estimated Value ($)", type: "number", required: false, placeholder: "1500" },
    { name: "projectAddress", label: "Service Address", type: "text", required: false, placeholder: "123 Main St, City, State" },
    { name: "projectDescription", label: "Issue Description", type: "textarea", required: false, placeholder: "Describe the issue..." },
    { name: "source", label: "Lead Source", type: "select", required: false, options: [] },
  ],

  dashboardKPILabels: {
    totalLeads: "Total Leads",
    pipelineValue: "Pipeline Value",
    revenueCollected: "Revenue Collected",
    upcomingJobs: "Upcoming Calls",
    conversionRate: "Conversion Rate",
  },

  defaultEmailTemplates: [
    {
      name: "Welcome",
      subject: "Thanks for reaching out, {customer_name}!",
      body: "Hi {customer_name},\n\nThank you for contacting us about your HVAC needs at {project_address}. We're here to help!\n\nWe'll review your request and get back to you shortly.\n\nBest regards,\nYour HVAC Team",
    },
    {
      name: "Quote Sent",
      subject: "Your HVAC service estimate is ready",
      body: "Hi {customer_name},\n\nWe've prepared an estimate for your {project_type} service at {project_address}.\n\nEstimated cost: {quote_amount}\n\nPlease let us know if you'd like to schedule the service.\n\nBest regards,\nYour HVAC Team",
    },
    {
      name: "Service Scheduled",
      subject: "Your HVAC service call is scheduled!",
      body: "Hi {customer_name},\n\nYour {project_type} service has been scheduled at {project_address}.\n\nOur technician will arrive on the confirmed date. We'll send a reminder beforehand.\n\nBest regards,\nYour HVAC Team",
    },
    {
      name: "Service Complete",
      subject: "Your HVAC service is complete!",
      body: "Hi {customer_name},\n\nYour {project_type} service at {project_address} is now complete!\n\nIf you have a moment, we'd appreciate a review.\n\nThank you for choosing us!\n\nBest regards,\nYour HVAC Team",
    },
    {
      name: "Follow-up",
      subject: "Just checking in, {customer_name}",
      body: "Hi {customer_name},\n\nWe wanted to follow up on your HVAC inquiry. Are you still interested in service at {project_address}?\n\nJust reply or give us a call.\n\nBest regards,\nYour HVAC Team",
    },
  ],

  portalStages: [
    { key: "lead", label: "Inquiry Received" },
    { key: "quoted", label: "Quote Sent" },
    { key: "scheduled", label: "Service Scheduled" },
    { key: "in_progress", label: "Work In Progress" },
    { key: "completed", label: "Service Complete" },
    { key: "paid", label: "Payment Received" },
  ],

  aiSystemPrompt:
    "You are an expert business assistant for a professional HVAC company. " +
    "Help the owner with: writing customer follow-up messages, drafting service estimates, " +
    "pricing advice for HVAC jobs, responding to reviews, and growing the business.",
  aiSuggestedPrompts: [
    { label: "Follow-up SMS", prompt: "Draft a follow-up SMS for a lead who hasn't responded in 3 days" },
    { label: "Estimate email", prompt: "Write a professional estimate email for an AC installation" },
    { label: "Pricing advice", prompt: "What should I charge for a full HVAC system replacement?" },
    { label: "Review response", prompt: "Help me respond to a 3-star Google review" },
    { label: "Service completion", prompt: "Write a service completion thank-you message" },
    { label: "Social media caption", prompt: "Create a social media caption for a new HVAC installation" },
  ],

  blogTagline: "Explore our latest HVAC projects, tips, and industry insights.",
  blogEmptyText: "Check back soon for HVAC tips and project updates.",
  blogCTAText: "Get a free estimate for your HVAC service. Our technicians deliver quality results every time.",
};

// ─── Dental ───────────────────────────────────────────────────────────────────

export const dentalConfig: IndustryConfig = {
  industryName: "Dental",
  appTitle: "DentalPro CRM",
  primaryColor: "teal",

  jobTerminology: "Appointment",
  jobTerminologyPlural: "Appointments",
  customerTerminology: "Patient",
  customerTerminologyPlural: "Patients",
  teamTerminology: "Doctor",
  teamTerminologyPlural: "Doctors",
  teamGroupName: "Staff",
  revenueLabel: "Fees Collected",

  pipelineStages: [
    { id: "lead", label: "New Inquiry", color: "stage-lead" },
    { id: "quoted", label: "Treatment Plan Sent", color: "stage-quoted" },
    { id: "scheduled", label: "Appointment Scheduled", color: "stage-scheduled" },
    { id: "in_progress", label: "In Treatment", color: "stage-in_progress" },
    { id: "completed", label: "Treatment Complete", color: "stage-completed" },
    { id: "paid", label: "Paid", color: "stage-paid" },
  ],

  projectTypeLabel: "Treatment Type",
  projectTypes: [
    "General Cleaning",
    "Teeth Whitening",
    "Root Canal",
    "Crown",
    "Filling",
    "Extraction",
    "Orthodontics",
    "Cosmetic Dentistry",
    "Other",
  ],
  leadSources: [
    "Website",
    "Google",
    "Referral",
    "Insurance Provider",
    "Social Media",
    "Yelp",
    "Other",
  ],
  leadFormFields: [
    { name: "firstName", label: "First Name", type: "text", required: true, placeholder: "Jane" },
    { name: "lastName", label: "Last Name", type: "text", required: true, placeholder: "Doe" },
    { name: "email", label: "Email", type: "email", required: false, placeholder: "jane@example.com" },
    { name: "phone", label: "Phone", type: "phone", required: false, placeholder: "(555) 000-0000" },
    { name: "projectType", label: "Treatment Type", type: "select", required: false, options: [] },
    { name: "estimatedValue", label: "Estimated Fee ($)", type: "number", required: false, placeholder: "500" },
    { name: "projectAddress", label: "Patient Address", type: "text", required: false, placeholder: "123 Main St, City, State" },
    { name: "projectDescription", label: "Notes", type: "textarea", required: false, placeholder: "Describe the patient's needs..." },
    { name: "source", label: "Referral Source", type: "select", required: false, options: [] },
  ],

  dashboardKPILabels: {
    totalLeads: "Total Patients",
    pipelineValue: "Pipeline Value",
    revenueCollected: "Fees Collected",
    upcomingJobs: "Upcoming Appointments",
    conversionRate: "Conversion Rate",
  },

  defaultEmailTemplates: [
    {
      name: "Welcome",
      subject: "Welcome to our practice, {customer_name}!",
      body: "Hi {customer_name},\n\nThank you for choosing our dental practice. We look forward to providing you with excellent care.\n\nWe'll be in touch shortly to schedule your appointment.\n\nBest regards,\nYour Dental Team",
    },
    {
      name: "Treatment Plan",
      subject: "Your treatment plan is ready, {customer_name}",
      body: "Hi {customer_name},\n\nWe've prepared a treatment plan for your {project_type}.\n\nEstimated fee: {quote_amount}\n\nPlease let us know if you have questions or would like to schedule.\n\nBest regards,\nYour Dental Team",
    },
    {
      name: "Appointment Reminder",
      subject: "Your dental appointment is coming up!",
      body: "Hi {customer_name},\n\nThis is a reminder that your {project_type} appointment is scheduled soon.\n\nPlease arrive 15 minutes early. We look forward to seeing you!\n\nBest regards,\nYour Dental Team",
    },
    {
      name: "Treatment Complete",
      subject: "Your treatment is complete!",
      body: "Hi {customer_name},\n\nYour {project_type} treatment is now complete. We hope you're feeling great!\n\nIf you have a moment, we'd appreciate a review.\n\nBest regards,\nYour Dental Team",
    },
    {
      name: "Follow-up",
      subject: "Just checking in, {customer_name}",
      body: "Hi {customer_name},\n\nWe wanted to follow up on your dental inquiry. Are you still interested in scheduling?\n\nJust reply or give us a call.\n\nBest regards,\nYour Dental Team",
    },
  ],

  portalStages: [
    { key: "lead", label: "Inquiry Received" },
    { key: "quoted", label: "Treatment Plan Sent" },
    { key: "scheduled", label: "Appointment Scheduled" },
    { key: "in_progress", label: "In Treatment" },
    { key: "completed", label: "Treatment Complete" },
    { key: "paid", label: "Payment Received" },
  ],

  aiSystemPrompt:
    "You are an expert business assistant for a dental practice. " +
    "Help the owner with: patient follow-up messages, treatment plan emails, " +
    "pricing advice, responding to reviews, and growing the practice.",
  aiSuggestedPrompts: [
    { label: "Follow-up SMS", prompt: "Draft a follow-up SMS for a patient who hasn't scheduled in 3 days" },
    { label: "Treatment plan email", prompt: "Write a professional treatment plan email for a crown procedure" },
    { label: "Pricing advice", prompt: "What should I charge for a teeth whitening session?" },
    { label: "Review response", prompt: "Help me respond to a 3-star Google review" },
    { label: "Post-treatment message", prompt: "Write a post-treatment thank-you message for a patient" },
    { label: "Social media caption", prompt: "Create a social media caption for a smile transformation" },
  ],

  blogTagline: "Explore our latest dental tips, patient stories, and practice insights.",
  blogEmptyText: "Check back soon for dental health tips and updates.",
  blogCTAText: "Schedule your appointment today. Our team provides gentle, quality dental care.",
};

// ─── Legal ────────────────────────────────────────────────────────────────────

export const legalConfig: IndustryConfig = {
  industryName: "Legal",
  appTitle: "LegalPro CRM",
  primaryColor: "slate",

  jobTerminology: "Case",
  jobTerminologyPlural: "Cases",
  customerTerminology: "Client",
  customerTerminologyPlural: "Clients",
  teamTerminology: "Attorney",
  teamTerminologyPlural: "Attorneys",
  teamGroupName: "Associates",
  revenueLabel: "Fees Collected",

  pipelineStages: [
    { id: "lead", label: "New Inquiry", color: "stage-lead" },
    { id: "quoted", label: "Consultation Scheduled", color: "stage-quoted" },
    { id: "scheduled", label: "Retained", color: "stage-scheduled" },
    { id: "in_progress", label: "Active Case", color: "stage-in_progress" },
    { id: "completed", label: "Case Closed", color: "stage-completed" },
    { id: "paid", label: "Paid", color: "stage-paid" },
  ],

  projectTypeLabel: "Case Type",
  projectTypes: [
    "Personal Injury",
    "Family Law",
    "Criminal Defense",
    "Estate Planning",
    "Business Law",
    "Real Estate",
    "Immigration",
    "Employment Law",
    "Other",
  ],
  leadSources: [
    "Website",
    "Google",
    "Referral",
    "Bar Association",
    "Social Media",
    "Avvo",
    "Other",
  ],
  leadFormFields: [
    { name: "firstName", label: "First Name", type: "text", required: true, placeholder: "John" },
    { name: "lastName", label: "Last Name", type: "text", required: true, placeholder: "Smith" },
    { name: "email", label: "Email", type: "email", required: false, placeholder: "john@example.com" },
    { name: "phone", label: "Phone", type: "phone", required: false, placeholder: "(555) 000-0000" },
    { name: "projectType", label: "Case Type", type: "select", required: false, options: [] },
    { name: "estimatedValue", label: "Estimated Fee ($)", type: "number", required: false, placeholder: "5000" },
    { name: "projectAddress", label: "Client Address", type: "text", required: false, placeholder: "123 Main St, City, State" },
    { name: "projectDescription", label: "Case Description", type: "textarea", required: false, placeholder: "Describe the case..." },
    { name: "source", label: "Referral Source", type: "select", required: false, options: [] },
  ],

  dashboardKPILabels: {
    totalLeads: "Total Clients",
    pipelineValue: "Pipeline Value",
    revenueCollected: "Fees Collected",
    upcomingJobs: "Upcoming Consultations",
    conversionRate: "Retention Rate",
  },

  defaultEmailTemplates: [
    {
      name: "Welcome",
      subject: "Thank you for contacting us, {customer_name}",
      body: "Dear {customer_name},\n\nThank you for reaching out to our firm. We take every inquiry seriously.\n\nWe'll review your case and contact you shortly to schedule a consultation.\n\nBest regards,\nYour Legal Team",
    },
    {
      name: "Consultation Scheduled",
      subject: "Your consultation is confirmed, {customer_name}",
      body: "Dear {customer_name},\n\nYour consultation regarding your {project_type} matter has been scheduled.\n\nPlease bring any relevant documents to the meeting.\n\nBest regards,\nYour Legal Team",
    },
    {
      name: "Case Update",
      subject: "Update on your case, {customer_name}",
      body: "Dear {customer_name},\n\nWe wanted to provide an update on your {project_type} case.\n\nPlease don't hesitate to reach out with any questions.\n\nBest regards,\nYour Legal Team",
    },
    {
      name: "Case Closed",
      subject: "Your case has been resolved",
      body: "Dear {customer_name},\n\nWe're pleased to inform you that your {project_type} case has been resolved.\n\nThank you for trusting us with your legal matter.\n\nBest regards,\nYour Legal Team",
    },
    {
      name: "Follow-up",
      subject: "Following up on your inquiry, {customer_name}",
      body: "Dear {customer_name},\n\nWe wanted to follow up on your legal inquiry. Are you still interested in scheduling a consultation?\n\nPlease reply or call us at your convenience.\n\nBest regards,\nYour Legal Team",
    },
  ],

  portalStages: [
    { key: "lead", label: "Inquiry Received" },
    { key: "quoted", label: "Consultation Scheduled" },
    { key: "scheduled", label: "Retained" },
    { key: "in_progress", label: "Active Case" },
    { key: "completed", label: "Case Closed" },
    { key: "paid", label: "Payment Received" },
  ],

  aiSystemPrompt:
    "You are an expert business assistant for a law firm. " +
    "Help the attorney with: client follow-up messages, consultation scheduling emails, " +
    "fee structure advice, responding to reviews, and growing the practice.",
  aiSuggestedPrompts: [
    { label: "Follow-up SMS", prompt: "Draft a follow-up SMS for a potential client who hasn't responded in 3 days" },
    { label: "Consultation email", prompt: "Write a professional consultation confirmation email" },
    { label: "Fee advice", prompt: "What should I charge for a standard estate planning package?" },
    { label: "Review response", prompt: "Help me respond to a 3-star Google review" },
    { label: "Case closure message", prompt: "Write a case closure thank-you message for a client" },
    { label: "Social media caption", prompt: "Create a social media caption about a successful case outcome" },
  ],

  blogTagline: "Explore our latest legal insights, case studies, and firm updates.",
  blogEmptyText: "Check back soon for legal tips and firm updates.",
  blogCTAText: "Schedule a free consultation. Our attorneys are here to help with your legal needs.",
};

// ─── Cleaning ─────────────────────────────────────────────────────────────────

export const cleaningConfig: IndustryConfig = {
  industryName: "Cleaning",
  appTitle: "CleanPro CRM",
  primaryColor: "emerald",

  jobTerminology: "Job",
  jobTerminologyPlural: "Jobs",
  customerTerminology: "Customer",
  customerTerminologyPlural: "Customers",
  teamTerminology: "Staff Member",
  teamTerminologyPlural: "Staff Members",
  teamGroupName: "Staff",
  revenueLabel: "Revenue Collected",

  pipelineStages: [
    { id: "lead", label: "New Lead", color: "stage-lead" },
    { id: "quoted", label: "Quoted", color: "stage-quoted" },
    { id: "scheduled", label: "Scheduled", color: "stage-scheduled" },
    { id: "in_progress", label: "In Progress", color: "stage-in_progress" },
    { id: "completed", label: "Completed", color: "stage-completed" },
    { id: "paid", label: "Paid", color: "stage-paid" },
  ],

  projectTypeLabel: "Service Type",
  projectTypes: [
    "Residential Cleaning",
    "Commercial Cleaning",
    "Deep Cleaning",
    "Move-In/Move-Out",
    "Post-Construction",
    "Carpet Cleaning",
    "Window Cleaning",
    "Office Cleaning",
    "Other",
  ],
  leadSources: [
    "Website",
    "Google",
    "Referral",
    "Social Media",
    "Yelp",
    "Nextdoor",
    "Thumbtack",
    "Other",
  ],
  leadFormFields: [
    { name: "firstName", label: "First Name", type: "text", required: true, placeholder: "John" },
    { name: "lastName", label: "Last Name", type: "text", required: true, placeholder: "Smith" },
    { name: "email", label: "Email", type: "email", required: false, placeholder: "john@example.com" },
    { name: "phone", label: "Phone", type: "phone", required: false, placeholder: "(555) 000-0000" },
    { name: "projectType", label: "Service Type", type: "select", required: false, options: [] },
    { name: "estimatedValue", label: "Estimated Value ($)", type: "number", required: false, placeholder: "200" },
    { name: "projectAddress", label: "Service Address", type: "text", required: false, placeholder: "123 Main St, City, State" },
    { name: "projectDescription", label: "Service Details", type: "textarea", required: false, placeholder: "Describe the cleaning needed..." },
    { name: "source", label: "Lead Source", type: "select", required: false, options: [] },
  ],

  dashboardKPILabels: {
    totalLeads: "Total Leads",
    pipelineValue: "Pipeline Value",
    revenueCollected: "Revenue Collected",
    upcomingJobs: "Upcoming Jobs",
    conversionRate: "Conversion Rate",
  },

  defaultEmailTemplates: [
    {
      name: "Welcome",
      subject: "Thanks for reaching out, {customer_name}!",
      body: "Hi {customer_name},\n\nThank you for contacting us about cleaning services at {project_address}. We'd love to help!\n\nWe'll review your request and get back to you shortly.\n\nBest regards,\nYour Cleaning Team",
    },
    {
      name: "Quote Sent",
      subject: "Your cleaning estimate is ready",
      body: "Hi {customer_name},\n\nWe've prepared an estimate for your {project_type} service at {project_address}.\n\nEstimated cost: {quote_amount}\n\nPlease let us know if you'd like to schedule.\n\nBest regards,\nYour Cleaning Team",
    },
    {
      name: "Job Scheduled",
      subject: "Your cleaning service is scheduled!",
      body: "Hi {customer_name},\n\nYour {project_type} service has been scheduled at {project_address}.\n\nOur team will arrive on the confirmed date.\n\nBest regards,\nYour Cleaning Team",
    },
    {
      name: "Job Complete",
      subject: "Your cleaning is complete!",
      body: "Hi {customer_name},\n\nYour {project_type} service at {project_address} is now complete!\n\nWe hope everything looks spotless. If you have a moment, we'd appreciate a review.\n\nBest regards,\nYour Cleaning Team",
    },
    {
      name: "Follow-up",
      subject: "Just checking in, {customer_name}",
      body: "Hi {customer_name},\n\nWe wanted to follow up on your cleaning inquiry. Are you still interested in service at {project_address}?\n\nJust reply or give us a call.\n\nBest regards,\nYour Cleaning Team",
    },
  ],

  portalStages: [
    { key: "lead", label: "Inquiry Received" },
    { key: "quoted", label: "Quote Sent" },
    { key: "scheduled", label: "Service Scheduled" },
    { key: "in_progress", label: "Cleaning In Progress" },
    { key: "completed", label: "Service Complete" },
    { key: "paid", label: "Payment Received" },
  ],

  aiSystemPrompt:
    "You are an expert business assistant for a professional cleaning company. " +
    "Help the owner with: customer follow-up messages, estimate emails, " +
    "pricing advice for cleaning jobs, responding to reviews, and growing the business.",
  aiSuggestedPrompts: [
    { label: "Follow-up SMS", prompt: "Draft a follow-up SMS for a lead who hasn't responded in 3 days" },
    { label: "Estimate email", prompt: "Write a professional estimate email for a deep cleaning job" },
    { label: "Pricing advice", prompt: "What should I charge for a 3-bedroom house deep clean?" },
    { label: "Review response", prompt: "Help me respond to a 3-star Google review" },
    { label: "Job completion", prompt: "Write a job completion thank-you message" },
    { label: "Social media caption", prompt: "Create a social media caption for a before-and-after cleaning" },
  ],

  blogTagline: "Explore our latest cleaning tips, project showcases, and industry insights.",
  blogEmptyText: "Check back soon for cleaning tips and project updates.",
  blogCTAText: "Get a free estimate for your cleaning service. Our team delivers spotless results every time.",
};

// ─── Config registry ──────────────────────────────────────────────────────────

export const industryConfigs: Record<string, IndustryConfig> = {
  painting: paintingConfig,
  hvac: hvacConfig,
  dental: dentalConfig,
  legal: legalConfig,
  cleaning: cleaningConfig,
};

export const defaultIndustryConfig = paintingConfig;
