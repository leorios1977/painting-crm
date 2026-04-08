/**
 * Schedule.tsx — Weekly calendar view for appointments
 *
 * Features:
 *   - 7-column week grid (Sun–Sat) with time slots
 *   - Appointments color-coded by status
 *   - Week navigation (prev/next/today)
 *   - Click appointment to view details in a side panel
 *   - Update status or cancel directly from the panel
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  User,
  MapPin,
  Phone,
  Loader2,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

interface AppointmentWithLead {
  id: number;
  leadId: number;
  crewAssigned: string | null;
  jobType: string | null;
  scheduledDate: Date;
  timeSlot: string | null;
  status: AppointmentStatus;
  notes: string | null;
  smsSent: boolean;
  emailSent: boolean;
  createdAt: Date;
  lead: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    projectAddress: string | null;
  } | null;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  scheduled: {
    label: "Scheduled",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  confirmed: {
    label: "Confirmed",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  in_progress: {
    label: "In Progress",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    color: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-400",
  },
  no_show: {
    label: "No Show",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-400",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Appointment Card ─────────────────────────────────────────────────────────

function AppointmentCard({
  appt,
  onClick,
}: {
  appt: AppointmentWithLead;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.scheduled;
  const name = appt.lead
    ? `${appt.lead.firstName} ${appt.lead.lastName}`
    : "Unknown Lead";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md px-2 py-1.5 border text-xs mb-1 transition-all hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]",
        cfg.bg,
        cfg.border,
        cfg.color
      )}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
        <span className="font-semibold truncate">{name}</span>
      </div>
      {appt.jobType && (
        <p className="truncate text-[11px] opacity-80">{appt.jobType}</p>
      )}
      {appt.timeSlot && (
        <p className="text-[11px] opacity-70 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {appt.timeSlot}
        </p>
      )}
    </button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function AppointmentDetailPanel({
  appt,
  onClose,
  onUpdated,
}: {
  appt: AppointmentWithLead;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.scheduled;

  const updateMutation = trpc.appointments.update.useMutation({
    onSuccess: () => {
      utils.appointments.list.invalidate();
      onUpdated();
      toast.success("Appointment updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = trpc.appointments.cancel.useMutation({
    onSuccess: () => {
      utils.appointments.list.invalidate();
      onUpdated();
      toast.success("Appointment cancelled");
    },
    onError: (e) => toast.error(e.message),
  });

  const name = appt.lead
    ? `${appt.lead.firstName} ${appt.lead.lastName}`
    : "Unknown Lead";

  return (
    <Card className="border shadow-md">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <CardTitle className="text-base font-semibold">{name}</CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
              cfg.bg, cfg.border, cfg.color
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                {new Date(appt.scheduledDate).toLocaleDateString("en-US", {
                  weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
                })}
              </p>
              {appt.timeSlot && (
                <p className="text-muted-foreground text-xs">{appt.timeSlot}</p>
              )}
            </div>
          </div>

          {appt.jobType && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{appt.jobType}</span>
            </div>
          )}

          {appt.crewAssigned && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{appt.crewAssigned}</span>
            </div>
          )}

          {appt.lead?.projectAddress && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{appt.lead.projectAddress}</span>
            </div>
          )}

          {appt.lead?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={`tel:${appt.lead.phone}`} className="text-primary hover:underline">
                {appt.lead.phone}
              </a>
            </div>
          )}

          {appt.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{appt.notes}</p>
            </div>
          )}

          {/* Confirmation flags */}
          <div className="flex gap-3 pt-1">
            <span className={cn("text-xs flex items-center gap-1", appt.smsSent ? "text-emerald-600" : "text-muted-foreground")}>
              {appt.smsSent ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              SMS {appt.smsSent ? "sent" : "not sent"}
            </span>
            <span className={cn("text-xs flex items-center gap-1", appt.emailSent ? "text-emerald-600" : "text-muted-foreground")}>
              {appt.emailSent ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              Email {appt.emailSent ? "sent" : "not sent"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Update Status</p>
          <Select
            value={appt.status}
            onValueChange={(v) =>
              updateMutation.mutate({
                id: appt.id,
                status: v as AppointmentStatus,
              })
            }
            disabled={updateMutation.isPending}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => setLocation(`/leads/${appt.leadId}`)}
            >
              View Lead
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="text-xs"
              disabled={appt.status === "cancelled" || cancelMutation.isPending}
              onClick={() => cancelMutation.mutate({ id: appt.id })}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Cancel"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Schedule() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedAppt, setSelectedAppt] = useState<AppointmentWithLead | null>(null);
  const utils = trpc.useUtils();

  const weekEnd = useMemo(() => {
    const end = addDays(weekStart, 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  const { data: appointments = [], isLoading, refetch } = trpc.appointments.list.useQuery({
    from: weekStart,
    to: weekEnd,
  });

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const apptsByDay = useMemo(() => {
    const map = new Map<string, AppointmentWithLead[]>();
    for (const appt of appointments as AppointmentWithLead[]) {
      const d = new Date(appt.scheduledDate);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(appt);
    }
    return map;
  }, [appointments]);

  const today = new Date();
  const monthLabel = `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()}`;

  function prevWeek() { setWeekStart((w) => addDays(w, -7)); }
  function nextWeek() { setWeekStart((w) => addDays(w, 7)); }
  function goToday() { setWeekStart(getWeekStart(new Date())); }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground text-sm">Weekly appointment calendar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={prevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium min-w-[160px] text-center">
              {monthLabel}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading schedule…
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden bg-background shadow-sm">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b bg-muted/30">
                {weekDays.map((day) => {
                  const isToday = isSameDay(day, today);
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "py-3 px-2 text-center border-r last:border-r-0",
                        isToday && "bg-primary/5"
                      )}
                    >
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {DAY_NAMES[day.getDay()]}
                      </p>
                      <p
                        className={cn(
                          "text-lg font-bold mt-0.5",
                          isToday
                            ? "text-primary"
                            : "text-foreground"
                        )}
                      >
                        {day.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Appointment cells */}
              <div className="grid grid-cols-7 min-h-[420px]">
                {weekDays.map((day) => {
                  const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                  const dayAppts = apptsByDay.get(key) ?? [];
                  const isToday = isSameDay(day, today);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "p-2 border-r last:border-r-0 min-h-[120px] align-top",
                        isToday && "bg-primary/[0.02]"
                      )}
                    >
                      {dayAppts.map((appt) => (
                        <AppointmentCard
                          key={appt.id}
                          appt={appt}
                          onClick={() => setSelectedAppt(appt)}
                        />
                      ))}
                      {dayAppts.length === 0 && (
                        <div className="h-full flex items-center justify-center">
                          <span className="text-[11px] text-muted-foreground/40">—</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedAppt && (
          <div className="w-72 shrink-0">
            <AppointmentDetailPanel
              appt={selectedAppt}
              onClose={() => setSelectedAppt(null)}
              onUpdated={() => {
                refetch();
                setSelectedAppt(null);
              }}
            />
          </div>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && appointments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No appointments this week</p>
          <p className="text-xs mt-1">Book appointments from a lead's detail page.</p>
        </div>
      )}
    </div>
  );
}
