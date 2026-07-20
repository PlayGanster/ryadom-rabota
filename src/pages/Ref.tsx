import { useState, useEffect } from "react"
import { Gift, Share2, Copy, Rocket, Trophy, Users } from "lucide-react"
import { toast } from "sonner"
import { getReferralInfo } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { openLink, hapticNotify } from "@/lib/telegram"
import { PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"

const LEVEL_META: Record<number, { label: string; days: number; color: string }> = {
  1: { label: "1 уровень", days: 1, color: "#f59e0b" },
  2: { label: "2 уровень", days: 3, color: "#3b82f6" },
  3: { label: "3 уровень", days: 7, color: "#22c55e" },
}

export default function Ref() {
  const { user } = useAuth()
  const [info, setInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      const data = await getReferralInfo()
      setInfo(data)
    } catch {
      toast.error("Не удалось загрузить реферальную информацию")
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-[#f0f2f5]">
        <div className="p-4">
          <PageHeader icon={<Gift className="h-6 w-6" />} title="Рефералы" />
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-2 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  const count = info?.referrals_count || 0
  const progress = info?.progress || { next_threshold: 10, remaining: 10, level: 1 }
  const inv = info?.inventory || { 1: 0, 2: 0, 3: 0 }
  const thresholds = info?.thresholds || []
  const refLink = `https://t.me/ryadomrabota_bot?start=ref_${user?.id}`

  const pct = progress.next_threshold
    ? Math.min(100, Math.round(((count / progress.next_threshold) * 100) || 0))
    : 100

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(refLink)
      setCopied(true)
      toast.success("Ссылка скопирована")
      hapticNotify("success")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Не удалось скопировать")
    }
  }

  const share = () => {
    openLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent("РядомРабота — найди работу или исполнителя рядом с домом!")}`)
  }

  return (
    <div className="bg-[#f0f2f5]">
      <div className="p-4">
        <PageHeader icon={<Gift className="h-6 w-6" />} title="Реферальная программа" />

        <div className="flex flex-col gap-3">
          {/* Счётчик + прогресс */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-[15px] font-bold text-foreground">Приглашено друзей</span>
              <span className="ml-auto text-2xl font-bold text-primary">{count}</span>
            </div>
            {progress.next_threshold ? (
              <>
                <div className="mb-1 flex justify-between text-[12px] text-muted-foreground">
                  <span>Прогресс до награды</span>
                  <span>
                    {count}/{progress.next_threshold}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Осталось {progress.remaining} приглашений до буста {LEVEL_META[progress.level as number]?.label}
                </p>
              </>
            ) : (
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                <Trophy className="h-4 w-4" /> Все награды получены! Приглашайте дальше.
              </p>
            )}
          </div>

          {/* Инвентарь бустов */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <span className="text-[15px] font-bold text-foreground">Ваши бусты</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((lvl) => {
                const meta = LEVEL_META[lvl]
                const n = inv[lvl as 1 | 2 | 3] || 0
                return (
                  <div
                    key={lvl}
                    className="rounded-xl border border-border p-3 text-center"
                    style={{ background: n > 0 ? meta.color + "11" : undefined }}
                  >
                    <div className="text-lg font-bold" style={{ color: meta.color }}>
                      {n}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{meta.label}</div>
                    <div className="text-[10px] text-muted-foreground">{meta.days} дн.</div>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground">
              Бусты тратятся вручную: заказчик — на свои заказы (кнопка «Продвинуть» в «Мои заказы»),
              исполнитель — на свои отклики (в «Мои отклики»).
            </p>
          </div>

          {/* Награды */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 text-[15px] font-bold text-foreground">🎁 Награды за приглашения</div>
            <div className="flex flex-col gap-2">
              {thresholds.map((t: any) => (
                <div
                  key={t.threshold}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] ${
                    count >= t.threshold ? "bg-primary/10 text-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span>{t.threshold} друзей</span>
                  <span className="font-semibold">{t.reward}</span>
                  {count >= t.threshold && <span className="text-primary">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Ссылка + поделиться */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-2 text-[14px] font-semibold text-foreground">Ваша реферальная ссылка</div>
            <div className="mb-3 break-all rounded-xl bg-muted p-3 text-[12px] text-muted-foreground">{refLink}</div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={share}>
                <Share2 className="h-4 w-4" /> Поделиться
              </Button>
              <Button variant="secondary" onClick={copyLink}>
                <Copy className="h-4 w-4" /> {copied ? "Скопировано" : "Копировать"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
