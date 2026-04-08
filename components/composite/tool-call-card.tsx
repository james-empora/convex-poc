"use client";

import {
  Upload,
  FileText,
  FolderOpen,
  Search,
  UserPlus,
  UserMinus,
  Loader2,
  CheckCircle2,
  XCircle,
  BarChart3,
  List,
  PlusCircle,
  Pencil,
  Sparkles,
  FlaskConical,
  CreditCard,
} from "lucide-react";
import { getDisplayToolMeta } from "@/lib/tools/catalog";
import type { ToolDetailKind, ToolIconName } from "@/lib/tools/define-tool";
import { renderFinancialDetail } from "@/components/finances/financial-tool-detail";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<ToolIconName, typeof FileText> = {
  upload: Upload,
  "file-text": FileText,
  "folder-open": FolderOpen,
  search: Search,
  "user-plus": UserPlus,
  "user-minus": UserMinus,
  "bar-chart": BarChart3,
  list: List,
  "plus-circle": PlusCircle,
  pencil: Pencil,
  sparkles: Sparkles,
  "check-circle": CheckCircle2,
  "x-circle": XCircle,
  "flask-conical": FlaskConical,
  "credit-card": CreditCard,
};

interface ToolCallCardProps {
  toolName: string;
  state: string;
  input: unknown;
  output?: unknown;
  className?: string;
}

export function ToolCallCard({
  toolName,
  state,
  input,
  output,
  className,
}: ToolCallCardProps) {
  const meta = getDisplayToolMeta(toolName) ?? {
    label: toolName,
    loadingLabel: undefined,
    icon: "file-text" as const,
    detailKind: undefined,
  };
  const Icon = ICON_MAP[meta.icon] ?? FileText;

  const isLoading =
    state === "input-streaming" ||
    state === "input-available" ||
    state === "approval-requested";
  const isDone = state === "output-available";
  const isError = state === "output-error";
  const displayLabel = isLoading && meta.loadingLabel ? meta.loadingLabel : meta.label;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
        isDone && "border-jade-20 bg-jade-5",
        isError && "border-garnet-20 bg-garnet-5",
        isLoading && "border-onyx-15 bg-onyx-5",
        !isDone && !isError && !isLoading && "border-onyx-15 bg-onyx-5",
        className,
      )}
    >
      <div className="mt-0.5 shrink-0">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-sapphire-50" />
        ) : isDone ? (
          <CheckCircle2 className="h-4 w-4 text-jade-60" />
        ) : isError ? (
          <XCircle className="h-4 w-4 text-garnet-60" />
        ) : (
          <Icon className="h-4 w-4 text-onyx-40" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-onyx-80">{displayLabel}</p>
        {renderDetail(meta.detailKind, state, input, output)}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/empora-logo.svg" alt="" className="h-4 shrink-0 opacity-40" />
    </div>
  );
}

/** Parse tool output — handles both parsed objects (gateway) and JSON strings (MCP/Claude Code). */
function parseOutput(raw: unknown): Record<string, unknown> | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return undefined; }
  }
  return undefined;
}

function parseInput(raw: unknown): Record<string, unknown> | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return undefined; }
  }
  return undefined;
}

