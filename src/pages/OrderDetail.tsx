import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  User as UserIcon,
  MessageCircle,
  CheckCircle,
  X,
  Star,
  ThumbsUp,
  Users,
  ArrowRightCircle,
  ChevronRight,
  ChevronDown,
  Info,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { getCache, setCache, hasCache } from "@/lib/cache"
import { Order, OrderResponse, Review, User } from "@/lib/types"
import {
  statusMap,
  responseStatusMap,
  formatWhen,
  mapsUrl,
  shortAddress,
  rating,
} from "@/lib/format"
import { OrderDetailSkeleton } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogSheetContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { useDelayedSkeleton } from "@/lib/useDelayedSkeleton"

function ProfileDialog({
  open,
  onOpenChange,
  profile,
  reviews,
  onWrite,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  profile: User | null
  reviews: Review[]
  onWrite: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSheetContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Профиль</DialogTitle>
        </DialogHeader>
        {profile && (
          <>
            <div className="text-center">
              <div
                className="mx-auto mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ background: profile.role === "executor" ? "#22c55e" : "#f08804" }}
              >
                {profile.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="text-lg font-bold text-foreground">{profile.name}</div>
              <div className="mt-1 text-[13px] text-muted-foreground">
                {profile.role === "customer" ? "Работодатель" : profile.role === "executor" ? "Рабочий" : profile.role}
              </div>
            </div>

            <div className="rounded-xl bg-muted px-4 py-1">
              <div className="flex items-center justify-between border-b border-border py-3">
                <span className="text-[13px] text-muted-foreground">Рейтинг</span>
                <span className="flex items-center gap-1 text-[13px] font-semibold text-foreground">
                  <Star className="h-3.5 w-3.5 text-amber-500" fill="#f59e0b" />
                  {rating(profile.rating)}
                </span>
              </div>
              {profile.city_name && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-[13px] text-muted-foreground">Город</span>
                  <span className="flex items-center gap-1 text-[13px] font-semibold text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-gray-500" />
                    {profile.city_name}
                  </span>
                </div>
              )}
            </div>

            {reviews.length > 0 && (
              <div className="mb-5">
                <div className="mb-3 flex items-center gap-1.5 text-[14px] font-bold text-foreground">
                  <ThumbsUp className="h-4 w-4 text-primary" />
                  Отзывы ({reviews.length})
                </div>
                {reviews.slice(0, 5).map((rev, i) => (
                  <div key={rev.id} className={`py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-foreground">{rev.from_user_name || "Пользователь"}</span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" fill="#f59e0b" />
                        <span className="text-[13px] font-semibold text-foreground">{rev.rating}</span>
                      </span>
                    </div>
                    {rev.comment && <div className="text-[13px] leading-[18px] text-muted-foreground">{rev.comment}</div>}
                  </div>
                ))}
              </div>
            )}

            <Button onClick={onWrite} className="w-full">
              <MessageCircle className="h-[18px] w-[18px]" />
              Написать
            </Button>
          </>
        )}
      </DialogSheetContent>
    </Dialog>
  )
}

function ReviewDialog({
  open,
  onOpenChange,
  target,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  target: { id: number; name?: string | null } | null
  onClose: () => void
  onSubmit: (rating: number, comment: string) => void
  loading: boolean
}) {
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState("")

  useEffect(() => {
    if (open) {
      setStars(5)
      setComment("")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Оставить отзыв</DialogTitle>
        </DialogHeader>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70" onClick={onClose}>
          <X className="h-5 w-5" />
        </DialogClose>
        {target && (
          <>
            <div className="text-center">
              <div className="mx-auto mb-2.5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                {target.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="text-base font-semibold text-foreground">{target.name}</div>
            </div>

            <div className="mb-5 text-center">
              <div className="mb-2 text-[13px] text-muted-foreground">Оценка</div>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setStars(s)} className="p-1">
                    <Star
                      className="h-8 w-8"
                      color={s <= stars ? "#f59e0b" : "#ddd"}
                      fill={s <= stars ? "#f59e0b" : "none"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-1.5 text-[13px] text-muted-foreground">Комментарий (необязательно)</div>
              <Textarea
                rows={3}
                placeholder="Напишите отзыв..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={loading}
              onClick={() => onSubmit(stars, comment)}
            >
              <ThumbsUp className="h-[18px] w-[18px]" />
              {loading ? "Отправка..." : "Отправить отзыв"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const ORDER_KEY = `order:${id}`
  const [order, setOrder] = useState<Order | null>(getCache<Order | null>(ORDER_KEY) ?? null)
  const [responses, setResponses] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(!hasCache(ORDER_KEY))
  const showSkeleton = useDelayedSkeleton(loading)
  const [showCustomer, setShowCustomer] = useState(false)
  const [customerProfile, setCustomerProfile] = useState<User | null>(null)
  const [customerReviews, setCustomerReviews] = useState<Review[]>([])
  const [showExecutorProfile, setShowExecutorProfile] = useState(false)
  const [executorProfile, setExecutorProfile] = useState<User | null>(null)
  const [executorReviews, setExecutorReviews] = useState<Review[]>([])
  const [showReviewPopup, setShowReviewPopup] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<{ id: number; name?: string | null } | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [orderReviews, setOrderReviews] = useState<Review[]>([])
  const [showReject, setShowReject] = useState(false)

  const load = async () => {
    if (!hasCache(ORDER_KEY)) setLoading(true)
    try {
      const r = await api.get<Order>(`/orders/${id}`)
      setOrder(r.data)
      setCache(ORDER_KEY, r.data)
      if (user?.role === "customer" || user?.role === "admin") {
        try {
          const res = await api.get<OrderResponse[]>(`/orders/${id}/responses`)
          setResponses(res.data)
        } catch {
          // ignore
        }
      }
      try {
        const orr = await api.get<Review[]>(`/reviews/order/${id}`)
        setOrderReviews(orr.data)
      } catch {
        setOrderReviews([])
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const openCustomer = async () => {
    if (!order) return
    try {
      const r = await api.get<User>(`/users/${order.customer_id}`)
      setCustomerProfile(r.data)
      setShowCustomer(true)
      try {
        const rev = await api.get<Review[]>(`/reviews/${order.customer_id}`)
        setCustomerReviews(rev.data)
      } catch {
        setCustomerReviews([])
      }
    } catch {
      // ignore
    }
  }

  const openExecutor = async (executorId: number) => {
    try {
      const r = await api.get<User>(`/users/${executorId}`)
      setExecutorProfile(r.data)
      setShowExecutorProfile(true)
      try {
        const rev = await api.get<Review[]>(`/reviews/${executorId}`)
        setExecutorReviews(rev.data)
      } catch {
        setExecutorReviews([])
      }
    } catch {
      // ignore
    }
  }

  const submitReview = async (stars: number, comment: string) => {
    if (!reviewTarget) return
    setReviewLoading(true)
    try {
      await api.post("/reviews", {
        order_id: Number(id),
        to_user_id: reviewTarget.id,
        rating: stars,
        comment: comment || null,
      })
      setShowReviewPopup(false)
      toast.success("Отзыв отправлен!")
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Ошибка")
    }
    setReviewLoading(false)
  }

  const handleRespond = async () => {
    try {
      await api.post(`/orders/${id}/respond`, {})
      toast.success("Отклик отправлен!")
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Ошибка")
    }
  }

  const handleAccept = async (respId: number) => {
    try {
      await api.patch(`/responses/${respId}`, { status: "accepted" })
      toast.success("Исполнитель выбран!")
      load()
    } catch {
      toast.error("Ошибка")
    }
  }

  const handleComplete = async () => {
    try {
      await api.patch(`/orders/${id}`, { status: "done" })
      toast.success("Заказ завершён!")
      load()
    } catch {
      toast.error("Ошибка")
    }
  }

  const handleCancel = async () => {
    try {
      await api.patch(`/orders/${id}`, { status: "cancelled" })
      toast.success("Заказ отменён")
      load()
    } catch {
      toast.error("Ошибка")
    }
  }

  const openChat = async (toUserId: number) => {
    try {
      const r = await api.post<{ id: number }>("/chats", { order_id: Number(id), to_user_id: toUserId })
      const chatId = r.data.id
      await api.post(`/chats/${chatId}/messages`, {
        text: `📋 Заказ: ${order!.title}`,
        type: "order_card",
        order_id: Number(id),
      })
      navigate(`/chat/${chatId}`)
    } catch {
      toast.error("Ошибка создания чата")
    }
  }

  if (showSkeleton) return <OrderDetailSkeleton />
  if (loading && !order) return null
  if (!order) {
    return (
      <div className="flex min-h-[calc(100dvh_-_12rem)] items-center justify-center bg-[#f0f2f5] text-center text-muted-foreground">
        <div>
          <div className="mb-3 text-4xl">⚠️</div>
          <div>Заказ не найден</div>
        </div>
      </div>
    )
  }

  const isOwner = order.customer_id === user?.id
  const st = statusMap[order.status] || { text: order.status, color: "#9ca3af", bg: "#f9fafb" }
  const acceptedExecutor = responses.find((r) => r.status === "accepted")
  const free = Math.max(0, (order.workers_needed || 1) - (order.accepted_count || 0))

  return (
    <div className="bg-[#f0f2f5]">
      <div className="p-4">
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="m-0 text-xl font-bold text-foreground">Заказ #{order.id}</h1>
        </div>

        <div className="mb-3.5 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold leading-tight text-foreground">{order.title}</h2>
            <span
              className="flex-shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-[12px] font-semibold"
              style={{ color: st.color, background: (st.bg || st.color) + "22" }}
            >
              {st.text}
            </span>
          </div>

          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{order.budget} ₽</span>
            {order.hourly_rate ? (
              <span className="rounded-lg bg-muted px-2.5 py-1 text-[13px] text-muted-foreground">
                {order.hourly_rate}₽/ч · {order.hours}ч
              </span>
            ) : (
              <span className="rounded-lg bg-muted px-2.5 py-1 text-[13px] text-muted-foreground">
                за смену
              </span>
            )}
          </div>

          {order.description && (
            <p className="mb-4 text-[15px] leading-[22px] text-foreground">{order.description}</p>
          )}

          <div className="mb-4 space-y-2 rounded-xl bg-muted p-3.5">
            <div className="flex items-center gap-2 text-[14px] font-medium text-foreground">
              <CalendarDays className="h-[18px] w-[18px] flex-shrink-0 text-primary" />
              {formatWhen(order.datetime)}
            </div>
            <div className="flex items-center gap-2 text-[14px] font-medium text-foreground">
              <MapPin className="h-[18px] w-[18px] flex-shrink-0 text-primary" />
              {shortAddress(order.city_name, order.address)}
            </div>
            <button
              onClick={() => window.open(mapsUrl(order.city_name, order.address), "_blank")}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-[13px] font-semibold text-primary"
            >
              <MapPin className="h-4 w-4" />
              Показать на карте
            </button>
          </div>

          {(order.workers_needed || 1) > 1 && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-muted p-3">
              <Users className="h-[18px] w-[18px] flex-shrink-0 text-primary" />
              <span className="text-[14px] font-semibold text-foreground">Нужно людей: {order.workers_needed}</span>
              <span
                className={`ml-auto text-[13px] font-semibold ${free > 0 ? "text-green-600" : "text-destructive"}`}
              >
                Свободно мест: {free}
              </span>
            </div>
          )}

          <button
            onClick={openCustomer}
            className="mt-3.5 flex w-full cursor-pointer items-center gap-3 rounded-xl bg-muted p-3 text-left transition-colors active:bg-muted/70"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-foreground">{order.customer_name}</div>
              <div className="text-[12px] text-muted-foreground">Кто заказал · нажмите, чтобы открыть профиль</div>
            </div>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          </button>
        </div>

        {user?.role === "executor" && order.status === "open" && (
          order.my_response_status === "accepted" ? (
            <div className="mb-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-[15px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              Вы уже взяты на этот заказ
            </div>
          ) : order.my_response_status === "pending" ? (
            <div className="mb-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-muted px-4 py-3 text-[15px] font-semibold text-muted-foreground">
              <Clock className="h-5 w-5" />
              Ваш отклик на рассмотрении
            </div>
          ) : order.my_response_status === "rejected" ? (
            <div className="mb-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[15px] font-semibold text-red-600">
              <XCircle className="h-5 w-5" />
              Ваш отклик отклонён
            </div>
          ) : (
            <Button className="mb-3.5 w-full" onClick={handleRespond}>
              <ArrowRightCircle className="h-5 w-5" />
              Откликнуться
            </Button>
          )
        )}

        {isOwner && responses.length > 0 && (
          <div className="mb-3.5 rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
              <MessageCircle className="h-[18px] w-[18px] text-primary" />
              Отклики ({responses.length})
            </div>
            {responses.map((r, i) => {
              const rst = responseStatusMap[r.status] || responseStatusMap.pending
              return (
                <div key={r.id} className={i > 0 ? "border-t border-border pt-3.5" : ""}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex cursor-pointer items-center gap-2.5" onClick={() => openExecutor(r.executor_id)}>
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{ background: r.status === "accepted" ? "#22c55e" : "#e5e7eb" }}
                      >
                        <UserIcon className={`h-[18px] w-[18px] ${r.status === "accepted" ? "text-white" : "text-gray-500"}`} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{r.executor_name}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                          <Star className="h-3 w-3 text-amber-500" fill="#f59e0b" />
                          {rating(r.executor_rating)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === "pending" && isOwner && order.status === "open" && (
                        <Button size="sm" onClick={() => handleAccept(r.id)}>
                          Выбрать
                        </Button>
                      )}
                      <span
                        className="rounded-md px-2 py-1 text-[11px] font-semibold"
                        style={{ color: rst.color, background: rst.bg }}
                      >
                        {rst.text}
                      </span>
                    </div>
                  </div>
                  {r.comment && (
                    <div className="ml-[46px] text-[13px] leading-[18px] text-muted-foreground">{r.comment}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {isOwner && order.status === "in_progress" && acceptedExecutor && (
          <div className="mb-3.5 rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3.5 flex items-center gap-2 text-base font-bold text-foreground">
              <CheckCircle className="h-[18px] w-[18px] text-green-500" />
              Исполнитель
            </div>
            <div className="mb-3 flex cursor-pointer items-center gap-2.5" onClick={() => openExecutor(acceptedExecutor.executor_id)}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-[15px] font-semibold text-foreground">{acceptedExecutor.executor_name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                  <Star className="h-3 w-3 text-amber-500" fill="#f59e0b" />
                  {rating(acceptedExecutor.executor_rating)}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-orange-200 bg-orange-50 text-primary"
              onClick={() => openChat(acceptedExecutor.executor_id)}
            >
              <MessageCircle className="h-4 w-4" />
              Написать
            </Button>
          </div>
        )}

        {user?.role === "executor" && order.status === "in_progress" && (
          <div className="mb-3.5 rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3.5 flex items-center gap-2 text-base font-bold text-foreground">
              <CheckCircle className="h-[18px] w-[18px] text-green-500" />
              Заказчик
            </div>
            <div className="mb-3 flex cursor-pointer items-center gap-2.5" onClick={openCustomer}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-[15px] font-semibold text-foreground">{order.customer_name}</div>
                <div className="text-[12px] text-muted-foreground">Заказчик</div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-orange-200 bg-orange-50 text-primary"
              onClick={() => openChat(order.customer_id)}
            >
              <MessageCircle className="h-4 w-4" />
              Написать
            </Button>
          </div>
        )}

        {isOwner && order.status === "open" && (
          <Button
            variant="destructive"
            className="mb-3.5 w-full bg-red-50 text-destructive hover:bg-red-100"
            onClick={handleCancel}
          >
            <X className="h-[18px] w-[18px]" />
            Отменить заказ
          </Button>
        )}
        {isOwner && order.status === "in_progress" && (
          <Button className="mb-3.5 w-full bg-green-500 hover:bg-green-600" onClick={handleComplete}>
            <CheckCircle className="h-[18px] w-[18px]" />
            Завершить заказ
          </Button>
        )}
        {isOwner && order.status === "rejected" && (
          <Button
            variant="outline"
            className="mb-3.5 w-full border-orange-200 bg-orange-50 text-primary"
            onClick={() => setShowReject(true)}
          >
            <Info className="h-[18px] w-[18px]" />
            Узнать причину
          </Button>
        )}

        {order.status === "done" &&
          (() => {
            const target = isOwner
              ? acceptedExecutor
                ? { id: acceptedExecutor.executor_id, name: acceptedExecutor.executor_name }
                : null
              : { id: order.customer_id, name: order.customer_name }
            if (!target) return null
            const alreadyReviewed = orderReviews.some(
              (r) => r.from_user_id === user?.id && r.to_user_id === target!.id
            )
            if (alreadyReviewed) return null
            return (
              <Button
                variant="outline"
                className="mb-3.5 w-full border-orange-200 bg-orange-50 text-primary"
                onClick={() => {
                  setReviewTarget(target)
                  setShowReviewPopup(true)
                }}
              >
                <ThumbsUp className="h-[18px] w-[18px]" />
                Оставить отзыв
              </Button>
            )
          })()}
      </div>

      <ProfileDialog
        open={showCustomer}
        onOpenChange={setShowCustomer}
        profile={customerProfile}
        reviews={customerReviews}
        onWrite={() => {
          setShowCustomer(false)
          if (customerProfile) openChat(customerProfile.id)
        }}
      />
      <ProfileDialog
        open={showExecutorProfile}
        onOpenChange={setShowExecutorProfile}
        profile={executorProfile}
        reviews={executorReviews}
        onWrite={() => {
          setShowExecutorProfile(false)
          if (executorProfile) openChat(executorProfile.id)
        }}
      />
      <ReviewDialog
        open={showReviewPopup}
        onOpenChange={setShowReviewPopup}
        target={reviewTarget}
        onClose={() => setShowReviewPopup(false)}
        onSubmit={submitReview}
        loading={reviewLoading}
      />
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogSheetContent>
          <DialogHeader>
            <DialogTitle>Причина отклонения</DialogTitle>
          </DialogHeader>
          <div className="rounded-xl bg-muted p-4 mt-3 text-[14px] leading-[20px] text-foreground">
            {order.moderation_comment || "Причина не указана"}
          </div>
        </DialogSheetContent>
      </Dialog>
    </div>
  )
}
