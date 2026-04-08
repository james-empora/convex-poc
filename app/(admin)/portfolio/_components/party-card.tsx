"use client";

import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Circle,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { FileParty, Titleholder, ContactInfo, VerificationStatus } from "@/types/title-file";
import { PARTY_ROLE_LABELS } from "@/types/title-file";
import { FILE_FLAG_CONFIG, VERIFICATION_CONFIG } from "./file-constants";
import { formatPhone } from "./format-utils";

/* ---------- verification icon ---------- */

const VERIFICATION_ICONS: Record<VerificationStatus, typeof CheckCircle2> = {
  verified: CheckCircle2,
  pending: AlertTriangle,
  failed: XCircle,
  not_started: Circle,
};

function VerificationIcon({ status }: { status: VerificationStatus }) {
  const Icon = VERIFICATION_ICONS[status];
  const cfg = VERIFICATION_CONFIG[status];
  return <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.className)} />;
}

/* ---------- contact info row ---------- */

function ContactRow({ email, phone }: { email?: string; phone?: string }) {
  if (!email && !phone) return null;
  return (
    <div className="flex flex-col gap-0.5 pl-5 text-xs text-onyx-60">
      {email && (
        <span className="flex items-center gap-1">
          <Mail className="h-3 w-3 text-onyx-40" />
          {email}
        </span>
      )}
      {phone && (
        <span className="flex items-center gap-1">
          <Phone className="h-3 w-3 text-onyx-40" />
          {formatPhone(phone)}
        </span>
      )}
    </div>
  );
}

/* ---------- generic contact display (agent, TC, loan officer) ---------- */

function ContactBlock({ label, contact }: { label: string; contact: ContactInfo }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-onyx-50">
        {label}
      </p>
      <p className="text-sm font-medium text-sapphire-70">{contact.name}</p>
      {contact.company && (
        <p className="text-xs text-onyx-60">{contact.company}</p>
      )}
      <ContactRow email={contact.email} phone={contact.phone} />
    </div>
  );
}

/* ---------- component ---------- */

export function PartyCard({ party, className }: { party: FileParty; className?: string }) {
  return (
    <Card size="sm" className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>{PARTY_ROLE_LABELS[party.role]}</CardTitle>
        {party.flags.length > 0 && (
          <CardAction>
            <div className="flex flex-wrap gap-1">
              {party.flags.map((flag) => {
                const cfg = FILE_FLAG_CONFIG[flag];
                return (
                  <Badge
                    key={flag}
                    size="sm"
                    variant="glass"
                    className={cn("border text-[10px]", cfg.className)}
                  >
                    {cfg.label}
                  </Badge>
                );
              })}
            </div>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        {/* Titleholders */}
        {party.titleholders.map((th, i) => (
          <TitleholderRow key={th.name} titleholder={th} showSeparator={i > 0} />
        ))}

        {/* Agent */}
        {party.agent && (
          <>
            <Separator />
            <ContactBlock
              label={party.agent.role === "listing" ? "Listing Agent" : "Selling Agent"}
              contact={party.agent}
            />
            {party.agent.commission && (
              <p className="pl-0 text-xs text-onyx-60">
                Commission: <span className="font-medium">{party.agent.commission}</span>
              </p>
            )}
          </>
        )}

        {/* Lender */}
        {party.lender && (
          <>
            <Separator />
            <ContactBlock label="Lender" contact={party.lender} />
            {party.lender.loanOfficer && (
              <p className="text-xs text-onyx-60">
                Loan Officer: <span className="font-medium">{party.lender.loanOfficer}</span>
              </p>
            )}
          </>
        )}

        {/* Transaction Coordinator */}
        {party.transactionCoordinator && (
          <>
            <Separator />
            <ContactBlock label="Transaction Coordinator" contact={party.transactionCoordinator} />
          </>
        )}

        {/* Missing items warning */}
        {party.missingItems && party.missingItems.length > 0 && (
          <div className="mt-auto rounded-lg border border-warning-60/30 bg-warning-20 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning-80" />
              <p className="text-xs text-warning-80">
                <span className="font-medium">Missing: </span>
                {party.missingItems.join(", ")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- titleholder row ---------- */

function TitleholderRow({ titleholder: th, showSeparator }: { titleholder: Titleholder; showSeparator: boolean }) {
  return (
    <>
      {showSeparator && <div className="border-t border-onyx-10" />}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-onyx-50">
            Titleholder
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <VerificationIcon status={th.verificationStatus} />
          <span className="text-sm font-medium text-sapphire-70">{th.name}</span>
          {th.isPoa && (
            <Badge size="sm" variant="glass" className="border bg-amethyst-10/80 text-amethyst-70 border-amethyst-30/50 text-[10px]">
              POA
            </Badge>
          )}
        </div>
        <ContactRow email={th.email} phone={th.phone} />
        {th.spouse && (
          <div className="mt-1 space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-wider text-onyx-50">
              Spouse
            </p>
            <p className="text-sm font-medium text-sapphire-70">{th.spouse}</p>
          </div>
        )}
      </div>
    </>
  );
}
