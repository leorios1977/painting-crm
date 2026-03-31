import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateTime, STAGE_LABELS, type Stage } from "@/lib/stages";
import { StageBadge } from "@/components/StageBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  CalendarDays,
  DollarSign,
  Mail,
  MessageSquare,
  TrendingUp,
  Users,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  color?: "blue" | "green" | "amber" | "violet";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">{trend}</span>
              </div>
            )}
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const stageCounts = stats?.stageCounts || {};
  const totalLeads = stats?.totalLeads || 0;
  const totalRevenue = stats?.totalRevenue || 0;
  const paidRevenue = stats?.paidRevenue || 0;
  const upcomingJobs = stats?.upcomingJobs || [];
  const recentActivity = stats?.recentActivity || [];

  const stages: Stage[] = ["lead", "quoted", "scheduled", "in_progress", "completed", "paid"];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Overview of your painting business pipeline
          </p>
        </div>
        <Button onClick={() => setLocation("/leads")} size="sm">
          <Users className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={totalLeads}
          subtitle="All pipeline stages"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(totalRevenue)}
          subtitle="Estimated across all leads"
          icon={BarChart3}
          color="violet"
        />
        <StatCard
          title="Revenue Collected"
          value={formatCurrency(paidRevenue)}
          subtitle="Paid invoices"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Upcoming Jobs"
          value={upcomingJobs.length}
          subtitle="Next 7 days"
          icon={CalendarDays}
          color="amber"
        />
      </div>

      {/* Pipeline Overview + Upcoming Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Funnel */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">Pipeline Overview</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setLocation("/pipeline")}
            >
              View Board <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stages.map((stage) => {
              const count = stageCounts[stage] || 0;
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <StageBadge stage={stage} size="sm" />
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stage === "lead" ? "bg-slate-400" :
                        stage === "quoted" ? "bg-blue-500" :
                        stage === "scheduled" ? "bg-violet-500" :
                        stage === "in_progress" ? "bg-amber-500" :
                        stage === "completed" ? "bg-emerald-500" :
                        "bg-green-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-6 text-right">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Upcoming Jobs */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">Upcoming Jobs</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {upcomingJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No jobs scheduled this week</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingJobs.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setLocation(`/leads/${job.id}`)}
                  >
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <CalendarDays className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {job.firstName} {job.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.projectType || "Project"}
                      </p>
                      <p className="text-xs text-blue-600 font-medium mt-0.5">
                        {job.scheduledDate
                          ? new Date(job.scheduledDate).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => setLocation("/communications")}
          >
            View All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === "email" ? "bg-blue-50" :
                    item.type === "call" ? "bg-green-50" :
                    item.type === "note" ? "bg-amber-50" :
                    "bg-slate-100"
                  }`}>
                    {item.type === "email" ? <Mail className="h-3.5 w-3.5 text-blue-600" /> :
                     item.type === "call" ? <MessageSquare className="h-3.5 w-3.5 text-green-600" /> :
                     <Clock className="h-3.5 w-3.5 text-slate-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.subject || item.type}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDateTime(item.sentAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
