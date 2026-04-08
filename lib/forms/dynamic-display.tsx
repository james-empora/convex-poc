"use client";

import { useState, useRef, useEffect, createContext, useContext } from "react";
import type { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { PencilIcon, CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormFieldDescriptor } from "@/lib/forms/schema-to-fields";
import type { SearchProviderMap } from "@/lib/forms/search-provider";

// ---------------------------------------------------------------------------
// Context for search providers (shared with inline edit comboboxes)
// ---------------------------------------------------------------------------

const SearchProviderContext = createContext<SearchProviderMap>({});

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DynamicDisplayProps {
  /** Field descriptors produced by schemaToFields() */
  fields: FormFieldDescriptor[];
  /** The current data to display */
  data: Record<string, unknown>;
  /**
   * The Zod schema for validation during inline edits.
   * When provided, inline edits validate the full object before accepting.
   */
  schema?: z.ZodTypeAny;
  /**
   * Display mode:
   * - `"view"` (default) — read-only display
   * - `"inline"` — read-only with click-to-edit per field
   * - `"edit"` — all fields render as inputs simultaneously (no check/X icons)
   */
  mode?: "view" | "inline" | "edit";
  /**
   * Which fields are editable (for inline mode only). Provide:
   * - `true` to make all fields editable
   * - an array of field names to make specific fields editable
   * - omit or `false` for fully read-only
   */
  editable?: boolean | string[];
  /** Called when a field value changes via inline or edit mode */
  onFieldChange?: (name: string, value: unknown) => void;
  /** Search providers for relation comboboxes (same as DynamicForm) */
  searchProviders?: SearchProviderMap;
  /** Layout: "vertical" (stacked label + value) or "horizontal" (side-by-side) */
  layout?: "vertical" | "horizontal";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DynamicDisplay({
  fields,
  data,
  schema,
  mode = "view",
  editable = false,
  onFieldChange,
  searchProviders = {},
  layout = "horizontal",
}: DynamicDisplayProps) {
  // For inline mode, determine which fields are editable
  const editableSet =
    editable === true
      ? null // null = all editable
      : editable === false
        ? new Set<string>()
        : new Set(editable);

  const isEditable = (name: string) =>
    editableSet === null || editableSet.has(name);

  return (
    <SearchProviderContext value={searchProviders}>
      <div
        className={cn(
          "divide-y divide-border",
          layout === "vertical" && "space-y-4 divide-y-0",
        )}
      >
        {fields.map((field) => (
          <DisplayField
            key={field.name}
            descriptor={field}
            value={data[field.name]}
            allData={data}
            schema={schema}
            mode={mode}
            inlineEditable={mode === "inline" && isEditable(field.name)}
            onFieldChange={onFieldChange}
            layout={layout}
          />
        ))}
      </div>
    </SearchProviderContext>
  );
}

// ---------------------------------------------------------------------------
// Individual display field
// ---------------------------------------------------------------------------

function DisplayField({
  descriptor,
  value,
  allData,
  schema,
  mode,
  inlineEditable,
  onFieldChange,
  layout,
}: {
  descriptor: FormFieldDescriptor;
  value: unknown;
  allData: Record<string, unknown>;
  schema?: z.ZodTypeAny;
  mode: "view" | "inline" | "edit";
  inlineEditable: boolean;
  onFieldChange?: (name: string, value: unknown) => void;
  layout: "vertical" | "horizontal";
}) {
  const { name, label, description, optional } = descriptor;
  const [editing, setEditing] = useState(false);

  const handleInlineSave = (newValue: unknown) => {
    if (schema) {
      const testData = { ...allData, [name]: newValue };
      if (!schema.safeParse(testData).success) return false;
    }
    onFieldChange?.(name, newValue);
    setEditing(false);
    return true;
  };

  const handleInlineCancel = () => {
    setEditing(false);
  };

  const handleEditModeChange = (newValue: unknown) => {
    onFieldChange?.(name, newValue);
  };

  const optionalTag = optional && (mode === "edit" || mode === "inline") ? (
    <span className="ml-1 text-muted-foreground font-normal">(optional)</span>
  ) : null;

  // Edit mode — all fields render as inputs simultaneously
  if (mode === "edit") {
    return (
      <div
        className={cn(
          "py-3",
          layout === "horizontal" && "grid grid-cols-[1fr_2fr] gap-4 items-start",
        )}
      >
        <dt className="text-sm font-medium text-muted-foreground pt-2">
          {label}
          {optionalTag}
        </dt>
        <dd className={layout !== "horizontal" ? "mt-1" : undefined}>
          <EditField
            descriptor={descriptor}
            value={value}
            onChange={handleEditModeChange}
          />
        </dd>
      </div>
    );
  }

  // Inline mode — currently editing this field
  if (editing && inlineEditable) {
    return (
      <div
        className={cn(
          "py-3",
          layout === "horizontal" && "grid grid-cols-[1fr_2fr_auto] gap-4 items-start",
        )}
      >
        <dt className="text-sm font-medium text-muted-foreground pt-2">
          {label}
          {optionalTag}
        </dt>
        <dd className={layout === "horizontal" ? "col-span-2" : "mt-1"}>
          <InlineEditor
            descriptor={descriptor}
            value={value}
            onSave={handleInlineSave}
            onCancel={handleInlineCancel}
          />
        </dd>
      </div>
    );
  }

  // View / inline (not editing) — read-only display
  return (
    <div
      className={cn(
        "group py-3",
        layout === "horizontal" && "grid grid-cols-[1fr_2fr_auto] gap-4 items-start",
        inlineEditable && "cursor-pointer hover:bg-accent/30 transition-colors",
      )}
      onClick={inlineEditable ? () => setEditing(true) : undefined}
    >
      <dt className="text-sm font-medium text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "text-sm text-foreground",
          layout !== "horizontal" && "mt-1",
        )}
      >
        <FormattedValue descriptor={descriptor} value={value} />
        {description && layout === "vertical" && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </dd>
      {inlineEditable && layout === "horizontal" && (
        <div className="flex items-center pt-0.5">
          <PencilIcon className="size-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        </div>
      )}
      {inlineEditable && layout !== "horizontal" && (
        <PencilIcon className="absolute right-0 top-3 size-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formatted value — renders the right display for each field type
// ---------------------------------------------------------------------------

function FormattedValue({
  descriptor,
  value,
}: {
  descriptor: FormFieldDescriptor;
  value: unknown;
}) {
  const { type, enumOptions, nullable } = descriptor;

  if (value === null || value === undefined || value === "") {
    return (
      <span className="text-muted-foreground italic">
        {nullable ? "null" : "—"}
      </span>
    );
  }

  switch (type) {
    case "boolean":
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Yes" : "No"}
        </Badge>
      );

    case "enum": {
      const match = enumOptions?.find((o) => o.value === String(value));
      return <span>{match?.label ?? String(value)}</span>;
    }

    case "uuid":
      return (
        <span className="font-mono text-xs" title={String(value)}>
          {String(value).slice(0, 8)}…
        </span>
      );

    case "number":
      return <span className="font-mono">{String(value)}</span>;

    case "date":
      return <span>{String(value)}</span>;

    case "textarea":
      return <p className="whitespace-pre-wrap">{String(value)}</p>;

    case "text":
    default:
      return <span>{String(value)}</span>;
  }
}

// ---------------------------------------------------------------------------
// EditField — always-visible input for "edit" mode (no check/X actions)
// ---------------------------------------------------------------------------

function EditField({
  descriptor,
  value,
  onChange,
}: {
  descriptor: FormFieldDescriptor;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { type, enumOptions, constraints, optional, relation, name, label } = descriptor;
  const [localValue, setLocalValue] = useState(value ?? "");
  const [comboboxOptions, setComboboxOptions] = useState<{ value: string; label: string; secondary?: string }[]>([]);
  const [comboboxLoading, setComboboxLoading] = useState(false);
  const searchProviders = useContext(SearchProviderContext);

  const commitValue = (v: unknown) => {
    setLocalValue(v as string);
    onChange(v === "" && optional ? undefined : v);
  };

  // Relation field → combobox
  if (relation && searchProviders[relation.domain]) {
    const provider = searchProviders[relation.domain];
    return (
      <Combobox
        value={String(localValue)}
        onChange={commitValue}
        options={comboboxOptions}
        onSearch={async (q) => {
          if (q.length < 1) { setComboboxOptions([]); return; }
          setComboboxLoading(true);
          try { setComboboxOptions(await provider.search(q)); } finally { setComboboxLoading(false); }
        }}
        loading={comboboxLoading}
        placeholder={`Search ${label.toLowerCase()}…`}
        searchPlaceholder={provider.searchPlaceholder}
        emptyMessage={provider.emptyMessage}
      />
    );
  }

  // Boolean → switch
  if (type === "boolean") {
    return (
      <Switch
        checked={!!localValue}
        onCheckedChange={commitValue}
      />
    );
  }

  // Enum → select or radio
  if (type === "enum" && enumOptions) {
    if (enumOptions.length <= 3) {
      return (
        <RadioGroup
          value={String(localValue)}
          onValueChange={commitValue}
          className="flex flex-wrap gap-3"
        >
          {enumOptions.map((opt) => (
            <div key={opt.value} className="flex items-center gap-1.5">
              <RadioGroupItem value={opt.value} id={`edit-${name}-${opt.value}`} />
              <label htmlFor={`edit-${name}-${opt.value}`} className="text-sm cursor-pointer">
                {opt.label}
              </label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    return (
      <Select value={String(localValue)} onValueChange={commitValue}>
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {enumOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Number
  if (type === "number") {
    return (
      <Input
        type="number"
        step={constraints.isInteger ? "1" : "any"}
        min={constraints.min}
        max={constraints.max}
        value={String(localValue)}
        onChange={(e) => {
          const v = e.target.value === "" ? "" : Number(e.target.value);
          setLocalValue(v);
        }}
        onBlur={() => onChange(localValue === "" && optional ? undefined : localValue)}
        className="h-8"
      />
    );
  }

  // Textarea
  if (type === "textarea") {
    return (
      <Textarea
        value={String(localValue)}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => onChange(localValue === "" && optional ? undefined : localValue)}
        className="min-h-16"
      />
    );
  }

  // Default: text input
  return (
    <Input
      type={type === "date" ? "date" : "text"}
      placeholder={type === "uuid" ? "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" : label}
      maxLength={constraints.maxLength}
      value={String(localValue)}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => onChange(localValue === "" && optional ? undefined : localValue)}
      className="h-8"
    />
  );
}

// ---------------------------------------------------------------------------
// InlineEditor — for inline mode with check/X actions
// ---------------------------------------------------------------------------

function InlineEditor({
  descriptor,
  value,
  onSave,
  onCancel,
}: {
  descriptor: FormFieldDescriptor;
  value: unknown;
  onSave: (value: unknown) => boolean;
  onCancel: () => void;
}) {
  const { type, enumOptions, constraints, optional, relation, name, label } = descriptor;
  const [localValue, setLocalValue] = useState(value ?? "");
  const [comboboxOptions, setComboboxOptions] = useState<{ value: string; label: string; secondary?: string }[]>([]);
  const [comboboxLoading, setComboboxLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchProviders = useContext(SearchProviderContext);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSave(localValue === "" && optional ? undefined : localValue);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const saveAndClose = () => {
    onSave(localValue === "" && optional ? undefined : localValue);
  };

  // Relation field → combobox
  if (relation && searchProviders[relation.domain]) {
    const provider = searchProviders[relation.domain];

    return (
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Combobox
            value={String(localValue)}
            onChange={(v) => {
              setLocalValue(v);
              onSave(v);
            }}
            options={comboboxOptions}
            onSearch={async (q) => {
              if (q.length < 1) { setComboboxOptions([]); return; }
              setComboboxLoading(true);
              try { setComboboxOptions(await provider.search(q)); } finally { setComboboxLoading(false); }
            }}
            loading={comboboxLoading}
            placeholder={`Search ${label.toLowerCase()}…`}
            searchPlaceholder={provider.searchPlaceholder}
            emptyMessage={provider.emptyMessage}
          />
        </div>
        <button type="button" onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
          <XIcon className="size-4" />
        </button>
      </div>
    );
  }

  // Boolean → switch
  if (type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={!!localValue}
          onCheckedChange={(checked) => {
            setLocalValue(checked);
            onSave(checked);
          }}
        />
        <button type="button" onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
          <XIcon className="size-4" />
        </button>
      </div>
    );
  }

  // Enum → select or radio
  if (type === "enum" && enumOptions) {
    if (enumOptions.length <= 3) {
      return (
        <div className="flex items-center gap-2">
          <RadioGroup
            value={String(localValue)}
            onValueChange={(v) => {
              setLocalValue(v);
              onSave(v);
            }}
            className="flex flex-wrap gap-3"
          >
            {enumOptions.map((opt) => (
              <div key={opt.value} className="flex items-center gap-1.5">
                <RadioGroupItem value={opt.value} id={`edit-${name}-${opt.value}`} />
                <label htmlFor={`edit-${name}-${opt.value}`} className="text-sm cursor-pointer">
                  {opt.label}
                </label>
              </div>
            ))}
          </RadioGroup>
          <button type="button" onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
            <XIcon className="size-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Select
          value={String(localValue)}
          onValueChange={(v) => {
            setLocalValue(v);
            onSave(v);
          }}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {enumOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button type="button" onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
          <XIcon className="size-4" />
        </button>
      </div>
    );
  }

  // Number
  if (type === "number") {
    return (
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="number"
          step={constraints.isInteger ? "1" : "any"}
          min={constraints.min}
          max={constraints.max}
          value={String(localValue)}
          onChange={(e) => setLocalValue(e.target.value === "" ? "" : Number(e.target.value))}
          onKeyDown={handleKeyDown}
          onBlur={saveAndClose}
          className="h-8"
        />
        <button type="button" onClick={() => onSave(localValue)} className="p-1 text-muted-foreground hover:text-foreground">
          <CheckIcon className="size-4" />
        </button>
        <button type="button" onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
          <XIcon className="size-4" />
        </button>
      </div>
    );
  }

  // Textarea
  if (type === "textarea") {
    return (
      <div className="space-y-2">
        <Textarea
          value={String(localValue)}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { e.preventDefault(); onCancel(); }
          }}
          className="min-h-16"
          autoFocus
        />
        <div className="flex gap-2">
          <button type="button" onClick={() => onSave(localValue)} className="p-1 text-muted-foreground hover:text-foreground">
            <CheckIcon className="size-4" />
          </button>
          <button type="button" onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
            <XIcon className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  // Default: text input
  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        type={type === "date" ? "date" : "text"}
        placeholder={type === "uuid" ? "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" : label}
        maxLength={constraints.maxLength}
        value={String(localValue)}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={saveAndClose}
        className="h-8"
      />
      <button type="button" onClick={() => onSave(localValue)} className="p-1 text-muted-foreground hover:text-foreground">
        <CheckIcon className="size-4" />
      </button>
      <button type="button" onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
