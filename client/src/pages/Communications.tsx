import { trpc } from "@/lib/trpc";
import { formatDateTime } from "@/lib/stages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  MessageSquare,
  Phone,
  Search,
  X,
  FileText,
  Clock,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useIndustry } from "@/contexts/IndustryContext";

const TYPE_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  call: Phone,
  note: MessageSquare,
  sms: MessageSquare,
  system: Clock,
};

const TYPE_COLORS: Record<string, string> = {
  email: "bg-blue-50 text-blue-600",
  call: "bg-green-50 text-green-600",
  note: "bg-amber-50 text-amber-600",
  sms: "bg-violet-50 text-violet-600",
  system: "bg-slate-100 text-slate-500",
};

export default function Communications() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [, setLocation] = useLocation();
  const { customerTerminology, jobTerminology } = useIndustry();
  const utils = trpc.useUtils();

  // Mark all SMS conversations as read when this page mounts so the sidebar badge clears
  const markAllRead = trpc.sms.markAllRead.useMutation({
    onSuccess: () => {
      utils.sms.getUnreadCount.invalidate();
    },
  });
  useEffect(() => {
    markAllRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: logs, isLoading } = trpc.communications.list.useQuery(
    {
      type: typeFilter !== "all" ? (typeFilter as "email" | "call" | "note" | "sms" | "system") : undefined,
      search: search || undefined,
    }
  );

  const types = ["email", "call", "note", "sms", "system"];

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Communication Log</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          All emails, calls, notes, and system events across your leads
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={typeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("all")}
          >
            All
          </Button>
          {types.map((t) => (
            <Button
              key={t}
              variant={typeFilter === t ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(t)}
              className="capitalize"
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {logs && (
        <div className="flex gap-4 flex-wrap">
          {types.map((t) => {
            const count = logs.filter((l) => l.type === t).length;
            if (count === 0) return null;
            const Icon = TYPE_ICONS[t] || Clock;
            return (
              <div key={t} className="flex items-center gap-2 text-sm">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ${TYPE_COLORS[t]}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <span className="font-medium capitalize">{t}</span>
                <Badge variant="secondary" className="text-xs">{count}</Badge>
              </div>
            );
          })}
        </div>
      )}

      {/* Log List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : logs?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No communications found</p>
          <p className="text-sm mt-1">
            {search || typeFilter !== "all"
              ? "Try adjusting your filters"
              : "Communications will appear here as you work with leads"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs?.map((log) => {
            const Icon = TYPE_ICONS[log.type] || Clock;
            const colorClass = TYPE_COLORS[log.type] || TYPE_COLORS.system;
            return (
              <div
                key={log.id}
                className="flex gap-4 p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => setLocation(`/leads/${log.leadId}`)}
              >
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {log.subject && (
                          <p className="text-sm font-semibold truncate">{log.subject}</p>
                        )}
                        <Badge variant="outline" className="text-xs capitalize shrink-0">
                          {log.type}
                        </Badge>
                        {log.direction && log.direction !== "internal" && (
                          <Badge variant="secondary" className="text-xs capitalize shrink-0">
                            {log.direction}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <User className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-primary font-medium hover:underline">
                          {(log as { leadName?: string }).leadName || "Unknown"}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDateTime(log.sentAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2"
                     dangerouslySetInnerHTML={{
                       __html: log.content.replace(/<[^>]*>/g, " ").substring(0, 200),
                     }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
