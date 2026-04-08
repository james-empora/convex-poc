"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { getFakeFile, getFakeMessages } from "@/lib/portal/fake-data";
import { PortalChat } from "./_components/portal-chat";

export default function PortalMessagesPage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const { fileId } = use(params);

  const file = getFakeFile(fileId);
  if (!file) notFound();

  const messages = getFakeMessages(fileId);

  // flex-1 fills the wrapper; negative margins cancel wrapper padding.
  // The chat input is portaled to the shell level (full width, above footer).
  return (
    <div className="-mx-4 -mt-6 -mb-6 flex flex-1 flex-col overflow-hidden sm:-mx-6">
      <PortalChat
        initialMessages={messages}
        escrowOfficerName={file.escrowOfficer.name}
      />
    </div>
  );
}
