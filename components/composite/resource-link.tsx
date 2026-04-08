"use client";

import type { ReactNode } from "react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { useResourceLinkContext } from "@/lib/chat/resource-link-context";
import { useFile } from "@/lib/files/queries";
import { useDocument } from "@/lib/documents/queries";
import { FileHoverPreview, DocHoverPreview } from "./resource-hover-cards";
import {
  LayoutDashboard,
  DollarSign,
  MessageSquarePlus,
  Copy,
  ExternalLink,
  FileText,
} from "lucide-react";

/* ---------- helpers ---------- */

/** Parse an empora:// URL into resource type and ID. */
function parseEmporaUrl(href: string): { resourceType: "file" | "doc"; resourceId: string } | null {
  const match = href.match(/^empora:\/\/(file|doc)\/(.+)$/);
  if (!match) return null;
  return { resourceType: match[1] as "file" | "doc", resourceId: match[2] };
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

/* ---------- component ---------- */

interface ResourceLinkProps {
  href: string;
  children: ReactNode;
}

export function ResourceLink({ href, children }: ResourceLinkProps) {
  const {
    navigateToResource,
    navigateToTab,
    createChatTab,
  } = useResourceLinkContext();
  const parsed = parseEmporaUrl(href);

  const fileId = parsed?.resourceType === "file" ? parsed.resourceId : null;
  const docId = parsed?.resourceType === "doc" ? parsed.resourceId : null;

  const { data: file, isLoading: fileLoading } = useFile(fileId);
  const { data: doc, isLoading: docLoading } = useDocument(docId);

  if (!parsed) {
    return <span>{children}</span>;
  }

  const { resourceType, resourceId } = parsed;
  const targetFileId = resourceType === "file" ? resourceId : doc?.fileId ?? resourceId;

  return (
    <ContextMenu>
      <HoverCard openDelay={300} closeDelay={100}>
        <ContextMenuTrigger asChild>
          <HoverCardTrigger asChild>
            <button
              type="button"
              onClick={() => navigateToResource(resourceType, resourceId)}
              className="inline cursor-pointer border-none bg-transparent p-0 font-[inherit] text-[length:inherit] leading-[inherit] text-sapphire-60 underline decoration-sapphire-30 underline-offset-2 hover:text-sapphire-70"
            >
              {children}
            </button>
          </HoverCardTrigger>
        </ContextMenuTrigger>
        <HoverCardContent side="top" align="start" className="w-72 p-4">
          {resourceType === "file" ? (
            <FileHoverPreview file={file ?? null} resourceId={resourceId} isLoading={fileLoading} />
          ) : (
            <DocHoverPreview doc={doc ?? null} resourceId={resourceId} isLoading={docLoading} />
          )}
        </HoverCardContent>
      </HoverCard>

      <ContextMenuContent className="w-52">
        {/* Navigation actions */}
        {resourceType === "file" && (
          <>
            <ContextMenuItem onClick={() => navigateToTab(resourceId, "overview")}>
              <LayoutDashboard className="mr-2 size-3.5" />
              Overview
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigateToTab(resourceId, "finances")}>
              <DollarSign className="mr-2 size-3.5" />
              Finances
            </ContextMenuItem>
          </>
        )}
        {resourceType === "doc" && (
          <ContextMenuItem onClick={() => navigateToResource("doc", resourceId)}>
            <FileText className="mr-2 size-3.5" />
            Open Document
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={() => createChatTab(targetFileId)}>
          <MessageSquarePlus className="mr-2 size-3.5" />
          Start Chat
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Clipboard actions */}
        {resourceType === "file" && file && (
          <>
            {file.fileNumber && (
              <ContextMenuItem onClick={() => copyToClipboard(file.fileNumber!)}>
                <Copy className="mr-2 size-3.5" />
                Copy File Number
              </ContextMenuItem>
            )}
            <ContextMenuItem
              onClick={() =>
                copyToClipboard(`${file.propertyAddress}, ${file.city}, ${file.state}`)
              }
            >
              <Copy className="mr-2 size-3.5" />
              Copy Address
            </ContextMenuItem>
          </>
        )}
        {resourceType === "doc" && doc && (
          <ContextMenuItem onClick={() => copyToClipboard(doc.name)}>
            <Copy className="mr-2 size-3.5" />
            Copy Document Name
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Open in new browser tab */}
        <ContextMenuItem
          onClick={() => {
            const url =
              resourceType === "file"
                ? `/portfolio/${resourceId}/overview`
                : `/portfolio/${targetFileId}/doc/${resourceId}`;
            window.open(url, "_blank");
          }}
        >
          <ExternalLink className="mr-2 size-3.5" />
          Open in New Tab
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
