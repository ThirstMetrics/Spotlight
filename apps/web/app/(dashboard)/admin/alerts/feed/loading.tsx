export default function AlertFeedLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mt-2" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6">
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="rounded-lg border">
        <div className="p-6 border-b">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
