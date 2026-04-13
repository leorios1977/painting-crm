import { useIndustry } from "@/contexts/IndustryContext";
import { paintingConfig } from "@/config/industryConfig";

export type Stage = "lead" | "quoted" | "scheduled" | "in_progress" | "completed" | "paid";

/**
 * Static defaults — used outside React components (e.g. StageBadge utility).
 * These match the painting config exactly so nothing changes visually.
 */
export const STAGES: { key: Stage; label: string; color: string }[] =
  paintingConfig.pipelineStages.map((s) => ({
    key: s.id as Stage,
    label: s.label,
    color: s.color,
  }));

export const STAGE_LABELS: Record<Stage, string> = Object.fromEntries(
  paintingConfig.pipelineStages.map((s) => [s.id, s.label])
) as Record<Stage, string>;

export const PROJECT_TYPES = paintingConfig.projectTypes;

export const LEAD_SOURCES = paintingConfig.leadSources;

/**
 * React hook — returns industry-aware stages, project types, and lead sources.
 * Use this inside components for dynamic config.
 */
export function useIndustryStages() {
  const config = useIndustry();
  const stages: { key: Stage; label: string; color: string }[] =
    config.pipelineStages.map((s) => ({
      key: s.id as Stage,
      label: s.label,
      color: s.color,
    }));
  const stageLabels: Record<Stage, string> = Object.fromEntries(
    config.pipelineStages.map((s) => [s.id, s.label])
  ) as Record<Stage, string>;

  return {
    stages,
    stageLabels,
    projectTypes: config.projectTypes,
    leadSources: config.leadSources,
    projectTypeLabel: config.projectTypeLabel,
  };
}

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
