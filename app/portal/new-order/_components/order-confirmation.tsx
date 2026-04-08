"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function OrderConfirmation() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-20">
        <CheckCircle className="h-8 w-8 text-success-60" />
      </div>

      <h1 className="mt-4 font-heading text-2xl font-bold text-onyx-100">
        Order Submitted!
      </h1>
      <p className="mt-2 max-w-sm text-sm text-onyx-60">
        Your title order has been received. Our team will review it and get
        started right away. You&apos;ll receive an email once your file is open.
      </p>

      <Button asChild className="mt-6">
        <Link href="/portal">Back to Home</Link>
      </Button>
    </div>
  );
}
