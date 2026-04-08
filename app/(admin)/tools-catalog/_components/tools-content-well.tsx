"use client";

import { useAtomValue } from "jotai";
import { Wrench, FileText, Tag, Monitor, Hash } from "lucide-react";
import { selectedToolAtom, selectedToolGroupAtom } from "../_lib/atoms";
import { getGroup } from "../_lib/groups";
import { ToolIcon } from "../_lib/icons";
import { getPreviewMocks } from "./tool-preview-mocks";
import { ToolCallCard } from "@/components/composite/tool-call-card";
import { Badge } from "@/components/ui/badge";

/* ---------- detail sections ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-onyx-60">
        {title}
      </h3>
      <div className="rounded-lg border border-onyx-20 bg-white p-4">
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3 py-1.5">
      <dt className="w-28 shrink-0 text-xs text-onyx-60">{label}</dt>
      <dd className={mono ? "font-mono text-sm text-onyx-90" : "text-sm text-onyx-90"}>
        {value}
      </dd>
    </div>
  );
}

/* ---------- content well ---------- */

export function ToolsContentWell() {
  const tool = useAtomValue(selectedToolAtom);
  const groupId = useAtomValue(selectedToolGroupAtom);

  // Empty state
  if (!tool) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-lg border border-dashed border-onyx-30 p-8">
          <Wrench className="mx-auto h-8 w-8 text-onyx-40" />
          <p className="mt-3 text-sm font-medium text-onyx-70">
            Select a tool to view details
          </p>
          <p className="mt-1 text-xs text-onyx-50">
            Choose from the list in the left panel
          </p>
        </div>
      </div>
    );
  }

  const group = groupId ? getGroup(groupId) : null;
  const label =
    tool.ui?.label ??
    tool.gatewayName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center border-b border-onyx-20 bg-white px-2">
        <button
          type="button"
          className="flex items-center gap-1.5 border-b-2 border-sapphire-50 px-3 py-2 text-xs font-medium text-sapphire-70"
        >
          <FileText className="h-3.5 w-3.5" />
          Overview
        </button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-5">
          {/* Tool header */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sapphire-10">
              <ToolIcon name={tool.ui?.icon} className="h-6 w-6 text-sapphire-60" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-normal text-onyx-100">
                {label}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                {group && (
                  <Badge size="sm" variant="glass" className="border text-[10px]">
                    {group.label}
                  </Badge>
                )}
                {tool.ui ? (
                  <Badge size="sm" variant="glass" className="border text-[10px]">
                    <Monitor className="mr-0.5 h-2.5 w-2.5" />
                    Has UI
                  </Badge>
                ) : (
                  <Badge size="sm" variant="glass" className="border text-[10px] text-onyx-50">
                    No UI
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {tool.gatewayDescription && (
            <Section title="Description">
              <p className="text-sm leading-relaxed text-onyx-80">
                {tool.gatewayDescription}
              </p>
            </Section>
          )}

          {/* Identity */}
          <Section title="Identity">
            <dl className="divide-y divide-onyx-10">
              <DetailRow label="Gateway Name" value={tool.gatewayName} mono />
              <DetailRow label="Tool Name" value={tool.toolName} mono />
              {tool.legacyToolNames && tool.legacyToolNames.length > 0 && (
                <DetailRow
                  label="Legacy Names"
                  value={
                    <div className="flex flex-wrap gap-1">
                      {tool.legacyToolNames.map((name) => (
                        <code
                          key={name}
                          className="rounded bg-onyx-10 px-1.5 py-0.5 text-xs"
                        >
                          {name}
                        </code>
                      ))}
                    </div>
                  }
                />
              )}
            </dl>
          </Section>

          {/* UI Metadata */}
          <Section title="UI Metadata">
            {tool.ui ? (
              <dl className="divide-y divide-onyx-10">
                <DetailRow
                  label="Label"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-onyx-50" />
                      {tool.ui.label}
                    </span>
                  }
                />
                {tool.ui.loadingLabel && (
                  <DetailRow label="Loading Label" value={tool.ui.loadingLabel} />
                )}
                <DetailRow
                  label="Icon"
                  value={
                    <span className="flex items-center gap-1.5">
                      <ToolIcon name={tool.ui?.icon} className="h-3.5 w-3.5 text-sapphire-60" />
                      <code className="rounded bg-onyx-10 px-1.5 py-0.5 text-xs">
                        {tool.ui.icon}
                      </code>
                    </span>
                  }
                />
                <DetailRow
                  label="Detail Kind"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Hash className="h-3 w-3 text-onyx-50" />
                      <code className="rounded bg-onyx-10 px-1.5 py-0.5 text-xs">
                        {tool.ui.detailKind}
                      </code>
                    </span>
                  }
                />
              </dl>
            ) : (
              <p className="text-sm italic text-onyx-50">
                This tool has no UI rendering metadata. It executes in the
                background without a visual detail card.
              </p>
            )}
          </Section>

          {/* UI Preview */}
          {tool.ui && (
            <Section title="UI Preview">
              <div className="space-y-3">
                {(() => {
                  const mocks = getPreviewMocks(tool.ui!.detailKind);
                  return (
                    <>
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-onyx-60">Loading</p>
                        <ToolCallCard
                          toolName={tool.toolName}
                          state="input-available"
                          input={mocks.input}
                        />
                      </div>
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-onyx-60">Success</p>
                        <ToolCallCard
                          toolName={tool.toolName}
                          state="output-available"
                          input={mocks.input}
                          output={mocks.output}
                        />
                      </div>
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-onyx-60">Error</p>
                        <ToolCallCard
                          toolName={tool.toolName}
                          state="output-error"
                          input={mocks.input}
                          output="Something went wrong"
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            </Section>
          )}

          {/* Group */}
          {group && (
            <Section title="Group">
              <dl className="divide-y divide-onyx-10">
                <DetailRow label="Group" value={group.label} />
                <DetailRow
                  label="Description"
                  value={
                    <span className="text-onyx-70">{group.description}</span>
                  }
                />
              </dl>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
