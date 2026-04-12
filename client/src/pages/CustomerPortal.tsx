/**
 * CustomerPortal.tsx — Public customer-facing project portal
 *
 * Accessible at /portal/:token — no login required.
 * Shows:
 *   - Company branding header
 *   - Project details and current status
 *   - Progress tracker (Scheduled → In Progress → Complete)
 *   - Appointment date/time card
 *   - Invoice with line items and Stripe payment button
 *   - Before/After interactive drag slider (with carousel for multiple pairs)
 *   - Grid fallback for progress-only or single-type photos
 */

import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  ExternalLink,
  Home,
  ImageIcon,
  Loader2,
  MapPin,
  Paintbrush,
  Phone,
  User,
  Wrench,
  Download,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/InvoicePDF";
import { useBranding } from "@/contexts/BrandingContext";
import { SocialMediaBar } from "@/components/SocialMediaBar";
import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

// ─── Stage progress config ────────────────────────────────────────────────────

const PROGRESS_STAGES = [
  { key: "lead", label: "Inquiry Received", icon: User },
  { key: "quoted", label: "Quote Sent", icon: Paintbrush },
  { key: "scheduled", label: "Job Scheduled", icon: CalendarDays },
  { key: "in_progress", label: "Work In Progress", icon: Wrench },
  { key: "completed", label: "Job Complete", icon: CheckCircle2 },
  { key: "paid", label: "Payment Received", icon: CreditCard },
];

const STAGE_ORDER = ["lead", "quoted", "scheduled", "in_progress", "completed", "paid"];

