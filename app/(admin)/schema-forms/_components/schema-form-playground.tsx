"use client";

import { useState, useMemo, useCallback } from "react";
import { useConvex } from "convex/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResourceCard, type ResourceCardVariant } from "@/lib/forms/resource-card";
import { getFormVariant } from "@/lib/forms/form-variant";
import { schemaToFields } from "@/lib/forms/schema-to-fields";
import type { FormFieldDescriptor } from "@/lib/forms/schema-to-fields";
import { SCHEMA_REGISTRY } from "@/lib/forms/schema-registry";
import type { SearchProviderMap } from "@/lib/forms/search-provider";
import { api } from "@/convex/_generated/api";

// ---------------------------------------------------------------------------
// Variant config
// ---------------------------------------------------------------------------

const VARIANTS: { value: ResourceCardVariant; label: string; description: string }[] = [
  { value: "readonly", label: "Read-only", description: "Pure display, no editing" },
  { value: "new", label: "New", description: "Create form for new resources" },
  { value: "editable", label: "Editable", description: "Toggle between read and edit modes" },
  { value: "inline", label: "Inline", description: "Click individual fields to edit" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SchemaFormPlayground() {
  const convex = useConvex();
  const [selectedSchema, setSelectedSchema] = useState<string>("");
  const [variantOverride, setVariantOverride] = useState<ResourceCardVariant | null>(null);
  const [lastSave, setLastSave] = useState<Record<string, unknown> | null>(null);

  const entry = SCHEMA_REGISTRY.find((s) => s.name === selectedSchema);
  const schemaDefault = entry ? getFormVariant(entry.schema) : undefined;
  const variant = variantOverride ?? schemaDefault ?? "inline";
  const fields = useMemo(
    () => (entry ? schemaToFields(entry.schema) : null),
    [entry],
  );

  const sampleData = useMemo(
    () => (fields ? buildSampleData(fields) : {}),
    [fields],
  );

  const handleSave = useCallback(async (data: Record<string, unknown>) => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500));
    setLastSave(data);
  }, []);

  const searchProviders = useMemo<SearchProviderMap>(
    () => ({
      entities: {
        searchPlaceholder: "Search by name or email…",
        emptyMessage: "No entities found.",
        search: async (query) => {
          const result = await convex.query(api.entities.searchEntities, { query, limit: 10 });
          return result.map((entity) => ({
            value: entity.entityId,
            label: entity.name,
            secondary: entity.email ?? undefined,
          }));
        },
      },
      files: {
        searchPlaceholder: "Search files…",
        emptyMessage: "No files found.",
        search: async () => {
          const result = await convex.query(api.files.listFiles, {});
          return result.items.map((file) => ({
            value: file.id,
            label: file.fileNumber ?? file.id,
            secondary: file.propertyAddress ?? undefined,
          }));
        },
      },
    }),
    [convex],
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-foreground">Schema</label>
          <Select
            value={selectedSchema}
            onValueChange={(v) => {
              setSelectedSchema(v);
              setVariantOverride(null);
              setLastSave(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a schema…" />
            </SelectTrigger>
            <SelectContent>
              {SCHEMA_REGISTRY.map((s) => (
                <SelectItem key={s.name} value={s.name}>
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    — {s.description}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedSchema && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Variant</label>
            <div className="flex rounded-lg border border-border">
              {VARIANTS.map((v) => (
                <Button
                  key={v.value}
                  variant={variant === v.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setVariantOverride(v.value);
                    setLastSave(null);
                  }}
                  className="rounded-none first:rounded-l-lg last:rounded-r-lg"
                >
                  {v.label}
                  {v.value === schemaDefault && (
                    <span className="ml-1 text-[10px] opacity-60">default</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Variant description */}
      {selectedSchema && (
        <p className="text-sm text-muted-foreground">
          {VARIANTS.find((v) => v.value === variant)?.description}
        </p>
      )}

      {/* Resource Card */}
      {fields && entry && (
        <ResourceCard
          key={`${selectedSchema}-${variant}`}
          title={variant === "new" ? `New ${entry.name}` : cardTitle(entry.name, sampleData)}
          subtitle={entry.description}
          badges={[]}
          fields={fields}
          data={variant === "new" ? {} : sampleData}
          schema={entry.schema}
          variant={variant}
          onSave={handleSave}
          submitLabel="Create"
          searchProviders={searchProviders}
        />
      )}

      {/* Save result */}
      {lastSave && (
        <div className="rounded-lg border border-success-60/30 bg-success-20/30 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-success-80">
            {variant === "new" ? "Created (full payload)" : "Saved Changes (PATCH payload)"}
          </p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs text-foreground">
            {JSON.stringify(lastSave, null, 2)}
          </pre>
        </div>
      )}

      {/* Empty state */}
      {!selectedSchema && (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-16 text-center">
          <div>
            <p className="text-muted-foreground">
              Select a schema above to generate a resource card
            </p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              {SCHEMA_REGISTRY.length} schemas available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cardTitle(schemaName: string, data: Record<string, unknown>): string {
  if (data.firstName && data.lastName) return `${data.firstName} ${data.lastName}`;
  if (data.legalName) return String(data.legalName);
  if (data.name) return String(data.name);
  if (data.title) return String(data.title);
  return schemaName;
}

function buildSampleData(fields: FormFieldDescriptor[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.optional && Math.random() > 0.6) continue;
    switch (f.type) {
      case "text":
        data[f.name] = f.name === "query" ? "John Smith" : `Sample ${f.label}`;
        break;
      case "number":
        data[f.name] = f.constraints.min ?? 0;
        break;
      case "boolean":
        data[f.name] = true;
        break;
      case "enum":
        data[f.name] = f.enumOptions?.[0]?.value ?? "";
        break;
      case "uuid":
        data[f.name] = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
        break;
      case "date":
        data[f.name] = "2026-04-01";
        break;
      default:
        data[f.name] = `Sample ${f.label}`;
    }
  }
  return data;
}
