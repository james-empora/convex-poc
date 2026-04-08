"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sparkles,
  Pencil,
  Trash2,
  ChevronDown,
  BarChart,
  History,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { AlertDialog } from "@/components/composite/alert-dialog";
import { MarkdownRenderer } from "@/components/composite/markdown-renderer";
import { MarkdownEditor } from "@/components/composite/markdown-editor";
import { api } from "@/convex/_generated/api";
import { useConvexMutationResult, useConvexQueryResult } from "@/lib/convex/hooks";
import { cn } from "@/lib/utils";
import { SKILL_DOMAINS, type SkillDomain } from "@/lib/skills/domains";
import { listToolDefinitions } from "@/lib/tools/catalog";
import type { SkillWithPlacements } from "@/lib/skills/list-skills";
import type { SkillUsageStats } from "@/lib/skills/get-skill-usage";
import type {
  GetHistoryResult,
  AuditEntry,
} from "@/lib/audit/get-history";
import {
  selectedSkillAtom,
  selectedSkillIdAtom,
  skillsActiveTabAtom,
  type SkillTab,
} from "../_lib/atoms";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS: { id: SkillTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Info },
  { id: "usage", label: "Usage", icon: BarChart },
  { id: "history", label: "History", icon: History },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

function formatNumber(n: number) {
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Form schema & helpers
// ---------------------------------------------------------------------------

const formSchema = z.object({
  label: z.string().min(1),
  description: z.string().optional(),
  promptTemplate: z.string().min(1),
  autoSend: z.boolean(),
  enabled: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

type PlacementChecks = Record<string, boolean>;

function buildInitialChecks(skill: SkillWithPlacements): PlacementChecks {
  const checks: PlacementChecks = {};
  for (const [domain, config] of Object.entries(SKILL_DOMAINS)) {
    checks[domain] = skill.placements.some(
      (p) => p.domain === domain && !p.subDomain,
    );
    for (const sub of config.subDomains) {
      checks[`${domain}.${sub}`] = skill.placements.some(
        (p) => p.domain === domain && p.subDomain === sub,
      );
    }
  }
  return checks;
}

function checksToPayload(
  checks: PlacementChecks,
): { domain: string; subDomain?: string; sortOrder: number }[] {
  const placements: { domain: string; subDomain?: string; sortOrder: number }[] =
    [];
  let idx = 0;
  for (const [key, checked] of Object.entries(checks)) {
    if (!checked) continue;
    const parts = key.split(".");
    placements.push({
      domain: parts[0],
      subDomain: parts[1],
      sortOrder: idx++,
    });
  }
  return placements;
}

// ---------------------------------------------------------------------------
// TOOL_DOMAINS constant
// ---------------------------------------------------------------------------

const TOOL_DOMAINS: { label: string; names: string[] }[] = [
  {
    label: "Documents",
    names: [
      "register_client_upload",
      "get_extracted_text",
      "list_file_documents",
    ],
  },
  {
    label: "Files",
    names: [
      "open_file",
      "list_files",
      "get_file",
      "add_file_party",
      "remove_file_party",
    ],
  },
  {
    label: "Entities",
    names: ["read_entities", "search_entities", "create_entity"],
  },
  {
    label: "Audit",
    names: ["get_history"],
  },
];

// ---------------------------------------------------------------------------
// ToolGroup
// ---------------------------------------------------------------------------

function ToolGroup({
  label,
  names,
}: {
  label: string;
  names: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-xs font-medium text-onyx-70 hover:bg-onyx-10"
      >
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            !open && "-rotate-90",
          )}
        />
        {label}
        <span className="ml-auto tabular-nums text-onyx-50">
          {names.length}
        </span>
      </button>
      {open && (
        <div className="ml-5 space-y-0.5 py-1">
          {names.map((name) => (
            <div
              key={name}
              className="rounded px-1.5 py-0.5 text-xs text-onyx-60"
            >
              <code className="text-[11px]">{name}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AvailableToolsSidebar
// ---------------------------------------------------------------------------

function AvailableToolsSidebar() {
  const allTools = useMemo(() => listToolDefinitions(), []);
  const knownNames = useMemo(
    () => new Set(TOOL_DOMAINS.flatMap((g) => g.names)),
    [],
  );
  const otherNames = useMemo(
    () =>
      allTools
        .map((t) => t.gatewayName)
        .filter((n) => !knownNames.has(n)),
    [allTools, knownNames],
  );

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-onyx-50">
        Available Tools ({allTools.length})
      </h3>
      <div className="max-h-[60vh] overflow-y-auto pr-3">
        {TOOL_DOMAINS.map((group) => (
          <ToolGroup
            key={group.label}
            label={group.label}
            names={group.names}
          />
        ))}
        {otherNames.length > 0 && (
          <ToolGroup label="Other" names={otherNames} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OverviewTab
// ---------------------------------------------------------------------------

function OverviewTab({ skill }: { skill: SkillWithPlacements }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const setSelectedId = useSetAtom(selectedSkillIdAtom);
  const updateSkill = useConvexMutationResult(api.skills.updateSkill);
  const deleteSkill = useConvexMutationResult(api.skills.deleteSkill);

  const handleDelete = useCallback(async () => {
    await deleteSkill.mutateAsync({ skillId: skill.id });
    setDeleting(false);
    setSelectedId(null);
    router.refresh();
  }, [deleteSkill, skill.id, router, setSelectedId]);

  const handleToggleEnabled = useCallback(
    async (enabled: boolean) => {
      await updateSkill.mutateAsync({ skillId: skill.id, enabled });
      router.refresh();
    },
    [updateSkill, skill.id, router],
  );

  if (editing) {
    return <SkillEditForm skill={skill} onClose={() => setEditing(false)} />;
  }

  return (
    <div className="space-y-4">
      {/* Skill Details */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Skill Details</CardTitle>
          <div data-slot="card-action" className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => setDeleting(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Description */}
          {skill.description && (
            <div className="mb-4">
              <MarkdownRenderer content={skill.description} />
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-onyx-50">Auto-send</span>
              <p className="font-medium">
                {skill.autoSend ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <span className="text-onyx-50">Status</span>
              <div className="mt-1 flex items-center gap-2">
                <Switch
                  checked={skill.enabled}
                  onCheckedChange={handleToggleEnabled}
                />
                <span className="text-sm">
                  {skill.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
            <div>
              <span className="text-onyx-50">Created</span>
              <p className="font-medium">{formatDate(skill.createdAt)}</p>
            </div>
            <div>
              <span className="text-onyx-50">Updated</span>
              <p className="font-medium">{formatDate(skill.updatedAt)}</p>
            </div>
          </div>

          {/* Domain placements */}
          {skill.placements.length > 0 && (
            <div className="mt-4">
              <span className="text-sm text-onyx-50">Placements</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {skill.placements.map((p) => (
                  <Badge key={p.id} variant="outline">
                    {p.subDomain ? `${p.domain} / ${p.subDomain}` : p.domain}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prompt Template */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Skill</CardTitle>
        </CardHeader>
        <CardContent>
          <MarkdownRenderer content={skill.promptTemplate} />
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleting}
        onOpenChange={setDeleting}
        icon={<Trash2 />}
        heading="Delete Skill"
        description={`Are you sure you want to delete "${skill.label}"? This action cannot be undone.`}
        tone="danger"
        actions={
          <>
            <Button variant="outline" onClick={() => setDeleting(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkillEditForm
// ---------------------------------------------------------------------------

function SkillEditForm({
  skill,
  onClose,
}: {
  skill: SkillWithPlacements;
  onClose: () => void;
}) {
  const router = useRouter();
  const updateSkill = useConvexMutationResult(api.skills.updateSkill);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: skill.label,
      description: skill.description ?? "",
      promptTemplate: skill.promptTemplate,
      autoSend: skill.autoSend,
      enabled: skill.enabled,
    },
  });

  const [placementChecks, setPlacementChecks] = useState<PlacementChecks>(
    () => buildInitialChecks(skill),
  );

  const promptTemplate = watch("promptTemplate");

  const onSubmit = useCallback(
    async (values: FormValues) => {
      await updateSkill.mutateAsync({
        skillId: skill.id,
        label: values.label,
        description: values.description,
        promptTemplate: values.promptTemplate,
        autoSend: values.autoSend,
        enabled: values.enabled,
        placements: checksToPayload(placementChecks),
      });
      router.refresh();
      onClose();
    },
    [updateSkill, skill.id, placementChecks, router, onClose],
  );

  const toggleCheck = useCallback((key: string) => {
    setPlacementChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Header card */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Edit Skill</CardTitle>
          <div data-slot="card-action" className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Slug (read-only) */}
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={skill.slug}
              disabled
              className="bg-onyx-5"
            />
          </div>

          {/* Label */}
          <div>
            <Label htmlFor="label">Label</Label>
            <Input id="label" {...register("label")} />
            {errors.label && (
              <p className="mt-1 text-xs text-red-600">
                {errors.label.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={watch("autoSend")}
                onCheckedChange={(v) => setValue("autoSend", v)}
              />
              <Label>Auto-send</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={watch("enabled")}
                onCheckedChange={(v) => setValue("enabled", v)}
              />
              <Label>Enabled</Label>
            </div>
          </div>

          {/* Domain placements */}
          <div>
            <Label>Domain Placements</Label>
            <div className="mt-2 space-y-2">
              {(
                Object.entries(SKILL_DOMAINS) as [
                  SkillDomain,
                  (typeof SKILL_DOMAINS)[SkillDomain],
                ][]
              ).map(([domain, config]) => (
                <div key={domain}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={placementChecks[domain] ?? false}
                      onCheckedChange={() => toggleCheck(domain)}
                    />
                    <span className="text-sm font-medium">
                      {config.label}
                    </span>
                  </div>
                  {config.subDomains.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1">
                      {config.subDomains.map((sub) => {
                        const key = `${domain}.${sub}`;
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <Checkbox
                              checked={placementChecks[key] ?? false}
                              onCheckedChange={() => toggleCheck(key)}
                            />
                            <span className="text-sm text-onyx-70">
                              {sub}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompt + Tools grid */}
      <div className="grid grid-cols-[3fr_1fr] gap-4">
        {/* Skill prompt */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Skill</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <MarkdownEditor
              value={promptTemplate}
              onChange={(v) => setValue("promptTemplate", v)}
              rows={16}
              mono
              placeholder="Enter the skill prompt template..."
            />
          </CardContent>
        </Card>

        {/* Available Tools sidebar */}
        <Card className="sticky top-4 self-start">
          <CardContent className="pt-3">
            <AvailableToolsSidebar />
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// UsageTab
// ---------------------------------------------------------------------------

function UsageTab({ skill }: { skill: SkillWithPlacements }) {
  const { data: usage, isLoading: loading, isError: error } = useConvexQueryResult(
    api.skills.getUsage,
    { skillId: skill.id },
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-onyx-50">
        Loading usage data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-red-600">
        Failed to load usage data.
      </div>
    );
  }

  if (!usage || usage.totalRuns === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-onyx-50">
        No usage data yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-onyx-50">Total Runs</p>
            <p className="text-2xl font-semibold">
              {formatNumber(usage.totalRuns)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-onyx-50">Success Rate</p>
            <p className="text-2xl font-semibold">
              {(usage.successRate * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-onyx-50">Total Tokens</p>
            <p className="text-2xl font-semibold">
              {formatNumber(usage.totalTokens)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-onyx-50">Last Run</p>
            <p className="text-sm font-medium">
              {usage.lastRunAt ? formatDate(usage.lastRunAt) : "Never"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs table */}
      {usage.recentRuns.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Recent Runs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-onyx-5 text-left text-xs text-onyx-50">
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Tokens</th>
                  <th className="px-4 py-2">Started</th>
                  <th className="px-4 py-2">Completed</th>
                  <th className="px-4 py-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {usage.recentRuns.map((run) => (
                  <tr key={run.id} className="border-b last:border-b-0">
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          run.status === "completed"
                            ? "default"
                            : run.status === "failed"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {run.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {formatNumber(run.tokens)}
                    </td>
                    <td className="px-4 py-2 text-onyx-60">
                      {run.startedAt ? formatDate(run.startedAt) : "-"}
                    </td>
                    <td className="px-4 py-2 text-onyx-60">
                      {run.completedAt ? formatDate(run.completedAt) : "-"}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-2 text-red-600">
                      {run.errorMessage ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldDiff
// ---------------------------------------------------------------------------

function FieldDiff({
  field,
  oldVal,
  newVal,
}: {
  field: string;
  oldVal: unknown;
  newVal: unknown;
}) {
  const isPrompt = field === "prompt_template";

  if (isPrompt) {
    return (
      <div className="mt-2">
        <span className="text-xs font-medium text-onyx-50">{field}</span>
        <div className="mt-1 max-h-[200px] overflow-y-auto rounded border bg-onyx-5 p-2 text-xs">
          <div className="text-red-600 line-through">
            {String(oldVal ?? "")}
          </div>
          <div className="mt-1 text-green-700">{String(newVal ?? "")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1 text-xs">
      <span className="font-medium text-onyx-50">{field}: </span>
      <span className="text-red-600 line-through">
        {JSON.stringify(oldVal)}
      </span>
      {" "}
      <span className="text-green-700">{JSON.stringify(newVal)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HistoryTab
// ---------------------------------------------------------------------------

function HistoryTab({ skill }: { skill: SkillWithPlacements }) {
  const { data: audit, isLoading: loading, isError: error } = useConvexQueryResult(
    api.audit.getHistory,
    { rowId: skill.id, tableName: "skills" },
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-onyx-50">
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-red-600">
        Failed to load history.
      </div>
    );
  }

  if (!audit || audit.items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-onyx-50">
        No history yet.
      </div>
    );
  }

  const operationLabel = (op: string) => {
    switch (op) {
      case "INSERT":
        return <span className="font-medium text-green-700">Created</span>;
      case "UPDATE":
        return <span className="font-medium text-sapphire-70">Updated</span>;
      case "DELETE":
        return <span className="font-medium text-red-600">Deleted</span>;
      default:
        return <span className="font-medium text-onyx-60">{op}</span>;
    }
  };

  return (
    <div className="space-y-3">
      {audit.items.map((entry) => (
        <Card key={entry.id} size="sm">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {operationLabel(entry.operation)}
                {entry.userEmail && (
                  <span className="text-xs text-onyx-50">
                    by {entry.userEmail}
                  </span>
                )}
              </div>
              <span className="text-xs text-onyx-50">
                {formatDate(entry.occurredAt)}
              </span>
            </div>

            {/* Field diffs for UPDATE */}
            {entry.operation === "UPDATE" &&
              entry.changedFields &&
              entry.changedFields.map((field) => {
                const oldData = entry.oldData as Record<string, unknown> | null;
                const newData = entry.newData as Record<string, unknown> | null;
                return (
                  <FieldDiff
                    key={field}
                    field={field}
                    oldVal={oldData?.[field]}
                    newVal={newData?.[field]}
                  />
                );
              })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkillsContentWell (exported)
// ---------------------------------------------------------------------------

export function SkillsContentWell() {
  const skill = useAtomValue(selectedSkillAtom);
  const [activeTab, setActiveTab] = useAtom(skillsActiveTabAtom);

  if (!skill) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-onyx-20 px-12 py-16 text-center">
          <Sparkles className="h-10 w-10 text-onyx-30" />
          <p className="text-sm text-onyx-50">
            Select a skill to view details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="border-b border-onyx-20 bg-white px-2">
        <div className="flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "border-b-2 px-3 py-2 text-xs font-medium",
                  isActive
                    ? "border-sapphire-50 text-sapphire-70"
                    : "border-transparent text-onyx-60 hover:text-onyx-90",
                )}
              >
                <Icon className="mr-1.5 inline-block h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {activeTab === "overview" && <OverviewTab skill={skill} />}
        {activeTab === "usage" && (
          <UsageTab key={skill.id} skill={skill} />
        )}
        {activeTab === "history" && (
          <HistoryTab key={skill.id} skill={skill} />
        )}
      </div>
    </div>
  );
}
