import { trpc } from "@/lib/trpc";
import { STAGE_LABELS, type Stage } from "@/lib/stages";
import { StageBadge } from "@/components/StageBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Edit,
  Eye,
  Mail,
  Plus,
  Settings,
  Trash2,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";

const VARIABLE_TAGS = [
  "{customer_name}",
  "{first_name}",
  "{project_type}",
  "{project_address}",
  "{quote_amount}",
  "{remaining_balance}",
  "{scheduled_date}",
  "{scheduled_time}",
  "{payment_link}",
  "{company_name}",
  "{review_link}",
];

function RichEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: "Write your email template here..." }),
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="tiptap-editor border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
        {[
          { label: "B", action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
          { label: "I", action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
          { label: "U", action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
          { label: "H2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
          { label: "UL", action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
          { label: "OL", action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              btn.active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function TemplateCard({
  template,
  onEdit,
  onDelete,
  onPreview,
}: {
  template: { id: number; name: string; subject: string; body: string; triggerStage: string | null; isActive: boolean; isDefault: boolean };
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const utils = trpc.useUtils();
  const toggle = trpc.emailTemplates.update.useMutation({
    onSuccess: () => utils.emailTemplates.list.invalidate(),
  });

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold truncate">{template.name}</p>
              {template.isDefault && (
                <Badge variant="secondary" className="text-xs shrink-0">Default</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
            {template.triggerStage && template.triggerStage !== "manual" && (
              <div className="mt-2">
                <StageBadge stage={template.triggerStage as Stage} size="sm" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Switch
              checked={template.isActive}
              onCheckedChange={(v) =>
                toggle.mutate({ id: template.id, data: { isActive: v } })
              }
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Button size="sm" variant="outline" className="flex-1" onClick={onPreview}>
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Preview
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          {!template.isDefault && (
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmailAutomation() {
  const utils = trpc.useUtils();
  const { data: templates, isLoading: templatesLoading } = trpc.emailTemplates.list.useQuery();
  const { data: rules, isLoading: rulesLoading } = trpc.automationRules.list.useQuery();

  const [editTemplate, setEditTemplate] = useState<{
    id?: number;
    name: string;
    subject: string;
    body: string;
    triggerStage: string;
  } | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<{ subject: string; body: string } | null>(null);
  const [createRule, setCreateRule] = useState(false);
  const [newRule, setNewRule] = useState({ name: "", triggerType: "stage_change", triggerStage: "lead", templateId: 0, delayHours: 0 });

  const saveTemplate = trpc.emailTemplates.update.useMutation({
    onSuccess: () => {
      utils.emailTemplates.list.invalidate();
      setEditTemplate(null);
      toast.success("Template saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const createTemplate = trpc.emailTemplates.create.useMutation({
    onSuccess: () => {
      utils.emailTemplates.list.invalidate();
      setEditTemplate(null);
      toast.success("Template created");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteTemplate = trpc.emailTemplates.delete.useMutation({
    onSuccess: () => {
      utils.emailTemplates.list.invalidate();
      toast.success("Template deleted");
    },
  });

  const addRule = trpc.automationRules.create.useMutation({
    onSuccess: () => {
      utils.automationRules.list.invalidate();
      setCreateRule(false);
      toast.success("Rule created");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteRule = trpc.automationRules.delete.useMutation({
    onSuccess: () => utils.automationRules.list.invalidate(),
  });

  const toggleRule = trpc.automationRules.update.useMutation({
    onSuccess: () => utils.automationRules.list.invalidate(),
  });

  const stages = ["lead", "quoted", "scheduled", "in_progress", "completed", "paid"] as const;

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Email Automation</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage email templates and automation rules
        </p>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">
            <Mail className="h-4 w-4 mr-2" />
            Templates ({templates?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Zap className="h-4 w-4 mr-2" />
            Automation Rules ({rules?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Templates are automatically sent when pipeline stages change
            </p>
            <Button
              size="sm"
              onClick={() =>
                setEditTemplate({ name: "", subject: "", body: "", triggerStage: "manual" })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          {/* Variable Reference */}
          <Card className="border bg-blue-50/50 border-blue-100">
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-blue-700 mb-2">Available Variables</p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLE_TAGS.map((tag) => (
                  <code key={tag} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded font-mono">
                    {tag}
                  </code>
                ))}
              </div>
            </CardContent>
          </Card>

          {templatesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates?.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onEdit={() =>
                    setEditTemplate({
                      id: t.id,
                      name: t.name,
                      subject: t.subject,
                      body: t.body,
                      triggerStage: t.triggerStage || "manual",
                    })
                  }
                  onDelete={() => deleteTemplate.mutate({ id: t.id })}
                  onPreview={() => setPreviewTemplate({ subject: t.subject, body: t.body })}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Rules automatically trigger email templates based on pipeline events
            </p>
            <Button size="sm" onClick={() => setCreateRule(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </div>

          {rulesLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : rules?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No automation rules yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules?.map((rule) => (
                <div key={rule.id} className="flex items-center gap-4 p-4 rounded-xl border bg-white shadow-sm">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Zap className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{rule.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {rule.triggerType.replace("_", " ")}
                      </Badge>
                      {rule.triggerStage && (
                        <StageBadge stage={rule.triggerStage as Stage} size="sm" />
                      )}
                      {rule.delayHours && rule.delayHours > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          +{rule.delayHours}h delay
                        </Badge>
                      ) : null}
                      {rule.template && (
                        <span className="text-xs text-muted-foreground">→ {rule.template.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(v) =>
                        toggleRule.mutate({ id: rule.id, data: { isActive: v } })
                      }
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteRule.mutate({ id: rule.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Template Dialog */}
      <Dialog open={!!editTemplate} onOpenChange={(o) => !o && setEditTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTemplate?.id ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          {editTemplate && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Template Name</Label>
                  <Input
                    value={editTemplate.name}
                    onChange={(e) => setEditTemplate({ ...editTemplate, name: e.target.value })}
                    placeholder="e.g., Quote Ready"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Trigger Stage</Label>
                  <Select
                    value={editTemplate.triggerStage}
                    onValueChange={(v) => setEditTemplate({ ...editTemplate, triggerStage: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Only</SelectItem>
                      {stages.map((s) => (
                        <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Subject Line</Label>
                <Input
                  value={editTemplate.subject}
                  onChange={(e) => setEditTemplate({ ...editTemplate, subject: e.target.value })}
                  placeholder="e.g., Your Quote is Ready — {project_type}"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email Body</Label>
                <RichEditor
                  content={editTemplate.body}
                  onChange={(html) => setEditTemplate({ ...editTemplate, body: html })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditTemplate(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={saveTemplate.isPending || createTemplate.isPending}
                  onClick={() => {
                    if (editTemplate.id) {
                      saveTemplate.mutate({
                        id: editTemplate.id,
                        data: {
                          name: editTemplate.name,
                          subject: editTemplate.subject,
                          body: editTemplate.body,
                          triggerStage: editTemplate.triggerStage as "lead" | "quoted" | "scheduled" | "in_progress" | "completed" | "paid" | "manual",
                        },
                      });
                    } else {
                      createTemplate.mutate({
                        name: editTemplate.name,
                        subject: editTemplate.subject,
                        body: editTemplate.body,
                        triggerStage: editTemplate.triggerStage as "lead" | "quoted" | "scheduled" | "in_progress" | "completed" | "paid" | "manual",
                      });
                    }
                  }}
                >
                  Save Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="mt-2">
              <div className="bg-muted/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Subject</p>
                <p className="font-medium">{previewTemplate.subject}</p>
              </div>
              <div className="border rounded-lg p-4 prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: previewTemplate.body }} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Rule Dialog */}
      <Dialog open={createRule} onOpenChange={setCreateRule}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Automation Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Rule Name</Label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="e.g., Send quote on stage change"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Trigger Stage</Label>
              <Select
                value={newRule.triggerStage}
                onValueChange={(v) => setNewRule({ ...newRule, triggerStage: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Email Template</Label>
              <Select
                value={String(newRule.templateId)}
                onValueChange={(v) => setNewRule({ ...newRule, templateId: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Delay (hours after trigger)</Label>
              <Input
                type="number"
                value={newRule.delayHours}
                onChange={(e) => setNewRule({ ...newRule, delayHours: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setCreateRule(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!newRule.name || !newRule.templateId || addRule.isPending}
                onClick={() =>
                  addRule.mutate({
                    name: newRule.name,
                    triggerType: "stage_change",
                    triggerStage: newRule.triggerStage as Stage,
                    templateId: newRule.templateId,
                    delayHours: newRule.delayHours,
                    isActive: true,
                  })
                }
              >
                Create Rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
