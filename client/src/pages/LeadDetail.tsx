import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateTime, STAGE_LABELS, STAGES, type Stage } from "@/lib/stages";
import { StageBadge } from "@/components/StageBadge";
import { SMS } from "@/components/SMS";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle,
  DollarSign,
  Edit,
  ExternalLink,
  FileText,
  ImageIcon,
  Link2,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  Receipt,
  Save,
  Send,
  Star,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

// ── CrewSelect helper component ─────────────────────────────────────────────
function CrewSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: crewMembers = [] } = trpc.crew.list.useQuery({ status: "active" });
  const activeMembers = crewMembers as { id: number; name: string; role: string | null }[];

  if (activeMembers.length === 0) {
    return (
      <Input
        id="appt-crew"
        placeholder="No crew members — add them in Crew page"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <Select value={value || "__none"} onValueChange={(v) => onChange(v === "__none" ? "" : v)}>
      <SelectTrigger id="appt-crew">
        <SelectValue placeholder="Select crew member…" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none">— None —</SelectItem>
        {activeMembers.map((m) => (
          <SelectItem key={m.id} value={m.name}>
            {m.name}{m.role ? ` (${m.role})` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function LeadDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<"note" | "call" | "email">("note");

  // ── Create Invoice modal state ────────────────────────────────────────────
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invLineItems, setInvLineItems] = useState([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [invTaxRate, setInvTaxRate] = useState(0);
  const [invDueDate, setInvDueDate] = useState("");
  const [invNotes, setInvNotes] = useState("");

  // ── Portal state ──────────────────────────────────────────────────────────
  const [portalCopied, setPortalCopied] = useState(false);

  const generatePortalToken = trpc.portal.generateToken.useMutation({
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.url).then(() => {
        setPortalCopied(true);
        toast.success("Portal link copied to clipboard!");
        setTimeout(() => setPortalCopied(false), 3000);
      });
    },
    onError: (e) => toast.error(`Portal error: ${e.message}`),
  });

  // ── Book Appointment modal state ──────────────────────────────────────────
  const [bookingOpen, setBookingOpen] = useState(false);
  const [apptDate, setApptDate] = useState("");
  const [apptTimeSlot, setApptTimeSlot] = useState("");
  const [apptCrew, setApptCrew] = useState("");
  const [apptJobType, setApptJobType] = useState("");
  const [apptNotes, setApptNotes] = useState("");
  const [apptSendSms, setApptSendSms] = useState(true);
  const [apptSendEmail, setApptSendEmail] = useState(true);

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

  const bookAppointment = trpc.appointments.create.useMutation({
    onSuccess: (result) => {
      utils.appointments.byLead.invalidate({ leadId: id });
      setBookingOpen(false);
      setApptDate("");
      setApptTimeSlot("");
      setApptCrew("");
      setApptJobType("");
      setApptNotes("");
      const msgs: string[] = ["Appointment booked!"];
      if (result.smsSent) msgs.push("Confirmation SMS sent.");
      if (result.emailSent) msgs.push("Confirmation email sent.");
      if (result.smsError) msgs.push(`SMS note: ${result.smsError}`);
      toast.success(msgs.join(" "));
    },
    onError: (e) => toast.error(e.message),
  });

  const { data: leadAppointments = [] } = trpc.appointments.byLead.useQuery({ leadId: id });

  // ── Invoice queries and mutations ─────────────────────────────────────────
  const { data: leadInvoices = [] } = trpc.invoices.byLead.useQuery({ leadId: id });

  const generateInvoice = trpc.invoices.generate.useMutation({
    onSuccess: () => {
      utils.invoices.byLead.invalidate({ leadId: id });
      setInvoiceOpen(false);
      setInvLineItems([{ description: "", quantity: 1, unitPrice: 0 }]);
      setInvTaxRate(0);
      setInvDueDate("");
      setInvNotes("");
      toast.success("Invoice created as draft. Open the Invoices tab to send it.");
    },
    onError: (e) => toast.error(e.message),
  });

  const sendInvoice = trpc.invoices.send.useMutation({
    onSuccess: (result) => {
      utils.invoices.byLead.invalidate({ leadId: id });
      toast.success(
        result.mock
          ? "Invoice sent (mock link — add STRIPE_SECRET_KEY for real payments)"
          : "Invoice sent! Payment link delivered via SMS."
      );
    },
    onError: (e) => toast.error(e.message),
  });

  const markInvoicePaid = trpc.invoices.markPaid.useMutation({
    onSuccess: () => {
      utils.invoices.byLead.invalidate({ leadId: id });
      utils.leads.byId.invalidate({ id });
      toast.success("Invoice marked as paid. Lead moved to Paid stage.");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteInvoice = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      utils.invoices.byLead.invalidate({ leadId: id });
      toast.success("Draft invoice deleted.");
    },
    onError: (e) => toast.error(e.message),
  });

  // Invoice line item helpers
  const invSubtotal = invLineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const invTax = Math.round(invSubtotal * (invTaxRate / 100) * 100) / 100;
  const invTotal = invSubtotal + invTax;

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

  // ── Photos state, query, and mutations ──────────────────────────────────
  const [photosUploading, setPhotosUploading] = useState<Record<string, boolean>>({});
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const { data: photos, refetch: refetchPhotos } = trpc.photos.byLead.useQuery({ leadId: id });

  const uploadPhoto = trpc.photos.upload.useMutation({
    onSuccess: () => {
      refetchPhotos();
      toast.success("Photo uploaded");
    },
    onError: (e) => toast.error(`Upload failed: ${e.message}`),
  });

  const deletePhoto = trpc.photos.delete.useMutation({
    onSuccess: () => {
      refetchPhotos();
      toast.success("Photo deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10 MB)`);
        continue;
      }
      const key = `${type}-${file.name}`;
      setPhotosUploading((prev) => ({ ...prev, [key]: true }));
      try {
        const base64Data = await fileToBase64(file);
        await uploadPhoto.mutateAsync({
          leadId: id,
          type,
          base64Data,
          mimeType: file.type || "image/jpeg",
          originalName: file.name,
        });
      } finally {
        setPhotosUploading((prev) => { const n = { ...prev }; delete n[key]; return n; });
        // Reset input so same file can be re-uploaded
        if (type === "before" && beforeInputRef.current) beforeInputRef.current.value = "";
        if (type === "after" && afterInputRef.current) afterInputRef.current.value = "";
      }
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data URI prefix (data:image/jpeg;base64,)
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ── Google Review request ─────────────────────────────────────────────────
  const sendReviewRequest = trpc.reviews.send.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error ?? result.message);
      }
    },
    onError: (e) => toast.error(e.message),
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

          {/* Book Appointment */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setApptJobType(lead.projectType || "");
              setBookingOpen(true);
            }}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>

          {/* Create Invoice */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInvoiceOpen(true)}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>

          {/* Request Review */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendReviewRequest.mutate({ leadId: id })}
            disabled={sendReviewRequest.isPending}
          >
            <Star className="h-4 w-4 mr-2" />
            {sendReviewRequest.isPending ? "Sending..." : "Request Review"}
          </Button>

          {/* Copy Portal Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              generatePortalToken.mutate({
                leadId: id,
                origin: window.location.origin,
              })
            }
            disabled={generatePortalToken.isPending}
          >
            <Link2 className="h-4 w-4 mr-2" />
            {portalCopied ? "Copied!" : "Copy Portal Link"}
          </Button>
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
              <TabsTrigger value="sms" className="flex-1">
                <Phone className="h-4 w-4 mr-2" />
                SMS
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex-1">
                <Receipt className="h-4 w-4 mr-2" />
                Invoices ({leadInvoices.length})
              </TabsTrigger>
              <TabsTrigger value="attachments" className="flex-1">
                <Paperclip className="h-4 w-4 mr-2" />
                Files ({attachments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Photos ({(photos?.before?.length || 0) + (photos?.after?.length || 0)})
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

            <TabsContent value="sms" className="mt-4">
              <SMS leadId={id} customerPhone={lead.phone} />
            </TabsContent>

            {/* ── Invoices Tab ─────────────────────────────────────────────── */}
            <TabsContent value="invoices" className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {leadInvoices.length === 0
                    ? "No invoices yet"
                    : `${leadInvoices.length} invoice${leadInvoices.length !== 1 ? "s" : ""}`}
                </p>
                <Button size="sm" variant="outline" onClick={() => setInvoiceOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Invoice
                </Button>
              </div>

              {leadInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2 border-2 border-dashed rounded-xl">
                  <Receipt className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No invoices for this lead</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leadInvoices.map((inv) => {
                    const total = parseFloat(String(inv.total));
                    const statusColors: Record<string, string> = {
                      draft: "bg-slate-100 text-slate-700",
                      sent: "bg-blue-100 text-blue-700",
                      paid: "bg-green-100 text-green-700",
                      overdue: "bg-red-100 text-red-700",
                    };
                    return (
                      <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                        <Receipt className="h-5 w-5 text-blue-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-mono font-medium">{inv.invoiceNumber}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColors[inv.status] ?? statusColors.draft}`}>
                              {inv.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            ${total.toFixed(2)}
                            {inv.dueDate && ` · Due ${new Date(inv.dueDate).toLocaleDateString()}`}
                            {inv.smsSent && " · SMS sent"}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {inv.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={sendInvoice.isPending}
                              onClick={() => sendInvoice.mutate({ invoiceId: inv.id })}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Send
                            </Button>
                          )}
                          {(inv.status === "sent" || inv.status === "overdue") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-green-700 border-green-300"
                              disabled={markInvoicePaid.isPending}
                              onClick={() => markInvoicePaid.mutate({ invoiceId: inv.id })}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Paid
                            </Button>
                          )}
                          {inv.stripePaymentLink && (
                            <a
                              href={inv.stripePaymentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted"
                            >
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </a>
                          )}
                          {inv.status === "draft" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive"
                              onClick={() => deleteInvoice.mutate({ id: inv.id })}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

            {/* ── Photos Tab ─────────────────────────────────────────────────── */}
            <TabsContent value="photos" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Before Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
                      Before ({photos?.before?.length || 0})
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => beforeInputRef.current?.click()}
                      disabled={Object.keys(photosUploading).some((k) => k.startsWith("before"))}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Upload
                    </Button>
                    <input
                      ref={beforeInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, "before")}
                    />
                  </div>

                  {/* Upload drop zone */}
                  <button
                    type="button"
                    className="w-full border-2 border-dashed border-amber-200 rounded-xl p-5 text-center hover:border-amber-400 hover:bg-amber-50/50 transition-colors cursor-pointer"
                    onClick={() => beforeInputRef.current?.click()}
                  >
                    <ImageIcon className="h-7 w-7 mx-auto mb-1.5 text-amber-300" />
                    <p className="text-xs text-muted-foreground">Tap to upload before photos</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">JPG, PNG, WEBP · max 10 MB each</p>
                  </button>

                  {/* Thumbnail grid */}
                  {photos?.before && photos.before.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {photos.before.map((photo) => (
                        <div key={photo.id} className="relative group rounded-lg overflow-hidden border aspect-square bg-muted">
                          <img
                            src={photo.photoUrl}
                            alt={photo.caption || "Before photo"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-start justify-end p-1.5">
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-red-50 text-red-600 rounded-full p-1 shadow"
                              onClick={() => deletePhoto.mutate({ photoId: photo.id })}
                              title="Delete photo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {photo.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                              <p className="text-white text-xs truncate">{photo.caption}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* After Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      After ({photos?.after?.length || 0})
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => afterInputRef.current?.click()}
                      disabled={Object.keys(photosUploading).some((k) => k.startsWith("after"))}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Upload
                    </Button>
                    <input
                      ref={afterInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, "after")}
                    />
                  </div>

                  {/* Upload drop zone */}
                  <button
                    type="button"
                    className="w-full border-2 border-dashed border-emerald-200 rounded-xl p-5 text-center hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors cursor-pointer"
                    onClick={() => afterInputRef.current?.click()}
                  >
                    <ImageIcon className="h-7 w-7 mx-auto mb-1.5 text-emerald-300" />
                    <p className="text-xs text-muted-foreground">Tap to upload after photos</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">JPG, PNG, WEBP · max 10 MB each</p>
                  </button>

                  {/* Thumbnail grid */}
                  {photos?.after && photos.after.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {photos.after.map((photo) => (
                        <div key={photo.id} className="relative group rounded-lg overflow-hidden border aspect-square bg-muted">
                          <img
                            src={photo.photoUrl}
                            alt={photo.caption || "After photo"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-start justify-end p-1.5">
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-red-50 text-red-600 rounded-full p-1 shadow"
                              onClick={() => deletePhoto.mutate({ photoId: photo.id })}
                              title="Delete photo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {photo.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                              <p className="text-white text-xs truncate">{photo.caption}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Book Appointment Modal ──────────────────────────────────────────── */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="appt-date">Date *</Label>
                <Input
                  id="appt-date"
                  type="date"
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="appt-slot">Time Slot</Label>
                <Select value={apptTimeSlot} onValueChange={setApptTimeSlot}>
                  <SelectTrigger id="appt-slot">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "7:00 AM – 11:00 AM",
                      "8:00 AM – 12:00 PM",
                      "9:00 AM – 1:00 PM",
                      "10:00 AM – 2:00 PM",
                      "12:00 PM – 4:00 PM",
                      "1:00 PM – 5:00 PM",
                      "All Day",
                    ].map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-job">Job Type</Label>
              <Input
                id="appt-job"
                placeholder="e.g. Exterior Paint, Deck Stain"
                value={apptJobType}
                onChange={(e) => setApptJobType(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-crew">Crew Assigned</Label>
              <CrewSelect value={apptCrew} onChange={setApptCrew} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-notes">Notes</Label>
              <Textarea
                id="appt-notes"
                placeholder="Any special instructions..."
                rows={2}
                value={apptNotes}
                onChange={(e) => setApptNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={apptSendSms}
                  onChange={(e) => setApptSendSms(e.target.checked)}
                  className="rounded"
                />
                Send confirmation SMS
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={apptSendEmail}
                  onChange={(e) => setApptSendEmail(e.target.checked)}
                  className="rounded"
                />
                Send confirmation email
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!apptDate || bookAppointment.isPending}
              onClick={() => {
                if (!apptDate) return;
                bookAppointment.mutate({
                  leadId: id,
                  scheduledDate: new Date(apptDate + "T12:00:00Z"),
                  timeSlot: apptTimeSlot || undefined,
                  jobType: apptJobType || undefined,
                  crewAssigned: apptCrew || undefined,
                  notes: apptNotes || undefined,
                  sendConfirmationSms: apptSendSms,
                  sendConfirmationEmail: apptSendEmail,
                });
              }}
            >
              {bookAppointment.isPending ? "Booking…" : "Book Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Invoice Modal ─────────────────────────────────────────── */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Create Invoice for {lead?.firstName} {lead?.lastName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Line Items</Label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() =>
                    setInvLineItems((prev) => [
                      ...prev,
                      { description: "", quantity: 1, unitPrice: 0 },
                    ])
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Row
                </Button>
              </div>

              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 mb-1 px-1">
                <span className="col-span-6 text-xs text-muted-foreground">Description</span>
                <span className="col-span-2 text-xs text-muted-foreground text-center">Qty</span>
                <span className="col-span-2 text-xs text-muted-foreground text-center">Unit Price</span>
                <span className="col-span-1 text-xs text-muted-foreground text-right">Total</span>
                <span className="col-span-1" />
              </div>

              <div className="space-y-2">
                {invLineItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <Input
                      className="col-span-6 h-8 text-sm"
                      placeholder="e.g. Exterior Paint Labor"
                      value={item.description}
                      onChange={(e) =>
                        setInvLineItems((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, description: e.target.value } : r
                          )
                        )
                      }
                    />
                    <Input
                      className="col-span-2 h-8 text-sm text-center"
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        setInvLineItems((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? { ...r, quantity: parseFloat(e.target.value) || 1 }
                              : r
                          )
                        )
                      }
                    />
                    <Input
                      className="col-span-2 h-8 text-sm text-center"
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        setInvLineItems((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? { ...r, unitPrice: parseFloat(e.target.value) || 0 }
                              : r
                          )
                        )
                      }
                    />
                    <span className="col-span-1 text-sm font-medium text-right">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="col-span-1 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      disabled={invLineItems.length === 1}
                      onClick={() =>
                        setInvLineItems((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${invSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Tax Rate (%)</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className="h-7 w-20 text-sm text-right"
                  value={invTaxRate || ""}
                  placeholder="0"
                  onChange={(e) => setInvTaxRate(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${invTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-1.5">
                <span>Total</span>
                <span>${invTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Due Date + Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="inv-due">Due Date</Label>
                <Input
                  id="inv-due"
                  type="date"
                  value={invDueDate}
                  onChange={(e) => setInvDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inv-notes">Notes</Label>
                <Input
                  id="inv-notes"
                  placeholder="Optional notes"
                  value={invNotes}
                  onChange={(e) => setInvNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                generateInvoice.isPending ||
                invLineItems.some((i) => !i.description.trim()) ||
                invTotal <= 0
              }
              onClick={() =>
                generateInvoice.mutate({
                  leadId: id,
                  lineItems: invLineItems,
                  taxRate: invTaxRate,
                  dueDate: invDueDate ? new Date(invDueDate + "T12:00:00Z") : undefined,
                  notes: invNotes || undefined,
                })
              }
            >
              {generateInvoice.isPending ? "Creating…" : "Create Draft Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
