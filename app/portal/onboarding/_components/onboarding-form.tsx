"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAtom, useAtomValue } from "jotai";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { userNameAtom } from "@/lib/auth/atoms";
import { portalOnboardedAtom, portalProfileAtom } from "@/app/portal/_lib/atoms";
import { cn } from "@/lib/utils";

const COMM_OPTIONS = [
  {
    value: "important" as const,
    label: "Important only",
    description: "Status changes and action items",
  },
  {
    value: "all" as const,
    label: "All updates",
    description: "Every document and message",
  },
  {
    value: "digest" as const,
    label: "Daily digest",
    description: "One email per day",
  },
];

export function OnboardingForm() {
  const router = useRouter();
  const userName = useAtomValue(userNameAtom);
  const [, setOnboarded] = useAtom(portalOnboardedAtom);
  const [profile, setProfile] = useAtom(portalProfileAtom);

  const [name, setName] = useState(profile.displayName || userName || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [commPref, setCommPref] = useState(profile.communicationPref);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfile({ displayName: name, phone, communicationPref: commPref });
    setOnboarded(true);
    router.push("/portal");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold text-onyx-100">
          Welcome{name ? `, ${name.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-sm text-onyx-60">
          Let&apos;s set up your account so we can keep you informed about your
          closing.
        </p>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          required
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 555-0100"
        />
        <p className="text-xs text-onyx-40">
          Optional — for urgent closing-related communications
        </p>
      </div>

      {/* Communication preferences */}
      <div className="space-y-2">
        <Label>How should we reach you?</Label>
        <div className="space-y-2">
          {COMM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCommPref(opt.value)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                commPref === opt.value
                  ? "border-sapphire-40 bg-sapphire-10/50 ring-1 ring-sapphire-40/30"
                  : "border-onyx-20 bg-white hover:border-onyx-30",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                  commPref === opt.value
                    ? "border-sapphire-60"
                    : "border-onyx-30",
                )}
              >
                {commPref === opt.value && (
                  <div className="h-2 w-2 rounded-full bg-sapphire-60" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-onyx-100">
                  {opt.label}
                </p>
                <p className="text-xs text-onyx-50">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg">
        Continue
      </Button>
    </form>
  );
}
