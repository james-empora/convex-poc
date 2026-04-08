"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SwitchesDemo() {
  return (
    <div className="grid max-w-lg gap-6">
      <div className="flex items-center justify-between rounded-xl border border-onyx-20 bg-onyx-5 px-5 py-4 transition-all duration-200 hover:border-onyx-30">
        <div className="space-y-0.5">
          <Label htmlFor="email-notifications" className="text-sm font-medium text-onyx-90">
            Email notifications
          </Label>
          <p className="text-sm text-onyx-60">
            Receive file updates via email
          </p>
        </div>
        <Switch id="email-notifications" defaultChecked />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-onyx-20 bg-onyx-5 px-5 py-4 transition-all duration-200 hover:border-onyx-30">
        <div className="space-y-0.5">
          <Label htmlFor="auto-assign" className="text-sm font-medium text-onyx-90">
            Auto-assign deals
          </Label>
          <p className="text-sm text-onyx-60">
            Automatically assign new deals to available closers
          </p>
        </div>
        <Switch id="auto-assign" />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-onyx-20 bg-onyx-5 px-5 py-4 transition-all duration-200 hover:border-onyx-30">
        <div className="space-y-0.5">
          <Label htmlFor="wire-alerts" className="text-sm font-medium text-onyx-90">
            Wire change alerts
          </Label>
          <p className="text-sm text-onyx-60">
            Get notified when wire instructions change close to closing
          </p>
        </div>
        <Switch id="wire-alerts" defaultChecked />
      </div>
    </div>
  );
}
