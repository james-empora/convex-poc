"use client";

import { useMemo, useState, createContext, useContext } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FormFieldDescriptor } from "@/lib/forms/schema-to-fields";
import type { SearchProviderMap } from "@/lib/forms/search-provider";

// ---------------------------------------------------------------------------
// Search provider context — passed down from DynamicForm to field renderers
// ---------------------------------------------------------------------------

const SearchProviderContext = createContext<SearchProviderMap>({});

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DynamicFormProps {
  /** Field descriptors produced by schemaToFields() */
  fields: FormFieldDescriptor[];
  /** The Zod schema used for validation */
  schema: z.ZodTypeAny;
  /** Called with the validated form data on submit */
  onSubmit?: (data: Record<string, unknown>) => void;
  /** Submit button label */
  submitLabel?: string;
  /** Optional default values */
  defaultValues?: Record<string, unknown>;
  /** If true, shows a JSON preview of the current form state */
  debug?: boolean;
  /**
   * Search providers for relation fields. Keys are domain names matching
   * the `domain` in FormRelation annotations (e.g. "entities", "files").
   */
  searchProviders?: SearchProviderMap;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DynamicForm({
  fields,
  schema,
  onSubmit,
  submitLabel = "Submit",
  defaultValues,
  debug = false,
  searchProviders = {},
}: DynamicFormProps) {
  const resolver = useMemo(
    () => zodResolver(schema as any) as any,
    [schema],
  );

  const form = useForm<Record<string, unknown>>({
    resolver,
    defaultValues: defaultValues ?? buildDefaultValues(fields),
    mode: "onBlur",
  });

  function handleSubmit(data: Record<string, unknown>) {
    onSubmit?.(data);
  }

  return (
    <SearchProviderContext value={searchProviders}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-5"
        >
          {fields.map((field) => (
            <DynamicField key={field.name} descriptor={field} />
          ))}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {submitLabel}
            </Button>
            {form.formState.isSubmitted && !form.formState.isValid && (
              <p className="text-sm text-destructive">
                Please fix the errors above.
              </p>
            )}
          </div>

          {debug && (
            <DebugPanel values={form.watch()} errors={form.formState.errors} />
          )}
        </form>
      </Form>
    </SearchProviderContext>
  );
}

// ---------------------------------------------------------------------------
// Individual field renderer
// ---------------------------------------------------------------------------

function DynamicField({ descriptor }: { descriptor: FormFieldDescriptor }) {
  const { name, label, type, description, optional, enumOptions, constraints, relation } =
    descriptor;
  const searchProviders = useContext(SearchProviderContext);

  return (
    <FormField
      name={name}
      render={({ field }) => {
        // Relation field → searchable combobox
        if (relation && searchProviders[relation.domain]) {
          return (
            <RelationComboboxField
              field={field}
              descriptor={descriptor}
            />
          );
        }

        // Boolean fields use a switch layout
        if (type === "boolean") {
          return (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-0.5">
                <FormLabel className="text-sm">
                  {label}
                  {optional && (
                    <span className="ml-1 text-muted-foreground font-normal">
                      (optional)
                    </span>
                  )}
                </FormLabel>
                {description && (
                  <FormDescription>{description}</FormDescription>
                )}
              </div>
              <FormMessage />
            </FormItem>
          );
        }

        // Enum with ≤3 options → radio group, >3 → select dropdown
        if (type === "enum" && enumOptions) {
          if (enumOptions.length <= 3) {
            return (
              <FormItem>
                <FormLabel>
                  {label}
                  {optional && (
                    <span className="ml-1 text-muted-foreground font-normal">
                      (optional)
                    </span>
                  )}
                </FormLabel>
                {description && (
                  <FormDescription>{description}</FormDescription>
                )}
                <FormControl>
                  <RadioGroup
                    value={(field.value as string) ?? ""}
                    onValueChange={field.onChange}
                    className="flex flex-wrap gap-4"
                  >
                    {enumOptions.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <RadioGroupItem
                          value={opt.value}
                          id={`${name}-${opt.value}`}
                        />
                        <label
                          htmlFor={`${name}-${opt.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }

          return (
            <FormItem>
              <FormLabel>
                {label}
                {optional && (
                  <span className="ml-1 text-muted-foreground font-normal">
                    (optional)
                  </span>
                )}
              </FormLabel>
              {description && (
                <FormDescription>{description}</FormDescription>
              )}
              <Select
                value={(field.value as string) ?? ""}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={`Select ${label.toLowerCase()}…`}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {optional && (
                    <SelectItem value="__none__">
                      <span className="text-muted-foreground">None</span>
                    </SelectItem>
                  )}
                  {enumOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          );
        }

        // Number input
        if (type === "number") {
          return (
            <FormItem>
              <FormLabel>
                {label}
                {optional && (
                  <span className="ml-1 text-muted-foreground font-normal">
                    (optional)
                  </span>
                )}
              </FormLabel>
              {description && (
                <FormDescription>{description}</FormDescription>
              )}
              <FormControl>
                <Input
                  type="number"
                  step={constraints.isInteger ? "1" : "any"}
                  min={constraints.min}
                  max={constraints.max}
                  placeholder={label}
                  value={(field.value as string) ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : Number(val));
                  }}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }

        // Textarea (for long text fields)
        if (type === "textarea") {
          return (
            <FormItem>
              <FormLabel>
                {label}
                {optional && (
                  <span className="ml-1 text-muted-foreground font-normal">
                    (optional)
                  </span>
                )}
              </FormLabel>
              {description && (
                <FormDescription>{description}</FormDescription>
              )}
              <FormControl>
                <Textarea
                  placeholder={label}
                  {...field}
                  value={(field.value as string) ?? ""}
                />
              </FormControl>
              {constraints.maxLength && (
                <p className="text-muted-foreground text-xs text-right">
                  {((field.value as string) ?? "").length}/
                  {constraints.maxLength}
                </p>
              )}
              <FormMessage />
            </FormItem>
          );
        }

        // Default: text input (also covers uuid, date)
        return (
          <FormItem>
            <FormLabel>
              {label}
              {optional && (
                <span className="ml-1 text-muted-foreground font-normal">
                  (optional)
                </span>
              )}
            </FormLabel>
            {description && (
              <FormDescription>{description}</FormDescription>
            )}
            <FormControl>
              <Input
                type={type === "date" ? "date" : "text"}
                placeholder={
                  type === "uuid"
                    ? "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    : label
                }
                maxLength={constraints.maxLength}
                minLength={constraints.minLength}
                {...field}
                value={(field.value as string) ?? ""}
              />
            </FormControl>
            {constraints.maxLength && type !== "date" && (
              <p className="text-muted-foreground text-xs text-right">
                {((field.value as string) ?? "").length}/
                {constraints.maxLength}
              </p>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Relation combobox field
// ---------------------------------------------------------------------------

function RelationComboboxField({
  field,
  descriptor,
}: {
  field: { value: unknown; onChange: (value: unknown) => void; onBlur: () => void };
  descriptor: FormFieldDescriptor;
}) {
  const { name, label, description, optional, relation } = descriptor;
  const searchProviders = useContext(SearchProviderContext);
  const provider = relation ? searchProviders[relation.domain] : undefined;

  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    if (!provider) return;
    if (query.length < 1) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const results = await provider.search(query);
      setOptions(results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormField
      name={name}
      render={() => (
        <FormItem>
          <FormLabel>
            {label}
            {optional && (
              <span className="ml-1 text-muted-foreground font-normal">
                (optional)
              </span>
            )}
          </FormLabel>
          {description && (
            <FormDescription>{description}</FormDescription>
          )}
          <FormControl>
            <Combobox
              value={(field.value as string) ?? ""}
              onChange={field.onChange}
              options={options}
              onSearch={handleSearch}
              loading={loading}
              placeholder={`Search ${label.toLowerCase()}…`}
              searchPlaceholder={provider?.searchPlaceholder ?? `Search…`}
              emptyMessage={provider?.emptyMessage ?? "No results found."}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Debug panel
// ---------------------------------------------------------------------------

function DebugPanel({
  values,
  errors,
}: {
  values: Record<string, unknown>;
  errors: Record<string, unknown>;
}) {
  // Strip out undefined values for cleaner display
  const cleanValues = Object.fromEntries(
    Object.entries(values).filter(([, v]) => v !== undefined && v !== ""),
  );

  return (
    <div className="mt-6 rounded-lg border border-border bg-onyx-5 p-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Form State (Debug)
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Values
          </p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs text-foreground">
            {JSON.stringify(cleanValues, null, 2)}
          </pre>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Errors
          </p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs text-destructive">
            {Object.keys(errors).length > 0
              ? JSON.stringify(errors, null, 2)
              : "None"}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDefaultValues(
  fields: FormFieldDescriptor[],
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      defaults[field.name] = field.defaultValue;
    } else if (field.type === "boolean") {
      defaults[field.name] = false;
    } else {
      defaults[field.name] = "";
    }
  }
  return defaults;
}
