"use client";

import { AccountSettings } from "./_components/account-settings";

export default function AccountPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-onyx-100">Account</h1>
      <AccountSettings />
    </div>
  );
}
