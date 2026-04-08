"use client";

import { Calendar, DollarSign, FileSignature, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActionItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  buttonLabel: string;
  dueDate: string;
  urgent?: boolean;
}

const ACTION_ITEMS: ActionItem[] = [
  {
    title: "Submit Earnest Money Deposit",
    description:
      "Your EMD of $8,500 is due within 3 business days of contract execution. Pay securely online or view wire instructions in your Documents.",
    icon: DollarSign,
    buttonLabel: "Pay EMD Online",
    dueDate: "Apr 2, 2026",
    urgent: true,
  },
  {
    title: "Sign Seller Authorization",
    description:
      "Review and e-sign your seller authorization form to allow Empora to proceed with title work on your behalf.",
    icon: FileSignature,
    buttonLabel: "Review & Sign",
    dueDate: "Apr 5, 2026",
  },
  {
    title: "Provide Proof of Insurance",
    description:
      "Upload your homeowner's insurance binder showing the property address and effective date on or before closing.",
    icon: ShieldCheck,
    buttonLabel: "Upload Document",
    dueDate: "Apr 10, 2026",
  },
];

export function PortalActionItems() {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-onyx-40">
        Action Items
      </h2>
      <div className="space-y-3">
        {ACTION_ITEMS.map((item) => (
          <Card key={item.title} size="sm">
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sapphire-10">
                  <item.icon className="h-4 w-4 text-sapphire-60" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-onyx-100">
                      {item.title}
                    </p>
                    {item.urgent && (
                      <Badge
                        variant="glass"
                        size="sm"
                        className="border border-danger-80/20 bg-danger-20/80 text-xs text-danger-80"
                      >
                        Urgent
                      </Badge>
                    )}
                    <span className="ml-auto flex shrink-0 items-center gap-1 text-sm text-onyx-50">
                      <Calendar className="h-3 w-3" />
                      {item.dueDate}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-onyx-60">
                    {item.description}
                  </p>
                  <Button
                    variant="outline"
                    size="default"
                    className="mt-3"
                    onClick={() => {}}
                  >
                    {item.buttonLabel}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
