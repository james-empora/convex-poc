"use client";

import { Calendar, DollarSign, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatStatus } from "@/lib/portal/fake-data";
import type { PortalFile } from "@/lib/portal/fake-data";
import { formatCurrency, formatDate } from "@/lib/portal/fake-data";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-sapphire-10/80 text-sapphire-70 border-sapphire-30/50",
  in_progress: "bg-amethyst-10/80 text-amethyst-70 border-amethyst-30/50",
  clear_to_close: "bg-success-20/80 text-success-80 border-success-80/20",
  closed: "bg-onyx-10/80 text-onyx-60 border-onyx-30/50",
  funded: "bg-success-20/80 text-success-80 border-success-80/20",
  recorded: "bg-onyx-10/80 text-onyx-60 border-onyx-30/50",
  cancelled: "bg-danger-20/80 text-danger-80 border-danger-80/20",
};

interface PortalFileHeaderProps {
  file: PortalFile;
}

export function PortalFileHeader({ file }: PortalFileHeaderProps) {
  const priceLabel =
    file.fileType === "purchase" ? "Purchase Price" : "Loan Amount";
  const priceCents =
    file.fileType === "purchase"
      ? file.purchasePriceCents
      : file.loanAmountCents;

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Address + status */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-onyx-100">
              {file.address.street}
            </h1>
            <p className="mt-0.5 text-base text-onyx-60">
              {file.address.city}, {file.address.state} {file.address.zip}
            </p>
          </div>
          <Badge
            variant="glass"
            className={cn("mt-1 shrink-0", STATUS_BADGE[file.status])}
          >
            {formatStatus(file.status)}
          </Badge>
        </div>

        {/* Key details — 2-col grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {file.closingDate && (
            <DetailCell
              icon={Calendar}
              label="Closing Date"
              value={formatDate(file.closingDate)}
            />
          )}
          {priceCents && (
            <DetailCell
              icon={DollarSign}
              label={priceLabel}
              value={formatCurrency(priceCents)}
            />
          )}
          <DetailCell
            icon={Hash}
            label="File Number"
            value={file.fileNumber}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DetailCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-onyx-50">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-0.5 text-base font-semibold text-onyx-100">{value}</p>
    </div>
  );
}
