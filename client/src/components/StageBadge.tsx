import { STAGE_LABELS, type Stage } from "@/lib/stages";
import { cn } from "@/lib/utils";

interface StageBadgeProps {
  stage: Stage;
  className?: string;
  size?: "sm" | "md";
}

export function StageBadge({ stage, className, size = "md" }: StageBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        `stage-${stage}`,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}