function renderDetail(
  detailKind: ToolDetailKind | undefined,
  state: string,
  input: unknown,
  output: unknown,
) {
  const inp = parseInput(input);
  const out = parseOutput(output);

  if (state === "input-streaming") {
    return <p className="text-xs text-onyx-40">Working...</p>;
  }

  if (detailKind === "register") {
    const fileName = inp?.name ? String(inp.name) : null;
    if (isDoneOrError(state) && out) {
      const triggered = (out as { extractionTriggered?: boolean }).extractionTriggered;
      if (triggered) {
        return (
          <p className="text-xs text-onyx-60">
            {fileName ? <><span className="font-medium">{fileName}</span> uploaded — </> : ""}
            processing started
          </p>
        );
      }
      return (
        <p className="text-xs text-onyx-60">
          {fileName ? <><span className="font-medium">{fileName}</span> uploaded</> : "Uploaded"}
        </p>
      );
    }
    return (
      <p className="text-xs text-onyx-50">
        {fileName
          ? <>Uploading <span className="font-medium">{fileName}</span>...</>
          : "Uploading..."}
      </p>
    );
  }

  if (detailKind === "extract") {
    if (state === "output-available" && out) {
      if ((out as { success?: boolean }).success) {
        const pages = out.totalPages ?? "?";
        return (
          <p className="text-xs text-onyx-60">
            Read {String(pages)} page{pages !== 1 ? "s" : ""}
          </p>
        );
      }
      return <p className="text-xs text-onyx-60">No text available</p>;
    }
    if (state === "output-error") {
      return <p className="text-xs text-onyx-60">Could not read document</p>;
    }
    return <p className="text-xs text-onyx-50">Extracting and reading text...</p>;
  }

  if (detailKind === "open-file") {
    const addr = inp?.addressLine1 ? String(inp.addressLine1) : null;
    const city = inp?.city ? String(inp.city) : null;
    const st = inp?.state ? String(inp.state) : null;
    const location = [addr, city, st].filter(Boolean).join(", ");
    if (isDoneOrError(state) && out) {
      const outAddr = (out as { address?: string }).address;
      return (
        <p className="text-xs text-onyx-60">
          Opened file for <span className="font-medium">{outAddr ?? location ?? "property"}</span>
        </p>
      );
    }
    return (
      <p className="text-xs text-onyx-50">
        {location
          ? <>Opening file for <span className="font-medium">{location}</span>...</>
          : "Opening file..."}
      </p>
    );
  }

  if (detailKind === "search") {
    const query = inp?.query ? String(inp.query) : null;
    if (state === "output-available" && out) {
      const results = Array.isArray(out) ? out : (out as { length?: number });
      const count = Array.isArray(results) ? results.length : null;
      return (
        <p className="text-xs text-onyx-60">
          {count !== null ? `Found ${count} result${count !== 1 ? "s" : ""}` : "Search complete"}
          {query ? <> for <span className="font-medium">{query}</span></> : ""}
        </p>
      );
    }
    if (state === "output-error") {
      return <p className="text-xs text-onyx-60">Search failed</p>;
    }
    return (
      <p className="text-xs text-onyx-50">
        {query ? <>Searching for <span className="font-medium">{query}</span>...</> : "Searching..."}
      </p>
    );
  }

  if (detailKind === "create-entity") {
    const entityType = inp?.entityType ? String(inp.entityType) : null;
    const name = inp?.firstName && inp?.lastName
      ? `${String(inp.firstName)} ${String(inp.lastName)}`
      : inp?.legalName ? String(inp.legalName) : null;
    if (state === "output-available" && out) {
      const outName = (out as { name?: string }).name ?? name;
      return (
        <p className="text-xs text-onyx-60">
          Created {entityType ?? "entity"}{outName ? <> <span className="font-medium">{outName}</span></> : ""}
        </p>
      );
    }
    if (state === "output-error") {
      return <p className="text-xs text-onyx-60">Could not create entity</p>;
    }
    return (
      <p className="text-xs text-onyx-50">
        Creating {entityType ?? "entity"}{name ? <> <span className="font-medium">{name}</span></> : ""}...
      </p>
    );
  }

  if (detailKind === "add-party") {
    const role = inp?.role ? String(inp.role).replace(/_/g, " ") : null;
    if (state === "output-available" && out) {
      const entityName = (out as { entityName?: string }).entityName;
      return (
        <p className="text-xs text-onyx-60">
          Added{entityName ? <> <span className="font-medium">{entityName}</span></> : " party"}
          {role ? <> as {role}</> : ""}
        </p>
      );
    }
    if (state === "output-error") {
      return <p className="text-xs text-onyx-60">Could not add party</p>;
    }
    return (
      <p className="text-xs text-onyx-50">
        Adding{role ? <> {role}</> : " party"}...
      </p>
    );
  }

  if (detailKind === "remove-party") {
    if (state === "output-available") {
      return <p className="text-xs text-onyx-60">Party removed</p>;
    }
    if (state === "output-error") {
      return <p className="text-xs text-onyx-60">Could not remove party</p>;
    }
    return <p className="text-xs text-onyx-50">Removing party...</p>;
  }

  // Financial tool details
  if (detailKind) {
    const financialResult = renderFinancialDetail(detailKind, state, input, output);
    if (financialResult !== null) return financialResult;
  }

  // Generic fallback — never expose raw internal messages
  if (state === "output-error") {
    return <p className="text-xs text-onyx-60">Something went wrong</p>;
  }
  if (isDoneOrError(state)) {
    return null;
  }
  return <p className="text-xs text-onyx-50">Working...</p>;
}

function isDoneOrError(state: string) {
  return state === "output-available" || state === "output-error";
}
