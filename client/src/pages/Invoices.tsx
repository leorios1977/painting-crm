/**
 * Invoices.tsx — Full invoices list page
 *
 * Features:
 *   - Table of all invoices with status badges (draft/sent/paid/overdue)
 *   - Filter by status
 *   - Click row to view invoice detail (side panel)
 *   - Send invoice, Mark as Paid, Delete draft actions
 *   - Revenue summary cards at top
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  FileText,
  Send,
  CheckCircle,
  Trash2,
  ExternalLink,
  DollarSign,
  Clock,
  AlertCircle,
  Receipt,
  Download,
} from "lucide-react";
import { Link } from "wouter";
import type { InvoiceLineItem } from "../../../drizzle/schema";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/InvoicePDF";
import { useBranding } from "@/contexts/BrandingContext";

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    icon: FileText,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  sent: {
    label: "Sent",
    icon: Send,
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle,
    className: "bg-green-100 text-green-700 border-green-200",
  },
  overdue: {
    label: "Overdue",
    icon: AlertCircle,
    className: "bg-red-100 text-red-700 border-red-200",
  },
} as const;

type InvoiceStatus = keyof typeof STATUS_CONFIG;

function InvoiceStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as InvoiceStatus] ?? STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { branding } = useBranding();

  const { data: invoices = [], isLoading } = trpc.invoices.list.useQuery(
    statusFilter !== "all"
      ? { status: statusFilter as InvoiceStatus, limit: 200 }
      : { limit: 200 }
  );

  const { data: selectedInvoice } = trpc.invoices.byId.useQuery(
    { id: selectedId! },
    { enabled: selectedId !== null }
  );

  const sendMutation = trpc.invoices.send.useMutation({
    onSuccess: (result) => {
      utils.invoices.list.invalidate();
      utils.invoices.byId.invalidate({ id: result.invoice.id });
      toast.success(
        result.mock
          ? "Invoice sent (mock Stripe link — configure STRIPE_SECRET_KEY for real payments)"
          : "Invoice sent! Payment link delivered via SMS."
      );
    },
    onError: (err) => toast.error(`Failed to send: ${err.message}`),
  });

  const markPaidMutation = trpc.invoices.markPaid.useMutation({
    onSuccess: () => {
      utils.invoices.list.invalidate();
      if (selectedId) utils.invoices.byId.invalidate({ id: selectedId });
      toast.success("Invoice marked as paid. Lead moved to Paid stage.");
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const deleteMutation = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      utils.invoices.list.invalidate();
      setDeleteId(null);
      setSelectedId(null);
      toast.success("Invoice deleted.");
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  // ── Summary metrics ──────────────────────────────────────────────────────────
  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + parseFloat(String(i.total)), 0);

  const pendingRevenue = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + parseFloat(String(i.total)), 0);

  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const draftCount = invoices.filter((i) => i.status === "draft").length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and track all customer invoices
          </p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue Collected</p>
                <p className="text-xl font-bold text-green-600">
                  ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending Payment</p>
                <p className="text-xl font-bold text-blue-600">
                  ${pendingRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-xl font-bold text-red-600">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <FileText className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Drafts</p>
                <p className="text-xl font-bold text-slate-600">{draftCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters + Table ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">All Invoices</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Loading invoices…
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
              <Receipt className="w-8 h-8 opacity-40" />
              <p className="text-sm">No invoices yet</p>
              <p className="text-xs">
                Open a lead and click "Create Invoice" to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => setSelectedId(inv.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-blue-600">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3">
                        {inv.lead ? (
                          <Link
                            href={`/leads/${inv.leadId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline text-foreground"
                          >
                            {inv.lead.firstName} {inv.lead.lastName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Lead #{inv.leadId}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ${parseFloat(String(inv.total)).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {inv.dueDate
                          ? new Date(inv.dueDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {inv.status === "draft" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                disabled={sendMutation.isPending}
                                onClick={() =>
                                  sendMutation.mutate({ invoiceId: inv.id })
                                }
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Send
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(inv.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          {(inv.status === "sent" || inv.status === "overdue") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                              disabled={markPaidMutation.isPending}
                              onClick={() =>
                                markPaidMutation.mutate({ invoiceId: inv.id })
                              }
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Mark Paid
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Invoice Detail Side Panel ── */}
      <Sheet open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              {selectedInvoice?.invoiceNumber ?? "Invoice"}
            </SheetTitle>
          </SheetHeader>

          {selectedInvoice ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <InvoiceStatusBadge status={selectedInvoice.status} />
                {selectedInvoice.dueDate && (
                  <span className="text-xs text-muted-foreground">
                    Due {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              <Separator />

              {/* Line Items */}
              <div>
                <p className="text-sm font-semibold mb-2">Line Items</p>
                <div className="space-y-1">
                  {(selectedInvoice.lineItems as unknown as InvoiceLineItem[]).map(
                    (item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × ${item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${parseFloat(String(selectedInvoice.subtotal)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${parseFloat(String(selectedInvoice.tax)).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>${parseFloat(String(selectedInvoice.total)).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment link */}
              {selectedInvoice.stripePaymentLink && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-blue-700">Payment Link</p>
                    <a
                      href={selectedInvoice.stripePaymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate block"
                    >
                      {selectedInvoice.stripePaymentLink}
                    </a>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedInvoice.notes && (
                <div>
                  <p className="text-sm font-semibold mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Paid info */}
              {selectedInvoice.paidAt && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-green-700">
                    Paid on {new Date(selectedInvoice.paidAt).toLocaleString()}
                  </p>
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {selectedInvoice.status === "draft" && (
                  <Button
                    className="flex-1"
                    disabled={sendMutation.isPending}
                    onClick={() =>
                      sendMutation.mutate({ invoiceId: selectedInvoice.id })
                    }
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendMutation.isPending ? "Sending…" : "Send Invoice"}
                  </Button>
                )}
                {(selectedInvoice.status === "sent" ||
                  selectedInvoice.status === "overdue") && (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={markPaidMutation.isPending}
                    onClick={() =>
                      markPaidMutation.mutate({ invoiceId: selectedInvoice.id })
                    }
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {markPaidMutation.isPending ? "Updating…" : "Mark as Paid"}
                  </Button>
                )}
                {selectedInvoice.status === "draft" && (
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => setDeleteId(selectedInvoice.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
                <PDFDownloadLink
                  document={<InvoicePDF invoice={selectedInvoice} branding={branding} />}
                  fileName={`${selectedInvoice.invoiceNumber}.pdf`}
                >
                  {({ loading }) => (
                    <Button variant="outline" disabled={loading}>
                      <Download className="w-4 h-4 mr-2" />
                      {loading ? "Generating…" : "Download PDF"}
                    </Button>
                  )}
                </PDFDownloadLink>
              </div>

              <div className="text-xs text-muted-foreground pt-2">
                Created {new Date(selectedInvoice.createdAt).toLocaleString()}
                {selectedInvoice.smsSent && (
                  <span className="ml-2 text-blue-600">• SMS sent</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Loading…
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the draft invoice. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
