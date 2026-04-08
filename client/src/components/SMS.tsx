/**
 * SMS.tsx — Chat-style SMS thread component
 *
 * Renders all SMS conversations for a given lead with:
 *   - Inbound messages left-aligned (customer)
 *   - Outbound messages right-aligned (you)
 *   - Text input + Send button at the bottom
 *   - Three quick-reply buttons: Confirm appointment, Send estimate link, Request review
 *   - Configuration warning when Twilio credentials are not set
 */

import { useRef, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCheck,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SMSProps {
  /** CRM lead ID whose conversation thread to display */
  leadId: number;
  /** Customer phone number (pre-filled as the "To" number) */
  customerPhone?: string | null;
}

// ─── Quick reply templates ────────────────────────────────────────────────────

const QUICK_REPLIES = [
  {
    label: "Confirm appointment",
    text: "Hi! This is a reminder that your appointment is confirmed. Please reply STOP to opt out.",
  },
  {
    label: "Send estimate link",
    text: "Hi! Your estimate is ready. Please review it at the link we emailed you. Let us know if you have any questions!",
  },
  {
    label: "Request review",
    text: "Thank you for choosing us! We'd love to hear about your experience. Could you leave us a quick review? It means a lot to our team!",
  },
];

// ─── Status icon helper ───────────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  if (status === "delivered") return <CheckCheck className="w-3 h-3 text-blue-400" />;
  if (status === "sent" || status === "queued") return <Clock className="w-3 h-3 text-slate-400" />;
  if (status === "failed" || status === "not_configured") return <XCircle className="w-3 h-3 text-red-400" />;
  if (status === "received") return null;
  return <Clock className="w-3 h-3 text-slate-400" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SMS({ leadId, customerPhone }: SMSProps) {
  const [messageText, setMessageText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Fetch Twilio configuration status
  const { data: smsStatus } = trpc.sms.status.useQuery();

  // Fetch conversation thread — poll every 15 seconds for new inbound messages
  const { data: messages = [], isLoading } = trpc.sms.list.useQuery(
    { leadId },
    { refetchInterval: 15_000 }
  );

  // Send SMS mutation
  const sendMutation = trpc.sms.send.useMutation({
    onSuccess: (result) => {
      utils.sms.list.invalidate({ leadId });
      if (!result.success) {
        toast.warning(
          result.error?.includes("not configured")
            ? "Twilio is not configured — message saved as draft. Add credentials in Settings."
            : `SMS failed: ${result.error}`
        );
      } else {
        toast.success("SMS sent");
      }
    },
    onError: (err) => {
      toast.error(`Failed to send SMS: ${err.message}`);
    },
  });

  // Scroll to bottom when messages load or new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const text = messageText.trim();
    if (!text) return;
    if (!customerPhone) {
      toast.error("No phone number on file for this lead. Add one in the lead profile.");
      return;
    }
    sendMutation.mutate({
      leadId,
      to: customerPhone,
      message: text,
    });
    setMessageText("");
  };

  const handleQuickReply = (text: string) => {
    setMessageText(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[480px] max-h-[680px] border border-border rounded-xl overflow-hidden bg-background">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
        <MessageSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">SMS Conversation</span>
        {customerPhone ? (
          <Badge variant="outline" className="ml-auto text-xs font-mono">
            {customerPhone}
          </Badge>
        ) : (
          <Badge variant="destructive" className="ml-auto text-xs">
            No phone number
          </Badge>
        )}
      </div>

      {/* ── Twilio not configured warning ── */}
      {smsStatus && !smsStatus.configured && (
        <Alert className="m-3 mb-0 border-amber-200 bg-amber-50 text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs">
            Twilio credentials are not configured. Messages will be saved as drafts.{" "}
            <a href="/settings" className="underline font-medium">
              Configure in Settings →
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Message thread ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
            <MessageSquare className="w-8 h-8 opacity-30" />
            <p className="text-sm">No messages yet. Send the first one below.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOutbound = msg.direction === "outbound";
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[78%] gap-1",
                  isOutbound ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {/* Bubble */}
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                    isOutbound
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  {msg.body}
                </div>

                {/* Meta: time + status */}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
                  <span>
                    {new Date(msg.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  {isOutbound && <StatusIcon status={msg.status} />}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick replies ── */}
      <div className="flex gap-2 px-4 pt-2 pb-1 flex-wrap border-t border-border bg-muted/20">
        {QUICK_REPLIES.map((qr) => (
          <button
            key={qr.label}
            type="button"
            onClick={() => handleQuickReply(qr.text)}
            className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
          >
            {qr.label}
          </button>
        ))}
      </div>

      {/* ── Compose area ── */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-border bg-background">
        <Textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            customerPhone
              ? "Type a message… (Ctrl+Enter to send)"
              : "Add a phone number to this lead to send SMS"
          }
          disabled={!customerPhone || sendMutation.isPending}
          className="resize-none min-h-[60px] max-h-[120px] text-sm"
          rows={2}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={
            !messageText.trim() ||
            !customerPhone ||
            sendMutation.isPending
          }
          className="shrink-0 h-10 w-10"
          aria-label="Send SMS"
        >
          {sendMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default SMS;
