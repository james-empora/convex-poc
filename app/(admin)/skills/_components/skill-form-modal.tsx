"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/composite/markdown-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { useConvexMutationResult } from "@/lib/convex/hooks";
import { SKILL_DOMAINS, type SkillDomain } from "@/lib/skills/domains";
import { listToolDefinitions } from "@/lib/tools/catalog";

const formSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  label: z.string().min(1, "Label is required"),
  description: z.string().optional(),
  promptTemplate: z.string().min(1, "Prompt template is required"),
  autoSend: z.boolean(),
  enabled: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

/** key format: "domain" or "domain:subDomain" */
type PlacementChecks = Record<string, boolean>;

function checksToPayload(checks: PlacementChecks) {
  const result: { domain: string; subDomain?: string; sortOrder: number }[] = [];
  let i = 0;
  for (const [key, checked] of Object.entries(checks)) {
    if (!checked) continue;
    const [domain, subDomain] = key.split(":");
    result.push({ domain, subDomain, sortOrder: i++ });
  }
  return result;
}

function AvailableToolsPanel() {
  const [open, setOpen] = useState(false);
  const tools = useMemo(() => listToolDefinitions(), []);

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        className="flex items-center gap-1.5 text-sm font-medium text-onyx-60 hover:text-onyx-80 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
        />
        Available Tools ({tools.length})
      </button>
      {open && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-onyx-20 p-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {tools.map((tool) => (
              <div key={tool.toolName} className="flex items-center gap-1.5 py-0.5">
                <code className="font-mono text-[11px] text-onyx-70">
                  {tool.gatewayName}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SkillFormModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export function SkillFormModal({ onClose, onSaved }: SkillFormModalProps) {
  const [checks, setChecks] = useState<PlacementChecks>({});
  const createSkill = useConvexMutationResult(api.skills.createSkill);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: "",
      label: "",
      description: "",
      promptTemplate: "",
      autoSend: true,
      enabled: true,
    },
  });

  const toggle = (key: string) =>
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));

  const onSubmit = async (values: FormValues) => {
    const placements = checksToPayload(checks);
    await createSkill.mutateAsync({
      slug: values.slug,
      label: values.label,
      description: values.description || undefined,
      promptTemplate: values.promptTemplate,
      autoSend: values.autoSend,
      enabled: values.enabled,
      placements,
    });
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] sm:max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Skill</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="e.g. what-if-analysis"
            />
            {errors.slug && (
              <p className="text-xs text-red-600">{errors.slug.message}</p>
            )}
          </div>

          {/* Label */}
          <div className="space-y-1.5">
            <Label htmlFor="label">Label</Label>
            <Input id="label" {...register("label")} placeholder="Display name" />
            {errors.label && (
              <p className="text-xs text-red-600">{errors.label.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Short description for dropdowns"
              rows={3}
            />
          </div>

          {/* Prompt template */}
          <div className="space-y-1.5">
            <Label>Skill</Label>
            <MarkdownEditor
              value={watch("promptTemplate")}
              onChange={(v) => setValue("promptTemplate", v, { shouldValidate: true })}
              placeholder="The prompt text sent to the AI chat (supports markdown)..."
              rows={10}
              mono
            />
            {errors.promptTemplate && (
              <p className="text-xs text-red-600">{errors.promptTemplate.message}</p>
            )}
          </div>

          {/* Available tools reference */}
          <AvailableToolsPanel />

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="autoSend"
                checked={watch("autoSend")}
                onCheckedChange={(v) => setValue("autoSend", v)}
              />
              <Label htmlFor="autoSend" className="text-sm">Auto-send</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="enabled"
                checked={watch("enabled")}
                onCheckedChange={(v) => setValue("enabled", v)}
              />
              <Label htmlFor="enabled" className="text-sm">Enabled</Label>
            </div>
          </div>

          {/* Domain placements */}
          <div className="space-y-3">
            <Label>Domain Placements</Label>
            <div className="space-y-3 rounded-lg border border-onyx-20 p-3">
              {(Object.entries(SKILL_DOMAINS) as [SkillDomain, (typeof SKILL_DOMAINS)[SkillDomain]][]).map(
                ([domain, meta]) => {
                  const hasAnySub = meta.subDomains.length > 0;

                  return (
                    <div key={domain} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`domain-${domain}`}
                          checked={!!checks[domain]}
                          onCheckedChange={() => toggle(domain)}
                        />
                        <Label htmlFor={`domain-${domain}`} className="text-sm font-medium">
                          {meta.label}
                        </Label>
                        {!hasAnySub && (
                          <span className="text-xs text-onyx-40">(all)</span>
                        )}
                      </div>
                      {hasAnySub && (
                        <div className="ml-6 flex flex-wrap gap-x-4 gap-y-1.5">
                          {meta.subDomains.map((sub) => {
                            const key = `${domain}:${sub}`;
                            return (
                              <div key={sub} className="flex items-center gap-1.5">
                                <Checkbox
                                  id={`domain-${domain}-${sub}`}
                                  checked={!!checks[key]}
                                  onCheckedChange={() => toggle(key)}
                                />
                                <Label
                                  htmlFor={`domain-${domain}-${sub}`}
                                  className="text-xs text-onyx-60"
                                >
                                  {sub}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Skill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
