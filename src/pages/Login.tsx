import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth"

export default function Login() {
  const { loginWithInitData } = useAuth()
  const [initData, setInitData] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError(null)
    setLoading(true)
    try {
      await loginWithInitData(initData.trim())
    } catch {
      setError("Не удалось войти. Проверьте initData.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#f0f2f5] p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вход (dev-режим)</CardTitle>
          <CardDescription>
            Вставьте initData из Telegram Mini App или используйте тестовый.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="query_id=...&user=...&hash=..."
            value={initData}
            onChange={(e) => setInitData(e.target.value)}
            rows={5}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={submit} disabled={loading || !initData.trim()}>
            {loading ? "Вход..." : "Войти"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
