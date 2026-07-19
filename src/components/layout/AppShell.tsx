import { ReactNode, useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Zap, MessageCircle, PlusCircle, ClipboardList, User } from "lucide-react"
import { useAuth } from "@/lib/auth"
import api from "@/lib/api"
import { TmaHeader, TmaFooter } from "@/components/TelegramChrome"

interface TabItem {
  key: string
  title: string
  icon: ReactNode
}

function BottomNav({ items, activeKey, onNavigate, unread, devMode }: {
  items: TabItem[]
  activeKey: string
  onNavigate: (key: string) => void
  unread: number
  devMode?: boolean
}) {
  return (
    <nav
      className={`h-[60px] fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-background/95 px-2 py-1.5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 ${
        devMode ? "bottom-[34px]" : "bottom-3"
      }`}
      style={{ width: "calc(100% - 32px)", maxWidth: 460 }}
    >
      {items.map((t) => {
        const active = activeKey === t.key || (t.key === "/" && activeKey === "/")
        const showBadge = t.key === "/chats" && unread > 0
        return (
          <button
            key={t.key}
            onClick={() => onNavigate(t.key)}
            className={`flex flex-1 flex-col items-center justify-center gap-0 rounded-full py-1.5 text-[10px] font-medium transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <span
              className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                active ? "bg-primary/10" : ""
              }`}
            >
              {t.icon}
              {showBadge && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {unread}
                </span>
              )}
            </span>
            {t.title}
          </button>
        )
      })}
    </nav>
  )
}

function AppHeader() {
  return (
    <header className="flex h-12 flex-shrink-0 items-center border-b border-border bg-background px-4">
      <img src="/logo-new.png" alt="РядомРабота" className="h-7" />
    </header>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, devMode } = useAuth()
  const [unread, setUnread] = useState(0)

  const isCustomer = user?.role === "customer"
  const tabs: TabItem[] = isCustomer
    ? [
        { key: "/chats", title: "Чаты", icon: <MessageCircle className="h-5 w-5" /> },
        { key: "/create", title: "Создать", icon: <PlusCircle className="h-5 w-5" /> },
        { key: "/my", title: "Мои", icon: <ClipboardList className="h-5 w-5" /> },
        { key: "/profile", title: "Профиль", icon: <User className="h-5 w-5" /> },
      ]
    : [
        { key: "/", title: "Лента", icon: <Zap className="h-5 w-5" /> },
        { key: "/chats", title: "Чаты", icon: <MessageCircle className="h-5 w-5" /> },
        { key: "/my", title: "Мои", icon: <ClipboardList className="h-5 w-5" /> },
        { key: "/profile", title: "Профиль", icon: <User className="h-5 w-5" /> },
      ]

  useEffect(() => {
    if (!user) return
    let active = true
    const load = async () => {
      try {
        const r = await api.get("/chats")
        if (!active) return
        const total = (r.data as any[]).reduce((s, c) => s + (c.unread_count || 0), 0)
        setUnread(total)
      } catch {
        // ignore
      }
    }
    load()
    const id = setInterval(load, 15000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [user])

  const activeKey =
    location.pathname === "/" ? "/" : "/" + (location.pathname.split("/")[1] || "")

  const hideNav = location.pathname.startsWith("/chat/")

  const mainPb = devMode
    ? hideNav
      ? "pb-7"
      : "pb-[100px]"
    : hideNav
      ? ""
      : "pb-[85px]"

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f0f2f5]">
      {devMode ? <TmaHeader onBack={() => navigate(-1)} /> : <AppHeader />}
      <main className={`flex-1 overflow-y-auto ${mainPb}`}>{children}</main>
      {!hideNav && (
        <BottomNav
          items={tabs}
          activeKey={activeKey}
          unread={unread}
          devMode={devMode}
          onNavigate={(k) => navigate(k)}
        />
      )}
      {devMode && <TmaFooter />}
    </div>
  )
}
