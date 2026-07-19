import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./lib/auth"
import AppShell from "./components/layout/AppShell"
import { Toaster } from "./components/ui/sonner"
import { TmaHeader, TmaFooter } from "./components/TelegramChrome"
import Feed from "./pages/Feed"
import OrderCreate from "./pages/OrderCreate"
import OrderDetail from "./pages/OrderDetail"
import MyOrders from "./pages/MyOrders"
import MyResponses from "./pages/MyResponses"
import Profile from "./pages/Profile"
import ChatList from "./pages/ChatList"
import ChatRoom from "./pages/ChatRoom"

function Splash() {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-[#f0f2f5]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  const isCustomer = user!.role === "customer"
  return (
    <AppShell>
      <Routes>
        <Route
          path="/"
          element={isCustomer ? <Navigate to="/create" replace /> : <Feed />}
        />
        <Route path="/create" element={<OrderCreate />} />
        <Route path="/chats" element={<ChatList />} />
        <Route path="/chat/:id" element={<ChatRoom />} />
        <Route path="/my" element={isCustomer ? <MyOrders /> : <MyResponses />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/order/:id" element={<OrderDetail />} />
        <Route path="*" element={<Navigate to={isCustomer ? "/create" : "/"} replace />} />
      </Routes>
    </AppShell>
  )
}

function Root() {
  const { user, loading, debug } = useAuth()
  if (loading) return <Splash />
  if (!user) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-[#f0f2f5] px-6 text-center">
        <TmaHeader />
        <p className="text-sm text-muted-foreground">
          Откройте приложение через Telegram-бот, чтобы войти.
        </p>
        {debug ? <p className="text-xs text-red-500 break-all">{debug}</p> : null}
      </div>
    )
  }
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  )
}
