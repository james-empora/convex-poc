import Image from "next/image";
import { OnboardingForm } from "./_components/onboarding-form";

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="mb-8 flex justify-center">
        <Image
          src="/empora-logo.svg"
          alt="Empora"
          width={32}
          height={32}
          className="h-8 w-auto"
        />
      </div>
      <OnboardingForm />
    </div>
  );
}
