/**
 * Crew.tsx — Crew member management page
 *
 * Features:
 *   - Table of all crew members with status badges
 *   - Filter by status (all / active / inactive)
 *   - Add Crew Member button opens a modal form
 *   - Click row to edit crew member details
 *   - Deactivate / Reactivate actions per member
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useIndustry } from "@/contexts/IndustryContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  MoreHorizontal,
  Pencil,
  UserX,
  UserCheck,
  Loader2,
  HardHat,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CrewMember {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

interface CrewFormData {
  name: string;
  phone: string;
  email: string;
  role: string;
  status: "active" | "inactive";
}

const EMPTY_FORM: CrewFormData = {
  name: "",
  phone: "",
  email: "",
  role: "",
  status: "active",
};

// ─── Crew Form Modal ──────────────────────────────────────────────────────────

function CrewFormModal({
  open,
  onClose,
  member,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  member: CrewMember | null;
  onSaved: () => void;
}) {
  const isEdit = !!member;
  const { teamTerminology } = useIndustry();
  const [form, setForm] = useState<CrewFormData>(
    member
      ? {
          name: member.name,
          phone: member.phone ?? "",
          email: member.email ?? "",
          role: member.role ?? "",
          status: member.status,
        }
      : EMPTY_FORM
  );

  const utils = trpc.useUtils();

  const createMutation = trpc.crew.create.useMutation({
    onSuccess: () => {
      utils.crew.list.invalidate();
      onSaved();
      toast.success(`${teamTerminology} added`);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.crew.update.useMutation({
    onSuccess: () => {
      utils.crew.list.invalidate();
      onSaved();
      toast.success(`${teamTerminology} updated`);
    },
    onError: (e) => toast.error(e.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      role: form.role.trim() || null,
      status: form.status,
    };
    if (isEdit && member) {
      updateMutation.mutate({ id: member.id, data: payload });
    } else {
      createMutation.mutate({ ...payload, status: payload.status });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${teamTerminology}` : `Add ${teamTerminology}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="crew-name">Full Name *</Label>
            <Input
              id="crew-name"
              placeholder="e.g. Marcus Johnson"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="crew-phone">Phone</Label>
              <Input
                id="crew-phone"
                placeholder="(555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crew-email">Email</Label>
              <Input
                id="crew-email"
                type="email"
                placeholder="crew@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="crew-role">Role</Label>
              <Input
                id="crew-role"
                placeholder="e.g. Lead Painter"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crew-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as "active" | "inactive" }))}
              >
                <SelectTrigger id="crew-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Add Member"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Crew() {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<CrewMember | null>(null);
  const { teamGroupName, teamTerminology, teamTerminologyPlural } = useIndustry();

  const utils = trpc.useUtils();

  const { data: members = [], isLoading } = trpc.crew.list.useQuery({ status: statusFilter });

  const deactivateMutation = trpc.crew.deactivate.useMutation({
    onSuccess: () => {
      utils.crew.list.invalidate();
      toast.success(`${teamTerminology} deactivated`);
    },
    onError: (e) => toast.error(e.message),
  });

  const reactivateMutation = trpc.crew.reactivate.useMutation({
    onSuccess: () => {
      utils.crew.list.invalidate();
      toast.success(`${teamTerminology} reactivated`);
    },
    onError: (e) => toast.error(e.message),
  });

  function openAdd() {
    setEditMember(null);
    setModalOpen(true);
  }

  function openEdit(member: CrewMember) {
    setEditMember(member);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditMember(null);
  }

  const activeCount = (members as CrewMember[]).filter((m) => m.status === "active").length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{teamGroupName}</h1>
          <p className="text-muted-foreground text-sm">
            {`Manage your ${teamTerminologyPlural.toLowerCase()} and their assignments`}
          </p>
        </div>
        <Button onClick={openAdd}>
          <UserPlus className="w-4 h-4 mr-2" />
          {`Add ${teamTerminology}`}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">{`Active ${teamTerminologyPlural}`}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <HardHat className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(members as CrewMember[]).length}</p>
                <p className="text-xs text-muted-foreground">
                  {statusFilter === "all" ? "Total Members" : statusFilter === "active" ? "Active Shown" : "Inactive Shown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter + Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">{teamTerminologyPlural}</CardTitle>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading crew…
            </div>
          ) : (members as CrewMember[]).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">{`No ${teamTerminologyPlural.toLowerCase()} found`}</p>
              <p className="text-xs mt-1">
                {statusFilter === "inactive"
                  ? "No inactive members."
                  : `Add your first ${teamTerminology.toLowerCase()} to get started.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Name</th>
                    <th className="px-4 py-2 text-left font-medium">Role</th>
                    <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">Phone</th>
                    <th className="px-4 py-2 text-left font-medium hidden md:table-cell">Email</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(members as CrewMember[]).map((member) => (
                    <tr
                      key={member.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{member.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {member.role ?? <span className="text-muted-foreground/40 italic">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {member.phone ? (
                          <a
                            href={`tel:${member.phone}`}
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground/40 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {member.email ? (
                          <a
                            href={`mailto:${member.email}`}
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground/40 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={member.status === "active" ? "default" : "secondary"}
                          className={
                            member.status === "active"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100"
                          }
                        >
                          {member.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(member)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {member.status === "active" ? (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => deactivateMutation.mutate({ id: member.id })}
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => reactivateMutation.mutate({ id: member.id })}
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <CrewFormModal
          open={modalOpen}
          onClose={closeModal}
          member={editMember}
          onSaved={closeModal}
        />
      )}
    </div>
  );
}
