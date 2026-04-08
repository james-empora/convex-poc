"use client";

import Link from "next/link";
import { FileText, MessageCircle, ChevronRight } from "lucide-react";
import type { PortalDocument, PortalMessage } from "@/lib/portal/fake-data";

interface PortalQuickActionsProps {
  fileId: string;
  documents: PortalDocument[];
  messages: PortalMessage[];
}

export function PortalQuickActions({
  fileId,
  documents,
  messages,
}: PortalQuickActionsProps) {
  const sharedDocs = documents.filter((d) => !d.uploadedByMe).length;
  const messageCount = messages.length;

  return (
    <div className="space-y-2">
      <ActionRow
        href={`/portal/file/${fileId}/documents`}
        icon={FileText}
        label="Documents"
        detail={`${sharedDocs} shared`}
      />
      <ActionRow
        href={`/portal/file/${fileId}/messages`}
        icon={MessageCircle}
        label="Messages"
        detail={`${messageCount} message${messageCount !== 1 ? "s" : ""}`}
      />
    </div>
  );
}

function ActionRow({
  href,
  icon: Icon,
  label,
  detail,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sapphire-10">
        <Icon className="h-4.5 w-4.5 text-sapphire-60" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-onyx-100">{label}</p>
        <p className="text-xs text-onyx-50">{detail}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-onyx-30" />
    </Link>
  );
}
