"use client";

import { OrderWizard } from "./_components/order-wizard";

export default function NewOrderPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-onyx-100">Open New File</h1>
      <OrderWizard />
    </div>
  );
}
