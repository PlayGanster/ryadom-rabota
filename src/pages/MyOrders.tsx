import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ClipboardList, CalendarDays, MapPin, DollarSign, Users, Inbox, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { getCache, setCache, hasCache } from "@/lib/cache"
import { Order } from "@/lib/types"
import { myOrdersStatusMap, formatDate, shortAddress } from "@/lib/format"
import { PageHeader, EmptyState, MyOrderCardSkeleton } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { useDelayedSkeleton } from "@/lib/useDelayedSkeleton"

const filters = [
  { key: "", label: "Все" },
  { key: "open", label: "Открытые" },
  { key: "in_progress", label: "В работе" },
  { key: "done", label: "Завершённые" },
  { key: "cancelled", label: "Отменённые" },
]

const PAGE_SIZE = 10

export default function MyOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>(getCache<Order[]>(`my:orders:`) ?? [])
  const [filter, setFilter] = useState("")
  const [loading, setLoading] = useState(!hasCache("my:orders:"))
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const showSkeleton = useDelayedSkeleton(loading)

  const load = async (reset = true) => {
    const ORDERS_KEY = `my:orders:${filter}`
    if (reset) {
      setOffset(0)
      setHasMore(true)
      if (!hasCache(ORDERS_KEY)) {
        setLoading(true)
        setOrders([])
      }
    } else {
      setLoadingMore(true)
    }
    try {
      const off = reset ? 0 : offset + PAGE_SIZE
      const params: any = { limit: PAGE_SIZE, offset: off }
      if (filter) params.status = filter
      const r = await api.get<Order[]>("/orders/my", { params })
      if (reset) {
        setOrders(r.data)
        setOffset(0)
        setCache(ORDERS_KEY, r.data)
      } else {
        setOrders((prev) => [...prev, ...r.data])
        setOffset(off)
      }
      setHasMore(r.data.length >= PAGE_SIZE)
    } catch {
      // ignore
    }
    setLoading(false)
    setLoadingMore(false)
  }

  useEffect(() => {
    load(true)
  }, [filter])

  if (showSkeleton)
    return (
      <div className="bg-[#f0f2f5]">
        <div className="p-4">
          <PageHeader icon={<ClipboardList className="h-6 w-6" />} title="Мои заказы" />
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <MyOrderCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )

  return (
    <div className="bg-[#f0f2f5]">
      <div className="p-4">
        <PageHeader icon={<ClipboardList className="h-6 w-6" />} title="Мои заказы" />

        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                filter === f.key ? "bg-primary text-white" : "bg-white text-muted-foreground shadow-sm"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {orders.length === 0 && !loading ? (
          <EmptyState icon={<Inbox className="h-12 w-12" />} title="Пусто" subtitle="У вас пока нет заказов" />
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => {
              const st = myOrdersStatusMap[o.status] || { text: o.status, color: "#9ca3af" }
              return (
                <div
                  key={o.id}
                  onClick={() => navigate(`/order/${o.id}`)}
                  className="cursor-pointer rounded-2xl border border-border bg-white p-4 shadow-sm active:scale-[0.99]"
                >
                  <div className="mb-2 text-base font-bold text-foreground">{o.title}</div>
                  <div className="mb-2.5 flex gap-3">
                    <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      {formatDate(o.datetime)}
                    </span>
                    <span className="flex max-w-[140px] items-center gap-1 truncate text-[12px] text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                      {shortAddress(undefined, o.address)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-xl font-bold text-foreground">{o.budget} ₽</span>
                      {o.hourly_rate ? (
                        <span className="ml-1 text-[11px] text-muted-foreground">
                          {o.hourly_rate}₽/ч · {o.hours}ч
                        </span>
                      ) : (
                        <span className="ml-1 text-[11px] text-muted-foreground">за смену</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(o.workers_needed || 1) > 1 && (
                        <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {o.accepted_count || 0}/{o.workers_needed || 1}
                        </span>
                      )}
                      <span
                        className="rounded-md px-2 py-1 text-[11px] font-semibold"
                        style={{ color: st.color, background: st.color + "22" }}
                      >
                        {st.text}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {hasMore && orders.length > 0 && (
              <Button variant="secondary" className="mt-1 w-full" disabled={loadingMore} onClick={() => load(false)}>
                {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Загрузить ещё
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
