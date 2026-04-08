"use client";

import { useState } from "react";
import { Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/composite/alert-dialog";

export function AlertDialogDemo() {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-4">
      {/* Danger / Destructive */}
      <Button variant="outline" onClick={() => setDeleteOpen(true)}>
        Delete Confirmation
      </Button>
      <AlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tone="danger"
        icon={<Trash2 />}
        heading="Delete this file?"
        description="This action cannot be undone. All documents, notes, and ledger data associated with File #24-1847 will be permanently removed."
        actions={
          <>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(false)}>
              Delete File
            </Button>
          </>
        }
      />

      {/* Success */}
      <Button variant="outline" onClick={() => setSuccessOpen(true)}>
        Success Message
      </Button>
      <AlertDialog
        open={successOpen}
        onOpenChange={setSuccessOpen}
        tone="success"
        size="sm"
        icon={<CheckCircle />}
        heading="File Closed Successfully"
        description="File #24-1847 has been recorded and all disbursements have been released. A confirmation email has been sent to all parties."
        actions={
          <Button onClick={() => setSuccessOpen(false)}>Done</Button>
        }
      />

      {/* Warning */}
      <Button variant="outline" onClick={() => setWarningOpen(true)}>
        Warning Alert
      </Button>
      <AlertDialog
        open={warningOpen}
        onOpenChange={setWarningOpen}
        tone="warning"
        icon={<AlertTriangle />}
        heading="Wire Instructions Changed"
        description="Bank account details for the seller were modified 2 days before closing. This is a potential fraud indicator that requires verification."
        actions={
          <>
            <Button variant="outline" onClick={() => setWarningOpen(false)}>
              Dismiss
            </Button>
            <Button onClick={() => setWarningOpen(false)}>
              View Details
            </Button>
          </>
        }
      />
    </div>
  );
}
