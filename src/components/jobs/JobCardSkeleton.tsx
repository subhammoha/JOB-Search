export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="h-3 bg-gray-100 rounded w-20 mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-gray-100 rounded w-24" />
        <div className="h-5 bg-gray-100 rounded w-20" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-full mb-1" />
      <div className="h-3 bg-gray-100 rounded w-5/6 mb-4" />
      <div className="flex justify-end">
        <div className="h-8 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}
