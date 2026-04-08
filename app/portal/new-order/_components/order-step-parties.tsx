"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PartiesData {
  role: "buyer" | "seller" | "";
  agentName: string;
  agentEmail: string;
  lenderName: string;
}

interface OrderStepPartiesProps {
  data: PartiesData;
  onChange: (data: PartiesData) => void;
  onNext: () => void;
  onBack: () => void;
}

const ROLE_OPTIONS = [
  { value: "buyer" as const, label: "Buyer" },
  { value: "seller" as const, label: "Seller" },
];

export function OrderStepParties({ data, onChange, onNext, onBack }: OrderStepPartiesProps) {
  function update(field: keyof PartiesData, value: string) {
    onChange({ ...data, [field]: value });
  }

  const valid = data.role !== "";

  return (
    <div className="space-y-4">
      {/* Role */}
      <div className="space-y-2">
        <Label>Your Role</Label>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update("role", opt.value)}
              className={cn(
                "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                data.role === opt.value
                  ? "border-sapphire-40 bg-sapphire-10/50 text-sapphire-70 ring-1 ring-sapphire-40/30"
                  : "border-onyx-20 bg-white text-onyx-70 hover:border-onyx-30",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Agent info */}
      <div className="space-y-2">
        <Label htmlFor="agent-name">Real Estate Agent Name</Label>
        <Input
          id="agent-name"
          value={data.agentName}
          onChange={(e) => update("agentName", e.target.value)}
          placeholder="Agent name (optional)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-email">Agent Email</Label>
        <Input
          id="agent-email"
          type="email"
          value={data.agentEmail}
          onChange={(e) => update("agentEmail", e.target.value)}
          placeholder="agent@example.com (optional)"
        />
      </div>

      {/* Lender */}
      <div className="space-y-2">
        <Label htmlFor="lender">Lender Name</Label>
        <Input
          id="lender"
          value={data.lenderName}
          onChange={(e) => update("lenderName", e.target.value)}
          placeholder="Lender name (optional)"
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} disabled={!valid} className="flex-1">
          Next: Review
        </Button>
      </div>
    </div>
  );
}
