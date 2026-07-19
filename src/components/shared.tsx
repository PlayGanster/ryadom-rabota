import { ReactNode } from "react"

export function PageHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="text-primary">{icon}</span>
      <h1 className="m-0 text-md font-bold text-foreground">{title}</h1>
    </div>
  )
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-border ${className}`} />
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <Skeleton className="h-[21px] w-3/4" />
        <Skeleton className="h-[24px] w-20 flex-shrink-0" />
      </div>
      <div className="mb-3 space-y-1.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
      </div>
      <div className="mb-3 space-y-1.5 rounded-xl bg-muted p-3">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2.5">
        <div className="flex gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-[28px] w-[78px] rounded-lg" />
      </div>
    </div>
  )
}

export function MyOrderCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <Skeleton className="mb-2 h-[22px] w-3/4" />
      <div className="mb-2.5 flex gap-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-32" />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2.5">
        <Skeleton className="h-6 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
      </div>
    </div>
  )
}

export function ChatItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-[13px] w-3/4" />
      </div>
    </div>
  )
}

export function ChatRoomSkeleton() {
  return (
    <div className="flex h-full flex-col bg-[#f0f2f5]">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-border bg-white px-4 py-3">
        <Skeleton className="h-[22px] w-[22px]" />
        <Skeleton className="h-9 w-9 flex-shrink-0 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton className="h-16 w-3/4 rounded-2xl" />
        <Skeleton className="ml-auto h-16 w-2/3 rounded-2xl" />
        <Skeleton className="h-16 w-3/4 rounded-2xl" />
      </div>
      <div className="flex flex-shrink-0 items-center gap-2 border-t border-border bg-white p-2.5">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  )
}

export function OrderDetailSkeleton() {
  return (
    <div className="bg-[#f0f2f5]">
      <div className="p-4">
        <div className="mb-5 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-7 w-36" />
        </div>
        <div className="mb-3.5 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-2">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-6 w-20 rounded-lg" />
          </div>
          <Skeleton className="mb-4 h-9 w-36" />
          <div className="mb-4 space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
          </div>
          <div className="mb-4 space-y-2 rounded-xl bg-muted p-3.5">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-9 w-40 rounded-lg" />
          </div>
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-muted p-3">
            <Skeleton className="h-[18px] w-[18px] rounded" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="ml-auto h-4 w-28" />
          </div>
          <div className="mt-3.5 flex items-center gap-3 border-t border-border pt-3.5">
            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
      <div className="mb-3 flex justify-center text-muted-foreground">{icon}</div>
      <div className="mb-1 text-base font-semibold text-foreground">{title}</div>
      {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
    </div>
  )
}
