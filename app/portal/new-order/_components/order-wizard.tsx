"use client";

import { useState } from "react";
import { OrderWizardProgress } from "./order-wizard-progress";
import { OrderStepProperty, type PropertyData } from "./order-step-property";
import { OrderStepDeal, type DealData } from "./order-step-deal";
import { OrderStepParties, type PartiesData } from "./order-step-parties";
import { OrderStepReview } from "./order-step-review";
import { OrderConfirmation } from "./order-confirmation";

export function OrderWizard() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [property, setProperty] = useState<PropertyData>({
    street: "",
    city: "",
    state: "TX",
    zip: "",
    county: "",
  });

  const [deal, setDeal] = useState<DealData>({
    transactionType: "",
    price: "",
    closingDate: "",
  });

  const [parties, setParties] = useState<PartiesData>({
    role: "",
    agentName: "",
    agentEmail: "",
    lenderName: "",
  });

  if (submitted) return <OrderConfirmation />;

  return (
    <div className="space-y-6">
      <OrderWizardProgress currentStep={step} />

      {step === 0 && (
        <OrderStepProperty
          data={property}
          onChange={setProperty}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <OrderStepDeal
          data={deal}
          onChange={setDeal}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <OrderStepParties
          data={parties}
          onChange={setParties}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <OrderStepReview
          property={property}
          deal={deal}
          parties={parties}
          onSubmit={() => setSubmitted(true)}
          onBack={() => setStep(2)}
          onEditStep={setStep}
        />
      )}
    </div>
  );
}
