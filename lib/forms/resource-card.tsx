"use client";

import { useState } from "react";
import type { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PencilIcon, XIcon, RotateCcwIcon, SaveIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DynamicDisplay } from "./dynamic-display";
import { getFormVariant } from "./form-variant";
import type { FormFieldDescriptor } from "./schema-to-fields";
import type { SearchProviderMap } from "./search-provider";

// ---------------------------------------------------------------------------
// Variant types
// ---------------------------------------------------------------------------

/**
 * Card mode variants:
 * - `readonly`  — pure display, no editing
 * - `new`       — all fields as inputs for creating a new resource
 * - `editable`  — starts read-only, pencil button toggles all fields to inputs
 * - `inline`    — read-only with per-field click-to-edit
 */
export type ResourceCardVariant = "readonly" | "new" | "editable" | "inline";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ResourceCardProps {
  /** Card title (e.g. entity name, file number) */
  title: string;
  /** Optional subtitle (e.g. entity type, status) */
  subtitle?: string;
  /** Optional badges shown next to the title */
  badges?: { label: string; variant?: "default" | "secondary" | "outline" | "destructive" }[];
  /** Field descriptors produced by schemaToFields() */
  fields: FormFieldDescriptor[];
  /** The current persisted data (ignored for "new" variant) */
  data?: Record<string, unknown>;
  /** Zod schema for validation */
  schema: z.ZodTypeAny;
  /**
   * Card variant — controls editing behavior.
   * If omitted, falls back to the schema's FormVariant annotation,
   * then to "readonly".
   */
  variant?: ResourceCardVariant;
  /**
   * Which fields are editable (for inline/editable variants). Provide:
   * - `true` for all fields (default)
   * - string[] for specific fields
   */
  editableFields?: boolean | string[];
  /** Called when data is saved — receives only changed fields for inline/editable, full data for new */
  onSave?: (data: Record<string, unknown>) => void | Promise<void>;
  /** Submit button label for "new" variant */
  submitLabel?: string;
  /** Search providers for relation comboboxes */
  searchProviders?: SearchProviderMap;
  /** Optional header action slot (e.g. delete button, menu) */
  headerAction?: React.ReactNode;
  /** Additional className for the card */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResourceCard({
  title,
  subtitle,
  badges,
  fields,
  data = {},
  schema,
  variant: variantProp,
  editableFields = true,
  onSave,
  submitLabel = "Create",
  searchProviders,
  headerAction,
  className,
}: ResourceCardProps) {
  // Resolve variant: explicit prop → schema annotation → "readonly"
  const variant = variantProp ?? getFormVariant(schema) ?? "readonly";

  // Editable variant: toggle between read and edit mode
  const [editMode, setEditMode] = useState(false);

  // Track pending changes for inline, editable (edit mode), and new variants
  const [pendingChanges, setPendingChanges] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const dirtyFields = Object.keys(pendingChanges);
  const isDirty = dirtyFields.length > 0;
  const mergedData = { ...data, ...pendingChanges };

  const handleFieldChange = (name: string, value: unknown) => {
    if (variant === "inline") {
      // Inline: save the single field change immediately
      if (onSave && value !== data[name]) {
        onSave({ [name]: value });
      }
      return;
    }
    setPendingChanges((prev) => {
      // For non-new variants, if value reverts to original remove from pending
      if (variant !== "new" && value === data[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSave = async () => {
    if (!onSave || !isDirty) return;
    setSaving(true);
    try {
      await onSave(pendingChanges);
      if (variant === "editable") setEditMode(false);
      setPendingChanges({});
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPendingChanges({});
    if (variant === "editable") setEditMode(false);
  };

  // Determine current display mode
  const displayMode =
    variant === "new"
      ? "edit" as const
      : variant === "editable" && editMode
        ? "edit" as const
        : variant === "inline"
          ? "inline" as const
          : "view" as const;

  // Header action: pencil toggle for editable variant
  const variantHeaderAction =
    variant === "editable" ? (
      <Button
        variant={editMode ? "secondary" : "ghost"}
        size="icon-sm"
        onClick={() => {
          setEditMode(!editMode);
          setPendingChanges({});
        }}
      >
        {editMode ? <XIcon className="size-4" /> : <PencilIcon className="size-4" />}
      </Button>
    ) : (
      headerAction
    );

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-lg font-semibold text-foreground">
              {title}
            </h3>
            {badges?.map((b, i) => (
              <Badge key={i} variant={b.variant ?? "secondary"} className="shrink-0">
                {b.label}
              </Badge>
            ))}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {variantHeaderAction}
          {variant !== "editable" && headerAction}
        </div>
      </div>

      <Separator />

      {/* Fields */}
      <div className="px-5 py-3">
        <DynamicDisplay
          fields={fields}
          data={variant === "new" ? pendingChanges : mergedData}
          schema={schema}
          mode={displayMode}
          editable={variant === "inline" ? editableFields : false}
          onFieldChange={handleFieldChange}
          searchProviders={searchProviders}
          layout="horizontal"
        />
      </div>

      {/* Action bar for new/editable variants — always visible when in edit mode */}
      {(variant === "new" || (variant === "editable" && editMode)) && (
        <>
          <Separator />
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            {isDirty ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {dirtyFields.length}
                </span>{" "}
                field{dirtyFields.length !== 1 ? "s" : ""}{" "}
                {variant === "new" ? "filled" : "changed"}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {variant === "new" ? "Fill in the fields above" : "No changes"}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !isDirty || !onSave}
              >
                <SaveIcon className="mr-1.5 size-3.5" />
                {saving ? "Saving…" : variant === "new" ? submitLabel : "Save Changes"}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
