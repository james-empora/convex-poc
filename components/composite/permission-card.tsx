"use client";

import { useState } from "react";
import { Check, X, Terminal, FileText, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PermissionRequest {
  id: string;
  title: string;
  toolName: string;
  displayName?: string;
  description?: string;
  input?: Record<string, unknown>;
  suggestions?: Array<{
    type: string;
    rules?: Array<{ toolName: string; ruleContent: string }>;
    behavior?: string;
    destination?: string;
  }>;
}

interface PermissionCardProps {
  permission: PermissionRequest;
  onResolve: (id: string, behavior: "allow" | "deny") => void;
}

function getToolIcon(toolName: string) {
  if (toolName === "Bash") return Terminal;
  if (toolName === "Read" || toolName === "Edit" || toolName === "Write")
    return FileText;
  return Wrench;
}

function formatCommand(input: Record<string, unknown>): string | null {
  if (typeof input.command === "string") return input.command;
  if (typeof input.file_path === "string") return input.file_path;
  return null;
}

export function PermissionCard({ permission, onResolve }: PermissionCardProps) {
  const [status, setStatus] = useState<"pending" | "allowed" | "denied">(
    "pending",
  );
  const [isLoading, setIsLoading] = useState(false);

  const Icon = getToolIcon(permission.toolName);
  const command = permission.input ? formatCommand(permission.input) : null;

  async function handleResolve(behavior: "allow" | "deny") {
    setIsLoading(true);
    try {
      await fetch("/api/chat/permission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionId: permission.id, behavior }),
      });
      setStatus(behavior === "allow" ? "allowed" : "denied");
      onResolve(permission.id, behavior);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="my-2 overflow-hidden rounded-xl border border-onyx-20 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-onyx-10 bg-onyx-5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sapphire-10">
            <Icon className="h-3.5 w-3.5 text-sapphire-60" />
          </div>
          <span className="text-xs font-semibold text-onyx-70">
            Permission Request
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/empora-logo.svg" alt="Empora" className="h-4 opacity-40" />
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-onyx-90">
          {permission.title.replace(/^Agent /, "Empora ")}
        </p>
        {permission.description && (
          <p className="mt-1 text-xs text-onyx-50">{permission.description}</p>
        )}

        {/* Command preview */}
        {command && (
          <div className="mt-2 rounded-lg bg-onyx-10 px-3 py-2">
            <code className="font-mono text-xs text-onyx-80">{command}</code>
          </div>
        )}

        {/* Actions */}
        {status === "pending" ? (
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResolve("deny")}
              disabled={isLoading}
              className="gap-1.5 text-xs"
            >
              <X className="h-3 w-3" />
              Deny
            </Button>
            <Button
              size="sm"
              onClick={() => handleResolve("allow")}
              disabled={isLoading}
              className="gap-1.5 text-xs"
            >
              <Check className="h-3 w-3" />
              Allow
            </Button>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-1.5">
            {status === "allowed" ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <X className="h-3 w-3 text-garnet-60" />
            )}
            <p
              className={`text-xs font-medium ${status === "allowed" ? "text-emerald-600" : "text-garnet-60"}`}
            >
              {status === "allowed" ? "Allowed" : "Denied"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
