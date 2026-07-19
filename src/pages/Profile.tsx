import { useState, useEffect, useRef, useCallback, ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import {
  User as UserIcon,
  Phone,
  Briefcase,
  MapPin,
  Star,
  Bell,
  LogOut,
  ThumbsUp,
  ChevronRight,
  ArrowRightCircle,
  Check,
  Loader2,
  Search,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { Review, City } from "@/lib/types"
import { rating } from "@/lib/format"
import { Dialog, DialogSheetContent, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

async function subscribePush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Браузер не поддерживает push-уведомления")
  }
  const permission = await Notification.requestPermission()
  if (permission !== "granted") throw new Error("Разрешите уведомления в настройках браузера")
  const reg = await navigator.serviceWorker.ready
  const { data } = await api.get<{ publicKey: string }>("/push/vapid-key")
  if (!data.publicKey) throw new Error("VAPID ключ не настроен")
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(data.publicKey) as BufferSource,
  })
  const sub = subscription.toJSON()
  await api.post("/push/subscribe", {
    endpoint: sub.endpoint,
    p256dh: sub.keys!.p256dh,
    auth: sub.keys!.auth,
  })
  return true
}

async function unsubscribePush() {
  const reg = await navigator.serviceWorker.ready
  const subscription = await reg.pushManager.getSubscription()
  if (!subscription) return
  const sub = subscription.toJSON()
  await api.delete("/push/subscribe", {
    data: { endpoint: sub.endpoint, p256dh: sub.keys!.p256dh, auth: sub.keys!.auth },
  })
  await subscription.unsubscribe()
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

function ProfileRow({
  icon: Icon,
  label,
  value,
  onClick,
  trailing,
  danger,
}: {
  icon: LucideIcon
  label: string
  value?: string
  onClick?: () => void
  trailing?: ReactNode
  danger?: boolean
}) {
  const content = (
    <div className="flex w-full items-center gap-3 px-4 py-3.5">
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
          danger ? "bg-red-50" : "bg-primary/10"
        }`}
      >
        <Icon className={`h-[18px] w-[18px] ${danger ? "text-destructive" : "text-primary"}`} />
      </div>
      <span className={`flex-1 text-[15px] font-medium ${danger ? "text-destructive" : "text-foreground"}`}>
        {label}
      </span>
      {value && <span className="text-[14px] text-muted-foreground">{value}</span>}
      {trailing ?? (onClick ? <ChevronRight className="h-[18px] w-[18px] text-muted-foreground/60" /> : null)}
    </div>
  )
  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full rounded-3xl border border-border bg-white text-left transition-opacity active:opacity-70">
        {content}
      </button>
    )
  }
  return <div className="rounded-3xl border border-border bg-white">{content}</div>
}

const roleText: Record<string, string> = {
  customer: "Работодатель",
  executor: "Рабочий",
  admin: "Администратор",
}

export default function Profile() {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false)
  const [reviewsHasMore, setReviewsHasMore] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [citySearch, setCitySearch] = useState("")
  const [cityDialogOpen, setCityDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)

  const REVIEW_PAGE = 15

  const reviewsRef = useRef<HTMLDivElement>(null)
  const [canScrollReviews, setCanScrollReviews] = useState(false)

  const updateReviewsScroll = useCallback(() => {
    const el = reviewsRef.current
    if (!el) return
    setCanScrollReviews(el.scrollWidth - el.clientWidth - el.scrollLeft > 8)
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(updateReviewsScroll)
    return () => cancelAnimationFrame(id)
  }, [reviews, reviewsLoading, updateReviewsScroll])

  const loadReviews = async (reset = true) => {
    if (!user) return
    if (reset) {
      setReviewsLoading(true)
      setReviewsHasMore(true)
    } else {
      setReviewsLoadingMore(true)
    }
    try {
      const off = reset ? 0 : reviews.length
      const r = await api.get<Review[]>(`/reviews/${user.id}`, {
        params: { limit: REVIEW_PAGE, offset: off },
      })
      if (reset) {
        setReviews(r.data)
      } else {
        setReviews((prev) => [...prev, ...r.data])
      }
      setReviewsHasMore(r.data.length >= REVIEW_PAGE)
    } catch {
      // ignore
    }
    setReviewsLoading(false)
    setReviewsLoadingMore(false)
  }

  useEffect(() => {
    loadReviews(true)
  }, [user])

  const onReviewsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    updateReviewsScroll()
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 80) {
      if (reviewsHasMore && !reviewsLoadingMore && !reviewsLoading) {
        loadReviews(false)
      }
    }
  }

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription().then((sub) => setPushEnabled(!!sub)))
        .catch(() => {})
    }
  }, [])

  if (!user) return null

  const changeRole = async (r: string) => {
    try {
      await api.patch("/users/me", { role: r })
      const res = await api.get("/users/me")
      setUser(res.data)
      setRoleDialogOpen(false)
      toast.success("Роль обновлена")
    } catch {
      toast.error("Ошибка")
    }
  }

  const openCityDialog = async () => {
    setCitySearch("")
    if (cities.length === 0) {
      try {
        const r = await api.get<City[]>("/cities")
        setCities(r.data)
      } catch {
        toast.error("Не удалось загрузить города")
        return
      }
    }
    setCityDialogOpen(true)
  }

  const handleCityChange = async (cityId: number) => {
    if (!cityId) return
    try {
      await api.patch("/users/me", { city_id: cityId })
      const res = await api.get("/users/me")
      setUser(res.data)
      setCityDialogOpen(false)
      toast.success("Город обновлён")
    } catch {
      toast.error("Ошибка")
    }
  }

  const togglePush = async () => {
    try {
      if (pushEnabled) {
        await unsubscribePush()
        setPushEnabled(false)
        toast.success("Уведомления отключены")
      } else {
        const ok = await subscribePush()
        if (ok) {
          setPushEnabled(true)
          toast.success("Уведомления включены!")
        }
      }
    } catch (e: any) {
      toast.error("Ошибка: " + (e?.message || "неизвестная ошибка"))
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const initial = user.name?.charAt(0)?.toUpperCase() || "?"

  function SectionName({ title }: { title: string }) {
    return (
      <div className="mb-0 flex items-center">
        <h1 className="m-0 text-md font-bold text-foreground">{title}</h1>
      </div>
    )
  }

  return (
    <div className="bg-[#f0f2f5]">
      <div className="space-y-5 p-4">

        {/* <div className="flex flex-col items-center pt-1"> */}
          {/* <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#f08804] text-4xl font-extrabold text-white shadow-lg">
            {initial}
          </div>
          <div className="mt-3 text-2xl font-extrabold text-foreground">{user.name}</div>
          <div className="mt-1.5 rounded-full bg-primary/10 px-3 py-1 text-[13px] font-semibold text-primary">
            {roleText[user.role] || user.role}
          </div> */}
          {/* <div className="mt-4 flex items-center gap-12">
            <div className="flex flex-col items-center">
              <Stars value={user.rating || 0} />
              <span className="mt-1 text-[11px] text-muted-foreground">{rating(user.rating)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-extrabold text-foreground">{reviews.length}</span>
              <span className="text-[11px] text-muted-foreground">Отзывы</span>
            </div>
          </div> */}
        {/* </div> */}
        <SectionName title="Основная информация" />

        <div className="space-y-2 mt-[12px!important]">
          <ProfileRow icon={UserIcon} label="Имя" value={user.name} />
          <ProfileRow icon={Phone} label="Телефон" value={user.phone} />
          <ProfileRow
            icon={MapPin}
            label="Город"
            value={user.city_name || "Не указан"}
            onClick={openCityDialog}
          />
          <ProfileRow
            icon={Briefcase}
            label="Роль"
            value={roleText[user.role] || user.role}
            onClick={() => setRoleDialogOpen(true)}
          />
        </div>
        <SectionName title="Уведомления" />

        <div className="space-y-2.5 mt-[12px!important]">
          <ProfileRow
            icon={Bell}
            label="Уведомления"
            onClick={togglePush}
            trailing={<Switch checked={pushEnabled} onChange={togglePush} />}
          />
        </div>
        <SectionName title={reviewsLoading ? "Отзывы" : `Отзывы(${reviews.length})`} />
        {reviewsLoading ? (
          <div className="mt-[12px!important]">
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex min-w-[82%] max-w-[82%] flex-shrink-0 snap-start flex-col gap-3 rounded-2xl border border-border bg-white p-3.5"
                >
                  <div className="h-3.5 w-1/2 animate-pulse rounded bg-border" />
                  <div className="h-3 w-full animate-pulse rounded bg-border" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-border" />
                </div>
              ))}
            </div>
          </div>
        ) : reviews.length > 0 ? (
          <div className="relative mt-[12px!important]">
            <div
              ref={reviewsRef}
              onScroll={onReviewsScroll}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="flex min-w-[82%] max-w-[82%] flex-shrink-0 snap-start flex-col rounded-2xl border border-border bg-white p-3.5"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-foreground">
                      {rev.from_user_name || "Пользователь"}
                    </span>
                    <span className="flex flex-shrink-0 items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-[13px] font-semibold text-foreground">{rev.rating}</span>
                    </span>
                  </div>
                  {rev.comment && (
                    <div className="line-clamp-4 text-[13px] leading-[18px] text-muted-foreground">
                      {rev.comment}
                    </div>
                  )}
                </div>
              ))}
              {reviewsLoadingMore && (
                <div className="flex min-w-[64px] flex-shrink-0 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>
            {canScrollReviews && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-[12px!important] rounded-2xl border border-border bg-white p-4 text-center text-[13px] text-muted-foreground">
            Отзывов пока нет
          </div>
        )}
        <SectionName title="Выход" />

        <div className="space-y-2.5 mt-[12px!important]">
          <ProfileRow icon={LogOut} label="Выйти" danger onClick={handleLogout} />
        </div>
      </div>

      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogSheetContent>
          <div className="mb-3 text-center text-[15px] font-bold text-foreground">Выберите город</div>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск города..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex max-h-[40vh] flex-col gap-2 overflow-y-auto">
            {cities
              .filter((c) => c.name.toLowerCase().includes(citySearch.trim().toLowerCase()))
              .map((c) => {
                const active = user.city_id === c.id
                return (
                  <DialogClose asChild key={c.id}>
                    <button
                      onClick={() => handleCityChange(c.id)}
                      className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-colors ${
                        active ? "bg-primary/10 text-primary" : "bg-muted text-foreground"
                      }`}
                    >
                      {c.name}
                      {active && <Check className="h-[18px] w-[18px] text-primary" />}
                    </button>
                  </DialogClose>
                )
              })}
            {cities.filter((c) => c.name.toLowerCase().includes(citySearch.trim().toLowerCase())).length === 0 && (
              <div className="py-4 text-center text-[13px] text-muted-foreground">Город не найден</div>
            )}
          </div>
        </DialogSheetContent>
      </Dialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogSheetContent>
          <div className="mb-3 text-center text-[15px] font-bold text-foreground">Выберите роль</div>
          <div className="flex flex-col gap-2.5">
            {([
              ["customer", "Работодатель", Briefcase],
              ["executor", "Рабочий", ArrowRightCircle],
            ] as [string, string, LucideIcon][]).map(([r, label, Icon]) => {
              const active = user.role === r
              return (
                <button
                  key={r}
                  onClick={() => changeRole(r)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-[15px] font-semibold transition-colors ${
                    active ? "bg-primary/10 text-primary" : "bg-muted text-foreground"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] text-primary" />
                  <span className="flex-1">{label}</span>
                  {active && <Check className="h-[18px] w-[18px] text-primary" />}
                </button>
              )
            })}
          </div>
        </DialogSheetContent>
      </Dialog>
    </div>
  )
}