function getStageIndex(stage: string) {
  return STAGE_ORDER.indexOf(stage);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressTracker({ stage }: { stage: string }) {
  const currentIdx = getStageIndex(stage);

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-1 overflow-x-auto pb-2">
        {PROGRESS_STAGES.map((s, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = s.icon;

          return (
            <div key={s.key} className="flex flex-col items-center gap-2 flex-1 min-w-[60px]">
              {/* Connector line + icon row */}
              <div className="flex items-center w-full">
                {idx > 0 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      isDone || isCurrent ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isDone
                      ? "bg-blue-600 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Icon className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>
                {idx < PROGRESS_STAGES.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      isDone ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
              {/* Label */}
              <span
                className={`text-[10px] text-center leading-tight ${
                  isCurrent
                    ? "text-blue-700 font-semibold"
                    : isDone
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InvoiceSection({
  invoice,
  branding,
}: {
  invoice: any;
  branding: {
    businessName: string;
    logoUrl?: string | null;
    primaryColor?: string;
    companyEmail?: string;
  };
}) {
  const lineItems = (invoice.lineItems as { description: string; quantity: number; unitPrice: number }[]) ?? [];

  const statusColor =
    invoice.status === "paid"
      ? "bg-green-100 text-green-700"
      : invoice.status === "overdue"
      ? "bg-red-100 text-red-700"
      : invoice.status === "sent"
      ? "bg-blue-100 text-blue-700"
      : "bg-slate-100 text-slate-600";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            Invoice {invoice.invoiceNumber}
          </CardTitle>
          <Badge className={`text-xs font-medium ${statusColor}`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Line items */}
        {lineItems.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-12 text-xs text-slate-500 font-medium pb-1 border-b">
              <span className="col-span-6">Description</span>
              <span className="col-span-2 text-right">Qty</span>
              <span className="col-span-2 text-right">Unit Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>
            {lineItems.map((item, i) => (
              <div key={i} className="grid grid-cols-12 text-sm">
                <span className="col-span-6 text-slate-700">{item.description}</span>
                <span className="col-span-2 text-right text-slate-600">{item.quantity}</span>
                <span className="col-span-2 text-right text-slate-600">
                  ${Number(item.unitPrice).toFixed(2)}
                </span>
                <span className="col-span-2 text-right font-medium">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="space-y-1 pt-2 border-t">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>${Number(invoice.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Tax</span>
            <span>${Number(invoice.tax).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t">
            <span>Total</span>
            <span>${Number(invoice.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Due date / paid date */}
        {invoice.paidAt ? (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4" />
            Paid on {new Date(invoice.paidAt).toLocaleDateString()}
          </div>
        ) : invoice.dueDate ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4" />
            Due by {new Date(invoice.dueDate).toLocaleDateString()}
          </div>
        ) : null}

        <div className="flex gap-2">
          {/* Download PDF Button */}
          <PDFDownloadLink
            document={<InvoicePDF invoice={invoice} branding={branding} />}
            fileName={`${invoice.invoiceNumber}.pdf`}
          >
            {({ loading }) => (
              <Button variant="outline" disabled={loading} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                {loading ? "Generating…" : "PDF"}
              </Button>
            )}
          </PDFDownloadLink>
          {/* Stripe payment button */}
          {invoice.status !== "paid" && invoice.stripePaymentLink && (
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.open(invoice.stripePaymentLink!, "_blank")}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Now
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Before/After Drag Slider ─────────────────────────────────────────────────

function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeCaption,
  afterCaption,
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeCaption?: string;
  afterCaption?: string;
}) {
  const [position, setPosition] = useState(50); // percentage 0-100
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = clamp(((clientX - rect.left) / rect.width) * 100, 2, 98);
    setPosition(pct);
  }, []);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      updatePosition(e.clientX);
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [updatePosition]);

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    updatePosition(e.touches[0].clientX);
  };
  useEffect(() => {
    const onMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      updatePosition(e.touches[0].clientX);
    };
    const onEnd = () => { isDragging.current = false; };
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [updatePosition]);

  // Also allow dragging anywhere on the container
  const onContainerMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    updatePosition(e.clientX);
  };
  const onContainerTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    updatePosition(e.touches[0].clientX);
  };

  const FALLBACK_SRC =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e2e8f0'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%2394a3b8' font-size='12'%3EPhoto%3C/text%3E%3C/svg%3E";

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden select-none cursor-col-resize"
      style={{ aspectRatio: "16/9", touchAction: "none" }}
      onMouseDown={onContainerMouseDown}
      onTouchStart={onContainerTouchStart}
    >
      {/* After image — full width base layer */}
      <img
        src={afterUrl}
        alt={afterCaption || "After"}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_SRC; }}
      />

      {/* Before image — clipped to left portion */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={beforeUrl}
          alt={beforeCaption || "Before"}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: `${100 / (position / 100)}%`, maxWidth: "none" }}
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_SRC; }}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)]"
        style={{ left: `calc(${position}% - 1px)` }}
      />

      {/* Drag handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center cursor-col-resize"
        style={{ left: `${position}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <GripVertical className="w-4 h-4 text-slate-600" />
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
          Before
        </span>
      </div>
      <div className="absolute top-3 right-3 pointer-events-none">
        <span className="bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
          After
        </span>
      </div>

      {/* Hint text — fades out after first interaction */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
        <span className="bg-black/40 text-white text-[11px] px-2.5 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
          Drag to compare
        </span>
      </div>
    </div>
  );
}

// ─── Photo Gallery ────────────────────────────────────────────────────────────

type Photo = { url: string; caption: string; type: "before" | "after" | "progress" };

function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (photos.length === 0) return null;

  const before = photos.filter((p) => p.type === "before");
  const after = photos.filter((p) => p.type === "after");
  const progress = photos.filter((p) => p.type === "progress");

  // Build matched before/after pairs
  const pairCount = Math.min(before.length, after.length);
  const pairs = Array.from({ length: pairCount }, (_, i) => ({
    before: before[i],
    after: after[i],
  }));

  const hasPairs = pairs.length > 0;
  const clampedIndex = Math.min(activeIndex, pairs.length - 1);

  function prevPair() {
    setActiveIndex((i) => Math.max(0, i - 1));
  }
  function nextPair() {
    setActiveIndex((i) => Math.min(pairs.length - 1, i + 1));
  }

  // Grid fallback for single-type photos
  const GridSection = ({
    title,
    items,
    color,
  }: {
    title: string;
    items: Photo[];
    color: string;
  }) => {
    if (items.length === 0) return null;
    return (
      <div>
        <h4 className={`text-sm font-semibold mb-2 ${color}`}>{title}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map((p, i) => (
            <div key={i} className="group relative rounded-lg overflow-hidden aspect-square bg-slate-100">
              <img
                src={p.url}
                alt={p.caption || title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e2e8f0'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%2394a3b8' font-size='12'%3EPhoto%3C/text%3E%3C/svg%3E";
                }}
              />
              {p.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {p.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-blue-600" />
          Project Photos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Before/After slider section ── */}
        {hasPairs && (
          <div className="space-y-3">
            {/* Main slider */}
            <BeforeAfterSlider
              key={clampedIndex}
              beforeUrl={pairs[clampedIndex].before.url}
              afterUrl={pairs[clampedIndex].after.url}
              beforeCaption={pairs[clampedIndex].before.caption}
              afterCaption={pairs[clampedIndex].after.caption}
            />

            {/* Carousel navigation — only when multiple pairs */}
            {pairs.length > 1 && (
              <div className="space-y-2">
                {/* Prev / Next controls */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={prevPair}
                    disabled={clampedIndex === 0}
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
                      clampedIndex === 0
                        ? "opacity-40 cursor-not-allowed border-slate-200 text-slate-400"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                  </button>
                  <span className="text-xs text-slate-500">
                    {clampedIndex + 1} / {pairs.length}
                  </span>
                  <button
                    onClick={nextPair}
                    disabled={clampedIndex === pairs.length - 1}
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
                      clampedIndex === pairs.length - 1
                        ? "opacity-40 cursor-not-allowed border-slate-200 text-slate-400"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Thumbnail strip */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {pairs.map((pair, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className={cn(
                        "shrink-0 relative rounded-md overflow-hidden border-2 transition-all",
                        i === clampedIndex
                          ? "border-blue-500 shadow-md scale-105"
                          : "border-transparent opacity-60 hover:opacity-90"
                      )}
                      style={{ width: 72, height: 48 }}
                    >
                      {/* Split thumbnail: left=before, right=after */}
                      <div className="absolute inset-0 flex">
                        <img
                          src={pair.before.url}
                          alt="Before thumbnail"
                          className="w-1/2 h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='48'%3E%3Crect width='36' height='48' fill='%23e2e8f0'/%3E%3C/svg%3E";
                          }}
                        />
                        <img
                          src={pair.after.url}
                          alt="After thumbnail"
                          className="w-1/2 h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='48'%3E%3Crect width='36' height='48' fill='%23e2e8f0'/%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                      {/* Divider line on thumbnail */}
                      <div className="absolute inset-y-0 left-1/2 w-px bg-white/80" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Unmatched before photos (if more before than after) */}
            {before.length > after.length && (
              <GridSection
                title="Additional Before Photos"
                items={before.slice(after.length)}
                color="text-orange-600"
              />
            )}
            {/* Unmatched after photos (if more after than before) */}
            {after.length > before.length && (
              <GridSection
                title="Additional After Photos"
                items={after.slice(before.length)}
                color="text-green-600"
              />
            )}
          </div>
        )}

        {/* ── Grid fallback when no pairs (only before OR only after) ── */}
        {!hasPairs && (
          <>
            <GridSection title="Before" items={before} color="text-orange-600" />
            <GridSection title="After" items={after} color="text-green-600" />
          </>
        )}

        {/* Progress photos always shown as grid */}
        <GridSection title="In Progress" items={progress} color="text-blue-600" />
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CustomerPortal() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const { data, isLoading, error } = trpc.portal.getData.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );
  const { branding } = useBranding();

  // Load job_photos from the new photos router (public endpoint)
  const { data: jobPhotos } = trpc.photos.byLeadPublic.useQuery(
    { leadId: data?.lead?.id ?? 0, token },
    { enabled: !!data?.lead?.id }
  );

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm">Loading your project portal…</p>
        </div>
      </div>
    );
  }

  // ── Invalid token ──
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Portal Not Found</h1>
          <p className="text-slate-500 text-sm">
            This portal link may have expired or is invalid. Please contact your painting contractor for a new link.
          </p>
        </div>
      </div>
    );
  }

  const { lead, invoice, appointment } = data;
  const fullName = `${lead.firstName} ${lead.lastName}`;

  // ── Stage label ──
  const stageLabel =
    PROGRESS_STAGES.find((s) => s.key === lead.stage)?.label ?? lead.stage;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Paintbrush className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 text-sm leading-tight">
              Your Project Portal
            </h1>
            <p className="text-xs text-slate-500">Powered by PaintPro CRM</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Welcome card */}
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-0.5">Hello,</p>
                <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
                {lead.projectType && (
                  <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5">
                    <Paintbrush className="w-3.5 h-3.5 text-blue-500" />
                    {lead.projectType}
                  </p>
                )}
                {lead.projectAddress && (
                  <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {lead.projectAddress}
                  </p>
                )}
              </div>
              <Badge className="bg-blue-600 text-white text-xs shrink-0">{stageLabel}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Progress tracker */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Project Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressTracker stage={lead.stage} />
          </CardContent>
        </Card>

        {/* Appointment card */}
        {appointment && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                Your Appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 bg-blue-50 rounded-lg px-4 py-3">
                <CalendarDays className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {new Date(appointment.scheduledDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  {appointment.timeSlot && (
                    <p className="text-sm text-slate-600 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      {appointment.timeSlot}
                    </p>
                  )}
                </div>
              </div>
              {appointment.jobType && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Wrench className="w-4 h-4 text-slate-400" />
                  <span>{appointment.jobType}</span>
                </div>
              )}
              {appointment.crewAssigned && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Crew: {appointment.crewAssigned}</span>
                </div>
              )}
              {appointment.notes && (
                <div className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                  {appointment.notes}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    appointment.status === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : appointment.status === "completed"
                      ? "bg-blue-100 text-blue-700"
                      : appointment.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }
                >
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice */}
        {invoice && <InvoiceSection invoice={invoice} branding={branding} />}

        {/* Photo gallery — combines legacy portal photos with new job_photos */}
        {(() => {
          // Merge legacy portalPhotos (stored on lead) with new job_photos
          const legacyPhotos = (lead.portalPhotos ?? []) as Photo[];
          const newBefore = (jobPhotos?.before ?? []).map((p) => ({
            url: p.photoUrl,
            caption: p.caption ?? "",
            type: "before" as const,
          }));
          const newAfter = (jobPhotos?.after ?? []).map((p) => ({
            url: p.photoUrl,
            caption: p.caption ?? "",
            type: "after" as const,
          }));
          const allPhotos = [...legacyPhotos, ...newBefore, ...newAfter];
          return allPhotos.length > 0 ? <PhotoGallery photos={allPhotos} /> : null;
        })()}

        {/* Project description */}
        {lead.projectDescription && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-blue-600" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 leading-relaxed">{lead.projectDescription}</p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Social media bar */}
        <SocialMediaBar />

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pb-6 space-y-1">
          <p>Have questions? Contact your painting contractor directly.</p>
          <p className="flex items-center justify-center gap-1">
            <Phone className="w-3 h-3" />
            Powered by PaintPro CRM
          </p>
        </div>
      </main>
    </div>
  );
}
