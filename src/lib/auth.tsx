import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import api, { TOKEN_KEY } from "./api"
import { User } from "./types"
import { getInitData, isTelegram } from "./telegram"

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (u: User | null) => void
  logout: () => void
  loginWithInitData: (initData: string) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const finish = (u: User) => {
    setUser(u)
    setLoading(false)
  }

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const bootstrap = async () => {
      if (token) {
        try {
          const r = await api.get("/users/me")
          finish(r.data)
          return
        } catch {
          localStorage.removeItem(TOKEN_KEY)
        }
      }
      if (isTelegram()) {
        try {
          const r = await api.post("/auth/telegram-init", { init_data: getInitData() })
          localStorage.setItem(TOKEN_KEY, r.data.token)
          const me = await api.get("/users/me")
          finish(me.data)
          return
        } catch {
          // авторизация через Telegram не прошла
        }
      }
      setLoading(false)
    }
    bootstrap()
  }, [])

  const loginWithInitData = async (initData: string) => {
    const r = await api.post("/auth/telegram-init", { init_data: initData })
    localStorage.setItem(TOKEN_KEY, r.data.token)
    const me = await api.get("/users/me")
    setUser(me.data)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, loginWithInitData }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
