// Reusable Loading Skeleton Components
// Used across app for better perceived performance
import { Skeleton } from "@/components/ui/skeleton";

export const CardSkeleton = () => (
  <div className="card">
    <Skeleton className="h-4 w-3/4 mb-3" />
    <Skeleton className="h-6 w-1/2 mb-2" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

export const TableRowSkeleton = () => (
  <tr className="border-b">
    <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
    <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
    <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
    <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
    <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
    <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
  </tr>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left py-3 px-4 text-sm"><Skeleton className="h-4 w-16" /></th>
          <th className="text-left py-3 px-4 text-sm"><Skeleton className="h-4 w-20" /></th>
          <th className="text-left py-3 px-4 text-sm hidden sm:table-cell"><Skeleton className="h-4 w-24" /></th>
          <th className="text-left py-3 px-4 text-sm"><Skeleton className="h-4 w-12" /></th>
          <th className="text-right py-3 px-4 text-sm"><Skeleton className="h-4 w-16 ml-auto" /></th>
          <th className="text-right py-3 px-4 text-sm"><Skeleton className="h-4 w-16 ml-auto" /></th>
        </tr>
      </thead>
      <tbody>
        {[...Array(rows)].map((_, i) => <TableRowSkeleton key={i} />)}
      </tbody>
    </table>
  </div>
);

export const GoalCardSkeleton = () => (
  <div className="card">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
    <Skeleton className="w-full h-3 rounded-full mb-3" />
    <div className="flex justify-between">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-20" />
    </div>
  </div>
);

export const BudgetCardSkeleton = () => (
  <div className="card">
    <div className="flex items-center justify-between mb-3">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-6 w-20" />
    </div>
    <Skeleton className="w-full h-2 rounded-full mb-3" />
    <div className="flex justify-between">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <Skeleton className="h-8 w-48 mb-6" />

    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card">
          <Skeleton className="h-4 w-20 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>

    {/* Chart Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="card">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-64 w-full rounded" />
        </div>
      ))}
    </div>
  </div>
);

export const ListSkeleton = ({ items = 5 }) => (
  <div className="space-y-3">
    {[...Array(items)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// Inline skeleton for small components
export const InlineSkeleton = ({ width = 'w-20' }) => (
  <Skeleton className={`h-4 ${width}`} />
);

