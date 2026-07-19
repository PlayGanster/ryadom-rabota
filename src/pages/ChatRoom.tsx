import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, SendHorizontal } from "lucide-react"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { getCache, setCache, hasCache } from "@/lib/cache"
import { Chat, Message } from "@/lib/types"
import { formatTime, formatDate, formatDateTime, mapsUrl, shortAddress } from "@/lib/format"
import { ChatRoomSkeleton } from "@/components/shared"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDelayedSkeleton } from "@/lib/useDelayedSkeleton"

export default function ChatRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const CHAT_KEY = `chat:${id}`
  const cachedChat = getCache<{ messages: Message[]; chatInfo: Chat | null }>(CHAT_KEY)
  const [messages, setMessages] = useState<Message[]>(cachedChat?.messages ?? [])
  const [loading, setLoading] = useState(!hasCache(CHAT_KEY))
  const showSkeleton = useDelayedSkeleton(loading)
  const [text, setText] = useState("")
  const [chatInfo, setChatInfo] = useState<Chat | null>(cachedChat?.chatInfo ?? null)
  const [sending, setSending] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    if (!hasCache(CHAT_KEY)) setLoading(true)
    try {
      const [chatRes, msgRes] = await Promise.all([
        api.get<Chat>(`/chats/${id}`),
        api.get<Message[]>(`/chats/${id}/messages`),
      ])
      setChatInfo(chatRes.data)
      setMessages(msgRes.data)
      setCache(CHAT_KEY, { messages: msgRes.data, chatInfo: chatRes.data })
    } catch {
      // ignore
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const interval = setInterval(() => {
      api
        .get<Message[]>(`/chats/${id}/messages`)
        .then((r) => setMessages(r.data))
        .catch(() => {})
    }, 3000)
    return () => clearInterval(interval)
  }, [id])

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const r = await api.post<Message>(`/chats/${id}/messages`, { text: text.trim() })
      setMessages((prev) => [...prev, r.data])
      setText("")
      inputRef.current?.focus()
    } catch {
      // ignore
    }
    setSending(false)
  }

  if (showSkeleton) return <ChatRoomSkeleton />

  return (
    <div className="flex h-full flex-col bg-[#f0f2f5]">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-border bg-white px-4 py-3">
        <button onClick={() => navigate(-1)} className="flex p-1">
          <ArrowLeft className="h-[22px] w-[22px] text-foreground" />
        </button>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
          {chatInfo?.other_user_name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{chatInfo?.other_user_name}</div>
          <div className="text-[11px] text-muted-foreground">{chatInfo?.order_title}</div>
        </div>
      </div>

      <div className="chat-messages flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        <style>{`.chat-messages::-webkit-scrollbar{display:none}.chat-messages{-ms-overflow-style:none;scrollbar-width:none}`}</style>
        {messages.length === 0 && (
          <div className="mt-10 text-center text-[13px] text-muted-foreground">Начните переписку</div>
        )}
        {messages.map((m) => {
          const isMe = m.sender_id === user?.id

          if (m.type === "order_card") {
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  onClick={() => m.order_id && navigate(`/order/${m.order_id}`)}
                  className="max-w-[80%] cursor-pointer overflow-hidden rounded-2xl border border-border bg-white shadow-md"
                >
                  <div className="flex items-center gap-2 bg-gradient-to-br from-primary to-[#e06600] px-3.5 py-2.5">
                    <span className="text-base">📋</span>
                    <span className="text-sm font-semibold text-white">Заказ</span>
                  </div>
                  <div className="p-3.5">
                    <div className="mb-2 text-sm font-semibold text-foreground">{m.order_title}</div>
                    {m.order_address && (
                      <div className="mb-1 flex items-center gap-1.5 text-[12px]">
                        📍<span className="text-muted-foreground">{shortAddress(m.order_city, m.order_address)}</span>
                      </div>
                    )}
                    {m.order_budget && (
                      <div className="mb-1 flex items-center gap-1.5 text-[12px]">
                        💰<span className="font-semibold text-primary">{m.order_budget} ₽</span>
                      </div>
                    )}
                    {m.order_datetime && (
                      <div className="flex items-center gap-1.5 text-[12px]">
                        📅<span className="text-muted-foreground">{formatDate(m.order_datetime)} в {formatTime(m.order_datetime)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-border px-3.5 py-2">
                    <span className="text-[11px] text-muted-foreground">{formatTime(m.created_at)}</span>
                    <span className="text-[11px] font-semibold text-primary">Подробнее →</span>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                  isMe ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm bg-white text-foreground"
                }`}
              >
                <div className="text-sm leading-5" style={{ wordBreak: "break-word" }}>
                  {m.text}
                </div>
                <div className={`mt-1 text-right text-[10px] ${isMe ? "text-white/70" : "text-muted-foreground"}`}>
                  {formatTime(m.created_at)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEnd} />
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 border-t border-border bg-white p-2.5">
        <Input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Сообщение..."
          className="rounded-full"
        />
        <Button
          size="icon"
          className="h-10 w-10 flex-shrink-0 rounded-full"
          onClick={send}
          disabled={!text.trim() || sending}
        >
          <SendHorizontal className="h-[18px] w-[18px]" />
        </Button>
      </div>
    </div>
  )
}
