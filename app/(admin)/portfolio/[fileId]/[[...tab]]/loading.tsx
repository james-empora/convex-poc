/**
 * Next.js loading boundary for file detail pages.
 *
 * This wraps the page in a <Suspense> boundary so that when navigating
 * between files, the layout (rail, resource panes) stays stable and only
 * the content well shows a skeleton until the new RSC data arrives.
 */
export default function FileTabLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Tab bar skeleton */}
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-onyx-20 bg-white px-2">
        <div className="h-5 w-20 animate-pulse rounded bg-onyx-10" />
        <div className="h-5 w-20 animate-pulse rounded bg-onyx-10" />
      </div>

      {/* Content area skeleton */}
      <div className="min-h-0 flex-1 overflow-hidden bg-onyx-5 p-6">
        <div className="space-y-6">
          {/* File header skeleton */}
          <div className="space-y-3">
            <div className="h-5 w-64 animate-pulse rounded bg-onyx-15" />
            <div className="flex gap-3">
              <div className="h-4 w-28 animate-pulse rounded bg-onyx-10" />
              <div className="h-4 w-20 animate-pulse rounded bg-onyx-10" />
              <div className="h-4 w-24 animate-pulse rounded bg-onyx-10" />
            </div>
          </div>

          {/* Detail cards skeleton */}
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 animate-pulse rounded-xl border border-onyx-15 bg-white" />
            <div className="h-32 animate-pulse rounded-xl border border-onyx-15 bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
