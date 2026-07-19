import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { MessageCircle, Inbox } from "lucide-react"
import api from "@/lib/api"
import { getCache, setCache, hasCache } from "@/lib/cache"
import { Chat } from "@/lib/types"
import { PageHeader, EmptyState, ChatItemSkeleton } from "@/components/shared"
import { useDelayedSkeleton } from "@/lib/useDelayedSkeleton"

function formatTime(dt?: string | null): string {
  if (!dt) return ""
  const d = new Date(dt)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
  }
  if (diff < 172800000) return "Вчера"
  return d.toLocaleDateString("ru", { day: "numeric", month: "short" })
}

export default function ChatList() {
  const navigate = useNavigate()
  const CHATS_KEY = "chats"
  const [chats, setChats] = useState<Chat[]>(getCache<Chat[]>(CHATS_KEY) ?? [])
  const [loading, setLoading] = useState(!hasCache(CHATS_KEY))
  const showSkeleton = useDelayedSkeleton(loading)

  useEffect(() => {
    api
      .get<Chat[]>("/chats")
      .then((r) => {
        setChats(r.data)
        setCache(CHATS_KEY, r.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (showSkeleton)
    return (
      <div className="bg-[#f0f2f5]">
        <div className="p-4">
          <PageHeader icon={<MessageCircle className="h-6 w-6" />} title="Чаты" />
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <ChatItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )

  return (
    <div className="bg-[#f0f2f5]">
      <div className="p-4">
        <PageHeader icon={<MessageCircle className="h-6 w-6" />} title="Чаты" />

        {chats.length === 0 && !loading ? (
          <EmptyState
            icon={<Inbox className="h-12 w-12" />}
            title="Нет чатов"
            subtitle="Начните переписку из карточки заказа"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {chats.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/chat/${c.id}`)}
                className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition-transform active:scale-[0.99]"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                  {c.other_user_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[15px] font-semibold text-foreground">{c.other_user_name}</span>
                    <span className="flex-shrink-0 text-[11px] text-muted-foreground">{formatTime(c.last_message_at)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span
                      className={`min-w-0 flex-1 truncate text-[13px] ${
                        c.unread_count > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {c.last_message || "Нет сообщений"}
                    </span>
                    {c.unread_count > 0 && (
                      <div className="flex h-[22px] min-w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                        {c.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
