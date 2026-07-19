import { useState, useEffect, useMemo } from "react"
import { useDelayedSkeleton } from "@/lib/useDelayedSkeleton"
import { useNavigate } from "react-router-dom"
import { Zap, MapPin, CalendarDays, Users, Search, X, SlidersHorizontal, Inbox, ArrowRightCircle, ChevronRight, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { getCache, setCache, hasCache } from "@/lib/cache"
import { Order } from "@/lib/types"
import { formatWhen, formatDate, mapsUrl, shortAddress } from "@/lib/format"
import { PageHeader, EmptyState, OrderCardSkeleton } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogSheetContent, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DateWheelPicker, TimeWheelPicker } from "@/components/WheelPicker"

const PAGE_SIZE = 20

export default function Feed() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const FEED_KEY = "feed:orders"
  const [orders, setOrders] = useState<Order[]>(getCache<Order[]>(FEED_KEY) ?? [])
  const [loading, setLoading] = useState(!hasCache(FEED_KEY))
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState("")
  const [priceFrom, setPriceFrom] = useState("")
  const [priceTo, setPriceTo] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [timeFrom, setTimeFrom] = useState("")
  const [showDateFrom, setShowDateFrom] = useState(false)
  const [showDateTo, setShowDateTo] = useState(false)
  const [showTimeFrom, setShowTimeFrom] = useState(false)

  const showSkeleton = useDelayedSkeleton(loading)

  const load = async (reset = true) => {
    if (reset) {
      setOffset(0)
      setHasMore(true)
      if (!hasCache(FEED_KEY)) {
        setLoading(true)
        setOrders([])
      }
    } else {
      setLoadingMore(true)
    }
    try {
      const off = reset ? 0 : offset + PAGE_SIZE
      const r = await api.get<Order[]>("/orders", { params: { limit: PAGE_SIZE, offset: off } })
      if (reset) {
        setOrders(r.data)
        setOffset(0)
        setCache(FEED_KEY, r.data)
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

  const filtered = useMemo(() => {
    let list = orders
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          (o.description?.toLowerCase().includes(q) ?? false) ||
          (o.address?.toLowerCase().includes(q) ?? false)
      )
    }
    if (priceFrom) list = list.filter((o) => o.budget >= Number(priceFrom))
    if (priceTo) list = list.filter((o) => o.budget <= Number(priceTo))
    if (dateFrom)
      list = list.filter((o) => new Date(o.datetime).toISOString().slice(0, 10) >= dateFrom)
    if (dateTo)
      list = list.filter((o) => new Date(o.datetime).toISOString().slice(0, 10) <= dateTo)
    if (timeFrom)
      list = list.filter((o) => new Date(o.datetime).toTimeString().slice(0, 5) >= timeFrom)
    return list
  }, [orders, search, priceFrom, priceTo, dateFrom, dateTo, timeFrom])

  const hasFilters = priceFrom || priceTo || dateFrom || dateTo || timeFrom

  const resetFilters = () => {
    setPriceFrom("")
    setPriceTo("")
    setDateFrom("")
    setDateTo("")
    setTimeFrom("")
  }

  if (showSkeleton)
    return (
      <div className="bg-[#f0f2f5]">
        <div className="p-4">
          <PageHeader icon={<Zap className="h-6 w-6" />} title="Лента задач" />
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
        <PageHeader icon={<Zap className="h-6 w-6" />} title="Лента задач" />

        <div className="mb-3 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-white px-3 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск задач..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant={hasFilters ? "default" : "secondary"}
                size="icon"
                className={`h-[42px] w-[42px] ${hasFilters ? "" : "border border-border bg-white text-foreground shadow-sm hover:bg-white hover:text-foreground"}`}
              >
                <SlidersHorizontal className="h-[18px] w-[18px]" />
              </Button>
            </DialogTrigger>
            <DialogSheetContent>
              <div className="mb-3 text-center text-[15px] font-bold text-foreground">Фильтры</div>
              <div className="max-h-[60vh] space-y-4 overflow-y-auto">
                <div className="space-y-1.5">
                  <Label>Дата</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDateFrom(true)}
                      className="flex-1 rounded-xl border border-border bg-white px-3 py-2.5 text-left text-[14px] shadow-sm"
                    >
                      {dateFrom ? formatDate(dateFrom) : "От"}
                    </button>
                    <button
                      onClick={() => setShowDateTo(true)}
                      className="flex-1 rounded-xl border border-border bg-white px-3 py-2.5 text-left text-[14px] shadow-sm"
                    >
                      {dateTo ? formatDate(dateTo) : "До"}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Время начала</Label>
                  <button
                    onClick={() => setShowTimeFrom(true)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-left text-[14px] shadow-sm"
                  >
                    {timeFrom || "Выбрать время"}
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label>Цена от, ₽</Label>
                  <Input type="number" placeholder="0" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Цена до, ₽</Label>
                  <Input type="number" placeholder="∞" value={priceTo} onChange={(e) => setPriceTo(e.target.value)} />
                </div>
                <div className="flex gap-2 pb-1">
                  {hasFilters && (
                    <Button variant="destructive" onClick={resetFilters} className="flex-1 bg-red-50 text-destructive hover:bg-red-100">
                      Сбросить
                    </Button>
                  )}
                  <DialogClose asChild>
                    <Button className="flex-1">Применить</Button>
                  </DialogClose>
                </div>
              </div>
            </DialogSheetContent>
          </Dialog>
        </div>

        <DateWheelPicker
          open={showDateFrom}
          onOpenChange={setShowDateFrom}
          value={dateFrom}
          onConfirm={setDateFrom}
        />
        <DateWheelPicker
          open={showDateTo}
          onOpenChange={setShowDateTo}
          value={dateTo}
          onConfirm={setDateTo}
        />
        <TimeWheelPicker
          open={showTimeFrom}
          onOpenChange={setShowTimeFrom}
          value={timeFrom}
          onConfirm={setTimeFrom}
        />

        {filtered.length === 0 && !loading ? (
          <EmptyState
            icon={<Inbox className="h-12 w-12" />}
            title={search || hasFilters ? "Ничего не найдено" : "Нет заказов"}
            subtitle={search || hasFilters ? "Попробуйте изменить запрос" : "Пока нет открытых заказов в вашем городе"}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((o) => {
              const free = Math.max(0, (o.workers_needed || 1) - (o.accepted_count || 0))
              return (
                <div
                  key={o.id}
                  onClick={() => navigate(`/order/${o.id}`)}
                  className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm transition-transform active:scale-[0.99]"
                >
                  <div className="mb-2 flex items-start justify-between gap-3 ">
                    <div className="text-[17px] font-bold leading-tight text-foreground">{o.title}</div>
                    <div className="flex-shrink-1 whitespace-nowrap text-right flex gap-2 items-end">
                      <div className="text-xl font-bold text-foreground">{o.budget} ₽</div>
                      <div className="text-[11px] mb-[3px] text-muted-foreground">
                        {o.hourly_rate ? `${o.hourly_rate}₽/ч` : "за смену"}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 space-y-1.5 rounded-xl bg-muted p-3">
                    {o.description && (
                      <>
                        <p className="mb-1 text-[14px] font-medium">Описание</p>
                        <div className="mb-0 line-clamp-3 text-[14px] leading-[20px] text-muted-foreground">
                          {o.description}
                        </div>
                      </>
                    )}
                  </div>

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
                      {(o.workers_needed || 1) > 1 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-primary" />
                          {free} мест свободно
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

                  {o.hourly_rate && (
                    <div className="mt-2 text-[12px] text-muted-foreground">
                      Почасовая: {o.hourly_rate} ₽/ч · {o.hours} ч
                    </div>
                  )}

                  {user?.role === "executor" && o.status === "open" && (
                    <Button
                      className="mt-3 w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/order/${o.id}`)
                      }}
                    >
                      <ArrowRightCircle className="h-[18px] w-[18px]" />
                      Подать заявку
                    </Button>
                  )}
                </div>
              )
            })}

            {hasMore && !loading && (
              <Button
                variant="secondary"
                className="mt-2 w-full"
                disabled={loadingMore}
                onClick={() => load(false)}
              >
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
