"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PropertyData } from "./order-step-property";
import type { DealData } from "./order-step-deal";
import type { PartiesData } from "./order-step-parties";

interface OrderStepReviewProps {
  property: PropertyData;
  deal: DealData;
  parties: PartiesData;
  onSubmit: () => void;
  onBack: () => void;
  onEditStep: (step: number) => void;
}

function Section({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-onyx-50">
          {title}
        </h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-xs font-medium text-sapphire-60 hover:text-sapphire-70"
        >
          Edit
        </button>
      </div>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-onyx-60">{label}</span>
      <span className="font-medium text-onyx-100">{value}</span>
    </div>
  );
}

export function OrderStepReview({
  property,
  deal,
  parties,
  onSubmit,
  onBack,
  onEditStep,
}: OrderStepReviewProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <Section title="Property" step={0} onEdit={onEditStep}>
            <Row label="Address" value={`${property.street}, ${property.city}`} />
            <Row label="State / Zip" value={`${property.state} ${property.zip}`} />
            {property.county && <Row label="County" value={property.county} />}
          </Section>

          <Separator />

          <Section title="File Info" step={1} onEdit={onEditStep}>
            <Row
              label="Type"
              value={
                deal.transactionType === "purchase"
                  ? "Purchase"
                  : deal.transactionType === "refinance"
                    ? "Refinance"
                    : ""
              }
            />
            <Row
              label={deal.transactionType === "refinance" ? "Loan Amount" : "Price"}
              value={deal.price ? `$${deal.price}` : ""}
            />
            {deal.closingDate && <Row label="Target Close" value={deal.closingDate} />}
          </Section>

          <Separator />

          <Section title="Parties" step={2} onEdit={onEditStep}>
            <Row label="Your Role" value={parties.role === "buyer" ? "Buyer" : parties.role === "seller" ? "Seller" : ""} />
            {parties.agentName && <Row label="Agent" value={parties.agentName} />}
            {parties.agentEmail && <Row label="Agent Email" value={parties.agentEmail} />}
            {parties.lenderName && <Row label="Lender" value={parties.lenderName} />}
          </Section>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onSubmit} className="flex-1">
          Submit Order
        </Button>
      </div>
    </div>
  );
}
