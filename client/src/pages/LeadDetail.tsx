import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateTime, STAGE_LABELS, STAGES, type Stage } from "@/lib/stages";
import { StageBadge } from "@/components/StageBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CalendarDays,
  DollarSign,
  Edit,
  ExternalLink,
  FileText,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function LeadDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<"note" | "call" | "email">("note");

  const { data: lead, isLoading } = trpc.leads.byId.useQuery({ id });
  const { data: logs } = trpc.communications.list.useQuery({ leadId: id });
  const { data: attachments } = trpc.attachments.list.useQuery({ leadId: id });

  const updateStage = trpc.leads.updateStage.useMutation({
    onSuccess: () => {
      utils.leads.byId.invalidate({ id });
      utils.communications.list.invalidate({ leadId: id });
      toast.success("Stage updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const addNote = trpc.communications.create.useMutation({
    onSuccess: () => {
      utils.communications.list.invalidate({ leadId: id });
      setNoteContent("");
      toast.success("Note added");
    },
    onError: (e) => toast.error(e.message),
  });

  const createPaymentLink = trpc.stripe.createPaymentLink.useMutation({
    onSuccess: (data) => {
      utils.leads.byId.invalidate({ id });
      toast.success(data.mock ? "Mock payment link created (configure Stripe for real links)" : "Payment link created!");
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadAttachment = trpc.attachments.upload.useMutation({
    onSuccess: () => {
      utils.attachments.list.invalidate({ leadId: id });
      toast.success("File uploaded");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteAttachment = trpc.attachments.delete.useMutation({
    onSuccess: () => {
      utils.attachments.list.invalidate({ leadId: id });
      toast.success("File deleted");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Lead not found</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/leads")}>
          Back to Leads
        </Button>
      </div>
    );
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadAttachment.mutate({
        leadId: id,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        base64Data: base64,
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5 pb-8 max-w-5xl">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/leads")} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Leads
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-primary">
              {lead.firstName[0]}{lead.lastName[0]}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {lead.firstName} {lead.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <StageBadge stage={lead.stage as Stage} />
              {lead.projectType && (
                <Badge variant="secondary">{lead.projectType}</Badge>
              )}
              {lead.estimatedValue && (
                <span className="text-sm font-semibold text-emerald-600">
                  {formatCurrency(lead.estimatedValue)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Stage Selector */}
          <Select
            value={lead.stage}
            onValueChange={(v) => updateStage.mutate({ id, stage: v as Stage })}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map(({ key, label }) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Payment Link */}
          {lead.stripePaymentLinkUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={lead.stripePaymentLinkUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Payment Link
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={createPaymentLink.isPending || !lead.estimatedValue}
              onClick={() =>
                createPaymentLink.mutate({
                  leadId: id,
                  amount: parseFloat(String(lead.estimatedValue || "0")),
                  description: `${lead.projectType} - ${lead.firstName} ${lead.lastName}`,
                })
              }
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Contact Info */}
        <div className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4" /> Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${lead.email}`} className="text-primary hover:underline truncate">
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                </div>
              )}
              {lead.projectAddress && (
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{lead.projectAddress}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{lead.projectType || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Value</span>
                <span className="font-semibold text-emerald-600">
                  {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium">{lead.source || "—"}</span>
              </div>
              {lead.scheduledDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scheduled</span>
                  <span className="font-medium text-blue-600">
                    {new Date(lead.scheduledDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {lead.projectDescription && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-xs mb-1">Description</p>
                  <p>{lead.projectDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="activity">
            <TabsList className="w-full">
              <TabsTrigger value="activity" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Activity ({logs?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="attachments" className="flex-1">
                <Paperclip className="h-4 w-4 mr-2" />
                Files ({attachments?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-4 space-y-4">
              {/* Add Note */}
              <Card className="border shadow-sm">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex gap-2">
                    {(["note", "call", "email"] as const).map((t) => (
                      <Button
                        key={t}
                        size="sm"
                        variant={noteType === t ? "default" : "outline"}
                        onClick={() => setNoteType(t)}
                        className="capitalize"
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    placeholder={`Add a ${noteType}...`}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={3}
                  />
                  <Button
                    size="sm"
                    disabled={!noteContent.trim() || addNote.isPending}
                    onClick={() =>
                      addNote.mutate({
                        leadId: id,
                        type: noteType,
                        content: noteContent,
                        direction: noteType === "email" ? "outbound" : "internal",
                      })
                    }
                  >
                    {addNote.isPending ? "Saving..." : "Add Entry"}
                  </Button>
                </CardContent>
              </Card>

              {/* Activity Feed */}
              <div className="space-y-2">
                {logs?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No activity yet
                  </div>
                )}
                {logs?.map((log) => (
                  <div key={log.id} className="flex gap-3 p-3 rounded-lg border bg-white hover:bg-muted/20 transition-colors">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      log.type === "email" ? "bg-blue-50" :
                      log.type === "call" ? "bg-green-50" :
                      log.type === "note" ? "bg-amber-50" :
                      "bg-slate-100"
                    }`}>
                      {log.type === "email" ? <Mail className="h-3.5 w-3.5 text-blue-600" /> :
                       log.type === "call" ? <Phone className="h-3.5 w-3.5 text-green-600" /> :
                       log.type === "note" ? <MessageSquare className="h-3.5 w-3.5 text-amber-600" /> :
                       <FileText className="h-3.5 w-3.5 text-slate-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {log.subject && (
                        <p className="text-sm font-medium">{log.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap"
                         dangerouslySetInnerHTML={{ __html: log.content.replace(/<[^>]*>/g, ' ').substring(0, 200) }}
                      />
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDateTime(log.sentAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0 h-5">
                      {log.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="attachments" className="mt-4 space-y-4">
              <div className="border-2 border-dashed border-muted rounded-xl p-6 text-center">
                <Paperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground mb-3">
                  Upload quotes, invoices, or project photos
                </p>
                <label className="cursor-pointer">
                  <Button size="sm" variant="outline" asChild>
                    <span>
                      <Paperclip className="h-4 w-4 mr-2" />
                      Choose File
                    </span>
                  </Button>
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              <div className="space-y-2">
                {attachments?.map((att) => (
                  <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                    <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{att.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : ""} · {formatDateTime(att.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" asChild>
                        <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteAttachment.mutate({ id: att.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
