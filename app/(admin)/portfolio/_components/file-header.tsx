"use client";

import { Calendar, DollarSign, Hash, MapPin, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/composite/user-avatar";
import { FILE_TYPE_LABELS, FILE_STATUS_LABELS, FINANCING_TYPE_LABELS } from "@/types/title-file";
import type { FileStatus, FinancingType, TitleSearchStatus, FileFlag } from "@/types/title-file";
import type { FileDetail } from "@/lib/files/get-file";
import {
  STATUS_CONFIG,
  TITLE_SEARCH_STATUS_CONFIG,
  FINANCING_TYPE_CONFIG,
  FILE_FLAG_CONFIG,
} from "./file-constants";
import { formatCurrency, formatDate } from "./format-utils";

/* ---------- sub-components ---------- */

function LabelValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wider text-onyx-50">
        {label}
      </dt>
      <dd className="text-sm text-onyx-90">{children}</dd>
    </div>
  );
}

/* ---------- component ---------- */

export function FileHeader({ file }: { file: FileDetail }) {
  const flags = file.flags ?? [];
  const team = file.team ?? [];
  const status = STATUS_CONFIG[file.status as FileStatus] ?? { label: file.status, className: "" };
  const titleSearch = file.titleSearchStatus
    ? TITLE_SEARCH_STATUS_CONFIG[file.titleSearchStatus as TitleSearchStatus] ?? null
    : null;

  const fileTypeLabel = file.fileSubType
    ? `${FILE_TYPE_LABELS[file.fileType as keyof typeof FILE_TYPE_LABELS] ?? file.fileType} \u2013 ${file.fileSubType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`
    : FILE_TYPE_LABELS[file.fileType as keyof typeof FILE_TYPE_LABELS] ?? file.fileType;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-lg">
            {file.propertyAddress}
          </CardTitle>
          <div className="text-sm text-onyx-50">
            {file.city}, {file.state}
            {file.fileNumber && (
              <span className="ml-2 font-mono text-xs text-onyx-40">
                {file.fileNumber}
              </span>
            )}
          </div>
        </div>
        {flags.length > 0 && (
          <CardAction>
            <div className="flex flex-wrap gap-1.5">
              {flags.map((flag) => {
                const cfg = FILE_FLAG_CONFIG[flag as FileFlag];
                if (!cfg) return null;
                return (
                  <Badge
                    key={flag}
                    size="sm"
                    variant="glass"
                    className={cn("border", cfg.className)}
                  >
                    {cfg.label}
                  </Badge>
                );
              })}
            </div>
          </CardAction>
        )}
      </CardHeader>

      <CardContent>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 lg:grid-cols-4">
          {/* Column 1: Status & Dates */}
          <div className="space-y-3">
            <LabelValue label="Overall Status">
              <Badge
                size="sm"
                variant="glass"
                className={cn("border", status.className)}
              >
                {FILE_STATUS_LABELS[file.status as FileStatus] ?? file.status}
              </Badge>
            </LabelValue>

            {titleSearch && (
              <LabelValue label="Title Search">
                <Badge
                  size="sm"
                  variant="glass"
                  className={cn("border", titleSearch.className)}
                >
                  {titleSearch.label}
                </Badge>
              </LabelValue>
            )}

            {file.openedAt && (
              <LabelValue label="Open Date">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-onyx-40" />
                  {formatDate(file.openedAt)}
                </span>
              </LabelValue>
            )}

            {file.closingDate && (
              <LabelValue label="Set to Close">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-onyx-40" />
                  {formatDate(file.closingDate)}
                </span>
              </LabelValue>
            )}

            {file.disburseDate && (
              <LabelValue label="Set to Disburse">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-onyx-40" />
                  {formatDate(file.disburseDate)}
                </span>
              </LabelValue>
            )}
          </div>

          {/* Column 2: File Info */}
          <div className="space-y-3">
            <LabelValue label="Type">
              {fileTypeLabel}
            </LabelValue>

            {file.salesPrice != null && (
              <LabelValue label="Sales Price">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-onyx-40" />
                  <span className="font-medium text-sapphire-70">
                    {formatCurrency(file.salesPrice)}
                  </span>
                </span>
              </LabelValue>
            )}

            {file.financingType && (
              <LabelValue label="Financing">
                <Badge
                  size="sm"
                  variant="glass"
                  className={cn("border", FINANCING_TYPE_CONFIG[file.financingType as FinancingType]?.className ?? "")}
                >
                  {FINANCING_TYPE_LABELS[file.financingType as FinancingType] ?? file.financingType}
                </Badge>
              </LabelValue>
            )}

            {file.loanAmount != null && file.financingType !== "cash" && (
              <LabelValue label="Loan Amount">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-onyx-40" />
                  {formatCurrency(file.loanAmount)}
                </span>
              </LabelValue>
            )}
          </div>

          {/* Column 3: Property */}
          <div className="space-y-3">
            {file.parcelNumber && (
              <LabelValue label="Parcel">
                <span className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-onyx-40" />
                  <span className="font-mono text-xs">{file.parcelNumber}</span>
                </span>
              </LabelValue>
            )}

            {file.county && (
              <LabelValue label="County">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-onyx-40" />
                  {file.county}
                </span>
              </LabelValue>
            )}

            {file.state && (
              <LabelValue label="State">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-onyx-40" />
                  {file.state}
                </span>
              </LabelValue>
            )}
          </div>

          {/* Column 4: Team */}
          <div className="space-y-3">
            {team.length > 0 ? (
              team.map((member) => (
                <LabelValue key={`${member.role}-${member.name}`} label={member.role.replace(/_/g, " ")}>
                  <span className="flex items-center gap-2">
                    <UserAvatar name={member.name} size="sm" />
                    <span>{member.name}</span>
                  </span>
                </LabelValue>
              ))
            ) : file.closerName ? (
              <LabelValue label="Closer">
                <span className="flex items-center gap-2">
                  <UserAvatar name={file.closerName} size="sm" />
                  <span>{file.closerName}</span>
                </span>
              </LabelValue>
            ) : null}
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
