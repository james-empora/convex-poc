"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

/** Fake zip → county lookup */
const ZIP_COUNTY_MAP: Record<string, string> = {
  "78701": "Travis County",
  "78702": "Travis County",
  "75201": "Dallas County",
  "75202": "Dallas County",
  "77001": "Harris County",
  "77002": "Harris County",
  "73301": "Travis County",
  "76101": "Tarrant County",
};

export interface PropertyData {
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
}

interface OrderStepPropertyProps {
  data: PropertyData;
  onChange: (data: PropertyData) => void;
  onNext: () => void;
}

export function OrderStepProperty({ data, onChange, onNext }: OrderStepPropertyProps) {
  function update(field: keyof PropertyData, value: string) {
    const next = { ...data, [field]: value };
    // Auto-detect county from zip
    if (field === "zip" && value.length === 5) {
      next.county = ZIP_COUNTY_MAP[value] ?? "";
    }
    onChange(next);
  }

  const valid = data.street && data.city && data.state && data.zip.length === 5;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="street">Street Address</Label>
        <Input
          id="street"
          value={data.street}
          onChange={(e) => update("street", e.target.value)}
          placeholder="123 Main St"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={data.city}
          onChange={(e) => update("city", e.target.value)}
          placeholder="Austin"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>State</Label>
          <Select value={data.state} onValueChange={(v) => update("state", v)}>
            <SelectTrigger>
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip">Zip Code</Label>
          <Input
            id="zip"
            value={data.zip}
            onChange={(e) => update("zip", e.target.value.slice(0, 5))}
            placeholder="78701"
            inputMode="numeric"
          />
        </div>
      </div>

      {data.county && (
        <div className="rounded-lg bg-sapphire-10/50 px-3 py-2">
          <p className="text-xs text-onyx-50">County (auto-detected)</p>
          <p className="text-sm font-medium text-onyx-100">{data.county}</p>
        </div>
      )}

      <Button onClick={onNext} disabled={!valid} className="w-full">
        Next: File Info
      </Button>
    </div>
  );
}
