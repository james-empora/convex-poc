import { z } from "zod";
import {
  FORM_RELATION_META_KEY,
  FormRelation,
  type FormRelationConfig,
} from "./relation";

export type FieldType =
  | "text"
  | "number"
  | "boolean"
  | "enum"
  | "date"
  | "uuid"
  | "textarea";

export interface EnumOption {
  label: string;
  value: string;
}

export interface FieldConstraints {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  isInteger?: boolean;
}

export interface FormFieldDescriptor {
  name: string;
  label: string;
  type: FieldType;
  optional: boolean;
  nullable: boolean;
  description?: string;
  enumOptions?: EnumOption[];
  constraints: FieldConstraints;
  defaultValue?: unknown;
  relation?: FormRelationConfig;
}

type FieldMeta = {
  title?: string;
  formRelation?: FormRelationConfig;
} & Record<PropertyKey, unknown>;

type ResolvedSchema = {
  schema: z.ZodTypeAny;
  optional: boolean;
  nullable: boolean;
  defaultValue?: unknown;
};

function getMeta(schema: z.ZodTypeAny): FieldMeta | undefined {
  return schema.meta() as FieldMeta | undefined;
}

function unwrapSchema(schema: z.ZodTypeAny): ResolvedSchema {
  let current = schema;
  let optional = false;
  let nullable = false;
  let defaultValue: unknown;

  while (true) {
    const type = current.def.type;
    if (type === "optional") {
      optional = true;
      current = (current.def as unknown as { innerType: z.ZodTypeAny }).innerType;
      continue;
    }
    if (type === "nullable") {
      nullable = true;
      current = (current.def as unknown as { innerType: z.ZodTypeAny }).innerType;
      continue;
    }
    if (type === "default" || type === "prefault") {
      optional = true;
      const def = current.def as unknown as {
        defaultValue: unknown | (() => unknown);
        innerType: z.ZodTypeAny;
      };
      defaultValue = typeof def.defaultValue === "function"
        ? def.defaultValue()
        : def.defaultValue;
      current = def.innerType;
      continue;
    }
    if (type === "pipe") {
      current = (current.def as unknown as { out: z.ZodTypeAny }).out;
      continue;
    }
    break;
  }

  return { schema: current, optional, nullable, defaultValue };
}

function enumOptionsFromValues(values: readonly string[]): EnumOption[] {
  return values.map((value) => ({ label: humanize(value), value }));
}

function resolveField(schema: z.ZodTypeAny): Omit<FormFieldDescriptor, "name" | "label" | "optional"> & { title?: string } {
  const { schema: base, nullable, defaultValue } = unwrapSchema(schema);
  const meta = getMeta(schema) ?? getMeta(base);
  const relation =
    meta?.formRelation ??
    (meta && FormRelation in meta ? (meta[FormRelation] as FormRelationConfig) : undefined);

  switch (base.def.type) {
    case "string": {
      const stringBase = base as z.ZodString;
      const type =
        stringBase.format === "uuid" ? "uuid" :
        stringBase.maxLength !== null && stringBase.maxLength > 120 ? "textarea" :
        "text";
      return {
        type,
        nullable,
        description: stringBase.description,
        enumOptions: undefined,
        constraints: {
          minLength: stringBase.minLength ?? undefined,
          maxLength: stringBase.maxLength ?? undefined,
        },
        defaultValue,
        relation,
        title: meta?.title,
      };
    }
    case "number": {
      const numberBase = base as z.ZodNumber;
      return {
        type: "number",
        nullable,
        description: numberBase.description,
        constraints: {
          min: numberBase.minValue ?? undefined,
          max: numberBase.maxValue ?? undefined,
          isInteger: numberBase.format === "safeint" || numberBase.format === "int",
        },
        defaultValue,
        relation,
        title: meta?.title,
      };
    }
    case "boolean":
      return {
        type: "boolean",
        nullable,
        description: base.description,
        constraints: {},
        defaultValue,
        relation,
        title: meta?.title,
      };
    case "date":
      return {
        type: "date",
        nullable,
        description: base.description,
        constraints: {},
        defaultValue,
        relation,
        title: meta?.title,
      };
    case "enum":
      {
      const enumBase = base as z.ZodEnum<any>;
      return {
        type: "enum",
        nullable,
        description: enumBase.description,
        enumOptions: enumOptionsFromValues(Object.values((enumBase.def as { entries: Record<string, string> }).entries)),
        constraints: {},
        defaultValue,
        relation,
        title: meta?.title,
      };
      }
    case "literal":
      {
      const literalBase = base as z.ZodLiteral<any>;
      const values = (literalBase.def as { values: unknown[] }).values;
      return {
        type: typeof values[0] === "string" ? "enum" : "text",
        nullable,
        description: literalBase.description,
        enumOptions:
          typeof values[0] === "string"
            ? enumOptionsFromValues(values as string[])
            : undefined,
        constraints: {},
        defaultValue,
        relation,
        title: meta?.title,
      };
      }
    default:
      return {
        type: "text",
        nullable,
        description: base.description,
        constraints: {},
        defaultValue,
        relation,
        title: meta?.title,
      };
  }
}

function objectToFields(schema: z.ZodObject<any>): FormFieldDescriptor[] {
  return Object.entries(schema.shape as Record<string, z.ZodTypeAny>).map(([name, child]) => {
    const resolved = resolveField(child);
    const childMeta = getMeta(child);
    const label = resolved.title ?? childMeta?.title ?? resolved.description ?? humanize(name);
    return {
      name,
      label,
      type: resolved.type,
      optional: child.safeParse(undefined).success,
      nullable: resolved.nullable,
      description: resolved.description,
      enumOptions: resolved.enumOptions,
      constraints: resolved.constraints,
      defaultValue: resolved.defaultValue,
      relation:
        resolved.relation ??
        childMeta?.formRelation ??
        (childMeta && FormRelation in childMeta
          ? (childMeta[FormRelation] as FormRelationConfig)
          : undefined),
    };
  });
}

function mergeUnionFields(branchFields: FormFieldDescriptor[][]): FormFieldDescriptor[] {
  const merged = new Map<string, FormFieldDescriptor>();
  const presence = new Map<string, number>();

  for (const branch of branchFields) {
    for (const field of branch) {
      presence.set(field.name, (presence.get(field.name) ?? 0) + 1);
      const existing = merged.get(field.name);
      if (!existing) {
        merged.set(field.name, { ...field });
        continue;
      }
      existing.optional = existing.optional || field.optional;
      if (field.enumOptions) {
        const next = new Map((existing.enumOptions ?? []).map((option) => [option.value, option]));
        for (const option of field.enumOptions) next.set(option.value, option);
        existing.enumOptions = [...next.values()];
        existing.type = "enum";
      }
    }
  }

  for (const [name, count] of presence) {
    if (count < branchFields.length) {
      const field = merged.get(name);
      if (field) field.optional = true;
    }
  }

  return [...merged.values()];
}

export function schemaToFields(schema: z.ZodTypeAny): FormFieldDescriptor[] {
  const unwrapped = unwrapSchema(schema).schema;
  switch (unwrapped.def.type) {
    case "object":
      return objectToFields(unwrapped as z.ZodObject<any>);
    case "union":
      return mergeUnionFields(
        ((unwrapped.def as unknown as { options: z.ZodTypeAny[] }).options)
          .map((option) => schemaToFields(option))
          .filter((fields: FormFieldDescriptor[]) => fields.length > 0),
      );
    default:
      return [];
  }
}

function humanize(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
