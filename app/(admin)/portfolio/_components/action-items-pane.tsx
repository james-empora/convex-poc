"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import {
  Circle,
  CircleCheck,
  Calendar,
  MoreVertical,
  RefreshCw,
  Loader2,
  Ban,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActionItems } from "@/lib/action-items/queries";
import { generateMapAction } from "@/lib/action-items/generate-map.server";
import { userEntityTypeAtom, userEntityIdAtom } from "@/lib/auth/atoms";
import type { ActionItemWithDeps } from "@/lib/action-items/types";
import { api } from "@/convex/_generated/api";
import { useConvexMutationResult } from "@/lib/convex/hooks";

/* ---------- constants ---------- */

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-danger-20/80 text-danger-80 border-danger-80/20",
  high: "bg-warning-20/80 text-warning-80 border-warning-80/20",
  normal: "bg-sapphire-10/80 text-sapphire-70 border-sapphire-30/50",
  low: "bg-onyx-10/80 text-onyx-60 border-onyx-30/50",
};

/* ---------- helpers ---------- */

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === "completed") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate + "T00:00:00") < today;
}

/* ---------- header action (three-dot menu) ---------- */

export function ActionItemsHeaderAction() {
  const { fileId } = useParams<{ fileId?: string }>();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Clean up polling interval on unmount
  useEffect(() => () => { clearInterval(pollRef.current); }, []);

  const handleRegenerate = useCallback(async () => {
    if (!fileId) return;
    setGenerating(true);
    setError(null);
    setDialogOpen(false);
    try {
      await generateMapAction({ fileId });
      // Poll with router.refresh until the workflow completes
      let ticks = 0;
      pollRef.current = setInterval(() => {
        ticks++;
        router.refresh();
        if (ticks >= 12) {
          // Stop after ~60s — generation likely still running in background
          clearInterval(pollRef.current);
          setGenerating(false);
        }
      }, 5000);
    } catch (e) {
      console.error("Action item generation failed:", e);
      setError(e instanceof Error ? e.message : "Generation failed");
      setGenerating(false);
    }
  }, [fileId, router]);

  if (!fileId) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Action item options"
            className="flex h-6 w-6 items-center justify-center rounded text-onyx-50 hover:bg-onyx-20 hover:text-onyx-80"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MoreVertical className="h-3.5 w-3.5" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setDialogOpen(true)}
            disabled={generating}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Regenerate Action Items
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Action Items</DialogTitle>
            <DialogDescription>
              This will run the AI action item generator for this file. It may
              create, update, or remove action items based on the current file
              state.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegenerate}>Regenerate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="absolute right-0 top-8 z-10 rounded border border-danger-80/20 bg-danger-20/80 px-2 py-1 text-xs text-danger-80 shadow-soft">
          {error}
        </div>
      )}
    </>
  );
}

/* ---------- main pane ---------- */

export function ActionItemsPane() {
  const { fileId: activeFileId } = useParams<{ fileId?: string }>();
  const entityType = useAtomValue(userEntityTypeAtom);
  const entityId = useAtomValue(userEntityIdAtom);

  const { data, isLoading } = useActionItems(activeFileId ?? null);

  if (!activeFileId) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-onyx-60">
        Select a file to view action items
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-onyx-40" />
      </div>
    );
  }

  const allItems = data?.items ?? [];

  // Filter to current user's items (match entity)
  const items = entityId && entityType
    ? allItems.filter(
        (item) =>
          item.assigneeEntityId === entityId &&
          item.assigneeEntityType === entityType,
      )
    : allItems; // fallback: show all if no entity linked

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-onyx-60">
        No action items
      </div>
    );
  }

  // Sort: pending first, then by priority (urgent > high > normal > low), then by due date
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
  const sorted = [...items].sort((a, b) => {
    // Pending before completed
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    // By priority
    const pa = priorityOrder[a.priority] ?? 2;
    const pb = priorityOrder[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    // By due date (earliest first, null last)
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col divide-y divide-onyx-10">
      {sorted.map((item) => (
        <ActionItemRow key={item.id} item={item} />
      ))}
    </div>
  );
}

/* ---------- item row ---------- */

function ActionItemRow({ item }: { item: ActionItemWithDeps }) {
  const completeItem = useConvexMutationResult(api.actionItems.completeItem);
  const uncompleteItem = useConvexMutationResult(api.actionItems.uncompleteItem);
  const [toggling, setToggling] = useState(false);
  const done = item.status === "completed";
  const overdue = isOverdue(item.dueDate, item.status);

  const handleToggle = useCallback(async () => {
    if (item.isBlocked && !done) return; // can't complete blocked items
    setToggling(true);
    try {
      if (done) {
        await uncompleteItem.mutateAsync({ id: item.id });
      } else {
        await completeItem.mutateAsync({ id: item.id });
      }
    } finally {
      setToggling(false);
    }
  }, [completeItem, done, item.id, item.isBlocked, uncompleteItem]);

  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5">
      {/* Toggle button */}
      <button
        type="button"
        aria-label={done ? "Mark incomplete" : "Mark complete"}
        onClick={handleToggle}
        disabled={toggling || (item.isBlocked && !done)}
        className={cn(
          "mt-0.5 shrink-0",
          item.isBlocked && !done && "cursor-not-allowed opacity-50",
        )}
      >
        {toggling ? (
          <Loader2 className="h-4 w-4 animate-spin text-onyx-40" />
        ) : done ? (
          <CircleCheck className="h-4 w-4 text-success-80" />
        ) : item.isBlocked ? (
          <Ban className="h-4 w-4 text-onyx-40" />
        ) : (
          <Circle className="h-4 w-4 text-onyx-40" />
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            done
              ? "text-onyx-50 line-through"
              : "font-medium text-onyx-80",
          )}
        >
          {item.title}
        </p>

        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
          {/* Due date */}
          {item.dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5",
                overdue ? "text-danger-80" : "text-onyx-50",
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(item.dueDate)}
            </span>
          )}

          {/* Priority badge */}
          <Badge
            variant="glass"
            size="sm"
            className={cn(
              "border",
              PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.normal,
            )}
          >
            {item.priority}
          </Badge>

          {/* Blocked badge */}
          {item.isBlocked && (
            <Badge
              variant="glass"
              size="sm"
              className="border bg-danger-20/80 text-danger-80 border-danger-80/20"
            >
              Blocked
            </Badge>
          )}
        </div>

        {/* Soft dependency hints */}
        {item.softBlockers.length > 0 && !done && (
          <div className="mt-1 flex items-start gap-1 text-[11px] text-onyx-50">
            <Info className="h-3 w-3 shrink-0 mt-px" />
            <span>Recommended first: {item.softBlockers.map((d) => d.toItemTitle).join(", ")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
