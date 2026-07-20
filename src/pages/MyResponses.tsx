import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRightCircle, MapPin, CalendarDays, Inbox, Users, Loader2, Rocket } from "lucide-react"
import api, { getReferralInfo, applyBoost } from "@/lib/api"
import { getCache, setCache, hasCache } from "@/lib/cache"
import { Order } from "@/lib/types"
import { myResponsesStatusMap, formatWhen, mapsUrl, shortAddress } from "@/lib/format"
import { PageHeader, EmptyState, OrderCardSkeleton } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { useDelayedSkeleton } from "@/lib/useDelayedSkeleton"
import { hapticNotify } from "@/lib/telegram"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"

const PAGE_SIZE = 10

export default function MyResponses() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const RESP_KEY = "my:responses"
  const [orders, setOrders] = useState<Order[]>(getCache<Order[]>(RESP_KEY) ?? [])
  const [loading, setLoading] = useState(!hasCache(RESP_KEY))
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const showSkeleton = useDelayedSkeleton(loading)

  const load = async (reset = true) => {
    if (reset) {
      setOffset(0)
      setHasMore(true)
      if (!hasCache(RESP_KEY)) {
        setLoading(true)
        setOrders([])
      }
    } else {
      setLoadingMore(true)
    }
    try {
      const off = reset ? 0 : offset + PAGE_SIZE
      const r = await api.get<Order[]>("/orders/my-responses", { params: { limit: PAGE_SIZE, offset: off } })
      if (reset) {
        setOrders(r.data)
        setOffset(0)
        setCache(RESP_KEY, r.data)
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
  }, [])

  const boostResponse = async (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const info = await getReferralInfo()
      const inv = info.inventory || { 1: 0, 2: 0, 3: 0 }
      let level = 0
      if (inv[3] > 0) level = 3
      else if (inv[2] > 0) level = 2
      else if (inv[1] > 0) level = 1
      if (!level) {
        toast.error("Нет бустов. Пригласите друзей в разделе «Рефералы»")
        hapticNotify("warning")
        return
      }
      // Найти свой отклик на этот заказ
      const r = await api.get<any[]>(`/orders/${orderId}/responses`)
      const myResp = r.data.find((x: any) => x.executor_id === user?.id)
      if (!myResp) {
        toast.error("Отклик не найден")
        return
      }
      await applyBoost("response", myResp.id, level)
      toast.success(`Отклик продвинут (буст ${level} ур.)`)
      hapticNotify("success")
    } catch {
      toast.error("Не удалось применить буст")
    }
  }

  if (showSkeleton)
    return (
      <div className="bg-[#f0f2f5]">
        <div className="p-4">
          <PageHeader icon={<ArrowRightCircle className="h-6 w-6" />} title="Мои отклики" />
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )

  return (
    <div className="bg-[#f0f2f5]">
      <div className="p-4">
        <PageHeader icon={<ArrowRightCircle className="h-6 w-6" />} title="Мои отклики" />

        {orders.length === 0 && !loading ? (
          <EmptyState
            icon={<Inbox className="h-12 w-12" />}
            title="Пусто"
            subtitle="Вы пока не откликались ни на один заказ"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => {
              const st = myResponsesStatusMap[o.status] || { text: o.status, color: "#9ca3af" }
              const free = Math.max(0, (o.workers_needed || 1) - (o.accepted_count || 0))
              return (
                <div
                  key={o.id}
                  onClick={() => navigate(`/order/${o.id}`)}
                  className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm transition-transform active:scale-[0.99]"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="text-[17px] font-bold leading-tight text-foreground">{o.title}</div>
                    <div className="flex-shrink-0 whitespace-nowrap text-right">
                      <div className="flex items-end gap-2">
                        <div className="text-xl font-bold text-foreground">{o.budget} ₽</div>
                        <div className="text-[11px] mb-[3px] text-muted-foreground">
                          {o.hourly_rate ? `${o.hourly_rate}₽/ч` : "за смену"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {o.description && (
                    <div className="mb-3 space-y-1.5 rounded-xl bg-muted p-3">
                      <p className="mb-1 text-[14px] font-medium">Описание</p>
                      <div className="mb-0 line-clamp-3 text-[14px] leading-[20px] text-muted-foreground">
                        {o.description}
                      </div>
                    </div>
                  )}

                  <div className="mb-3 space-y-1.5 rounded-xl bg-muted p-3">
                    <p className="mb-1 text-[14px] font-medium">Основная информация</p>
                    <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                      <CalendarDays className="h-4 w-4 flex-shrink-0 text-primary" />
                      {formatWhen(o.datetime)}
                    </div>
                    <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                      {shortAddress(o.city_name, o.address)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-2.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                      <span
                        className="rounded-md px-2 py-1 text-[11px] font-semibold"
                        style={{ color: st.color, background: st.color + "22" }}
                      >
                        {st.text}
                      </span>
                      {o.boosted && (
                        <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                          🚀 Буст {o.boost_level} ур.
                        </span>
                      )}
                      {(o.workers_needed || 1) > 1 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-primary" />
                          {free}/{o.workers_needed || 1} мест
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(mapsUrl(o.city_name, o.address), "_blank")
                      }}
                      className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[12px] font-semibold text-primary"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      На карте
                    </button>
                  </div>
                  {o.status === "open" && (
                    <Button
                      variant="secondary"
                      className="mt-2.5 w-full"
                      onClick={(e) => boostResponse(o.id, e)}
                    >
                      <Rocket className="h-4 w-4" /> Продвинуть отклик
                    </Button>
                  )}
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
