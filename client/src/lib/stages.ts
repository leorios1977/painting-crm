export type Stage = "lead" | "quoted" | "scheduled" | "in_progress" | "completed" | "paid";

export const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: "lead", label: "New Lead", color: "stage-lead" },
  { key: "quoted", label: "Quoted", color: "stage-quoted" },
  { key: "scheduled", label: "Scheduled", color: "stage-scheduled" },
  { key: "in_progress", label: "In Progress", color: "stage-in_progress" },
  { key: "completed", label: "Completed", color: "stage-completed" },
  { key: "paid", label: "Paid", color: "stage-paid" },
];

export const STAGE_LABELS: Record<Stage, string> = {
  lead: "New Lead",
  quoted: "Quoted",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  paid: "Paid",
};

export const PROJECT_TYPES = [
  "Interior Painting",
  "Exterior Painting",
  "Cabinet Painting",
  "Deck Staining",
  "Fence Painting",
  "Commercial Painting",
  "Pressure Washing",
  "Drywall Repair",
  "Other",
];

export const LEAD_SOURCES = [
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
];

export function formatCurrency(value: string | number | null | undefined): string {
  if (!value) return "$0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}
