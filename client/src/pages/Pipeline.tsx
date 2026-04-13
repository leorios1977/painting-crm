import { trpc } from "@/lib/trpc";
import { formatCurrency, type Stage, useIndustryStages } from "@/lib/stages";
import { StageBadge } from "@/components/StageBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { useState } from "react";
import { useLocation } from "wouter";
import { CalendarDays, DollarSign, Phone, Plus, User } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/stages";
type KanbanLead = {
  id: number;
  firstName: string;
  lastName: string;
  projectType: string | null;
  estimatedValue: string | null;
  lastContactedAt: Date | null;
  scheduledDate: Date | null;
  stage: Stage;
  phone: string | null;
  email: string | null;
};

function LeadCard({ lead, isDragging }: { lead: KanbanLead; isDragging?: boolean }) {
  const [, setLocation] = useLocation();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card
        className="border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-white"
        onClick={(e) => {
          if (!isDragging) {
            e.stopPropagation();
            setLocation(`/leads/${lead.id}`);
          }
        }}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {lead.firstName} {lead.lastName}
                </p>
                {lead.projectType && (
                  <p className="text-xs text-muted-foreground truncate">{lead.projectType}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            {lead.estimatedValue ? (
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                <DollarSign className="h-3 w-3" />
                {formatCurrency(lead.estimatedValue)}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No quote</span>
            )}
            {lead.scheduledDate && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <CalendarDays className="h-3 w-3" />
                {formatDate(lead.scheduledDate)}
              </div>
            )}
          </div>

          {lead.lastContactedAt && (
            <p className="text-xs text-muted-foreground">
              Last contact: {formatDate(lead.lastContactedAt)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KanbanColumn({
  stage,
  leads,
  label,
}: {
  stage: Stage;
  leads: KanbanLead[];
  label: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border bg-muted/30 kanban-${stage} transition-colors ${
        isOver ? "bg-primary/5 border-primary/30" : ""
      }`}
      style={{ minWidth: "240px", maxWidth: "280px", flex: "0 0 260px" }}
    >
      <div className="p-3 border-b bg-white/50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <StageBadge stage={stage} />
          <Badge variant="secondary" className="text-xs font-semibold">
            {leads.length}
          </Badge>
        </div>
      </div>
      <div
        className="flex-1 p-2 space-y-2 overflow-y-auto"
        style={{ minHeight: "120px", maxHeight: "calc(100vh - 280px)" }}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/60 border-2 border-dashed border-muted rounded-lg">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const { data: kanbanData, refetch } = trpc.leads.kanban.useQuery();
  const updateStage = trpc.leads.updateStage.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Lead stage updated");
    },
    onError: (e) => toast.error(e.message),
  });
  const [, setLocation] = useLocation();
  const [activeId, setActiveId] = useState<number | null>(null);
  const { stages: STAGES } = useIndustryStages();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const allLeads = Object.values(kanbanData || {}).flat() as KanbanLead[];
  const activeLead = allLeads.find((l) => l.id === activeId);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as number);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const leadId = active.id as number;
    const newStage = over.id as Stage;
    const lead = allLeads.find((l) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;
    updateStage.mutate({ id: leadId, stage: newStage });
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Drag and drop leads between stages
          </p>
        </div>
        <Button onClick={() => setLocation("/leads")} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Lead
        </Button>
      </div>

      <div className="overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3" style={{ minWidth: "max-content" }}>
            {STAGES.map(({ key, label }: { key: Stage; label: string }) => (
              <KanbanColumn
                key={key}
                stage={key}
                label={label}
                leads={(kanbanData?.[key] || []) as KanbanLead[]}
              />
            ))}
          </div>
          <DragOverlay>
            {activeLead ? (
              <div className="opacity-90 rotate-2 scale-105">
                <LeadCard lead={activeLead} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
