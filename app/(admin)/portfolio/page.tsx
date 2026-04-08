"use client";

export default function PortfolioPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-onyx-10">
        <span className="text-xl text-onyx-50">&#8853;</span>
      </div>
      <p className="text-sm text-onyx-70">
        Select a file from the portfolio to get started
      </p>
      <p className="text-sm text-onyx-60">
        Or press{" "}
        <kbd className="rounded border border-onyx-20 bg-onyx-10 px-1.5 py-0.5 text-xs font-medium">
          &#8984;K
        </kbd>{" "}
        to search
      </p>
    </div>
  );
}
