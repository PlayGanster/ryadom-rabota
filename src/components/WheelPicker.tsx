import { useState, useRef, useEffect } from "react"
import { Dialog, DialogSheetContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const ITEM_H = 36
const VISIBLE = 5
const PAD = ((VISIBLE - 1) / 2) * ITEM_H

const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]

function Column({
  items,
  index,
  onChange,
}: {
  items: { label: string; value: number }[]
  index: number
  onChange: (i: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const targetRef = useRef(index)
  const indexRef = useRef(index)
  const onChangeRef = useRef(onChange)
  indexRef.current = index
  onChangeRef.current = onChange

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = index * ITEM_H
    targetRef.current = index
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const dir = e.deltaY > 0 ? 1 : -1
      const next = Math.max(0, Math.min(items.length - 1, targetRef.current + dir))
      targetRef.current = next
      el.scrollTo({ top: next * ITEM_H, behavior: "smooth" })
      if (next !== indexRef.current) onChangeRef.current(next)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [items.length])

  const handleScroll = () => {
    const el = ref.current
    if (!el) return
    const i = Math.round(el.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(items.length - 1, i))
    targetRef.current = clamped
    if (clamped !== index) onChange(clamped)
  }

  return (
    <div className="relative h-[180px] flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-1 top-1/2 z-10 h-[36px] -translate-y-1/2 rounded-lg bg-primary/10 ring-1 ring-primary/20" />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-proximity [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div style={{ height: PAD }} />
        {items.map((it, i) => (
          <div
            key={i}
            className={`flex h-[36px] snap-center items-center justify-center text-[17px] tabular-nums ${
              i === index ? "font-semibold text-primary" : "text-muted-foreground"
            }`}
          >
            {it.label}
          </div>
        ))}
        <div style={{ height: PAD }} />
      </div>
    </div>
  )
}

function todayParts() {
  const d = new Date()
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() }
}

export function DateWheelPicker({
  open,
  onOpenChange,
  value,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  value?: string
  onConfirm: (v: string) => void
}) {
  const days = Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: i + 1 }))
  const monthItems = MONTHS.map((m, i) => ({ label: m, value: i + 1 }))
  const now = todayParts()
  const years = Array.from({ length: 4 }, (_, i) => ({
    label: String(now.year - 1 + i),
    value: now.year - 1 + i,
  }))

  const parsed = value ? value.split("-").map(Number) : [now.day, now.month, now.year]
  const [d, setD] = useState(parsed[0])
  const [m, setM] = useState(parsed[1])
  const [y, setY] = useState(parsed[2])

  useEffect(() => {
    if (open) {
      const p = value ? value.split("-").map(Number) : [now.day, now.month, now.year]
      setD(p[0])
      setM(p[1])
      setY(p[2])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const confirm = () => {
    const mm = String(m).padStart(2, "0")
    const dd = String(d).padStart(2, "0")
    onConfirm(`${y}-${mm}-${dd}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSheetContent>
        <DialogTitle className="mb-2 text-center text-[15px] font-bold text-foreground">
          Выберите дату
        </DialogTitle>
        <div className="mb-3 flex divide-x divide-border overflow-hidden rounded-xl bg-muted">
          <Column items={days} index={d - 1} onChange={(i) => setD(days[i].value)} />
          <Column items={monthItems} index={m - 1} onChange={(i) => setM(monthItems[i].value)} />
          <Column items={years} index={y - years[0].value} onChange={(i) => setY(years[i].value)} />
        </div>
        <div className="flex gap-2">
          <DialogClose asChild>
            <Button variant="secondary" className="flex-1">
              Отмена
            </Button>
          </DialogClose>
          <Button className="flex-1" onClick={confirm}>
            Готово
          </Button>
        </div>
      </DialogSheetContent>
    </Dialog>
  )
}

export function TimeWheelPicker({
  open,
  onOpenChange,
  value,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  value?: string
  onConfirm: (v: string) => void
}) {
  const hours = Array.from({ length: 24 }, (_, i) => ({ label: String(i).padStart(2, "0"), value: i }))
  const minutes = Array.from({ length: 60 }, (_, i) => ({ label: String(i).padStart(2, "0"), value: i }))

  const parsed = value ? value.split(":").map(Number) : [9, 0]
  const [h, setH] = useState(parsed[0])
  const [mi, setMi] = useState(parsed[1])

  useEffect(() => {
    if (open) {
      const p = value ? value.split(":").map(Number) : [9, 0]
      setH(p[0])
      setMi(p[1])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const confirm = () => {
    onConfirm(`${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSheetContent>
        <DialogTitle className="mb-2 text-center text-[15px] font-bold text-foreground">
          Выберите время
        </DialogTitle>
        <div className="mb-3 flex divide-x divide-border overflow-hidden rounded-xl bg-muted">
          <Column items={hours} index={h} onChange={(i) => setH(hours[i].value)} />
          <div className="flex items-center justify-center text-[17px] font-semibold text-foreground">
            :
          </div>
          <Column items={minutes} index={mi} onChange={(i) => setMi(minutes[i].value)} />
        </div>
        <div className="flex gap-2">
          <DialogClose asChild>
            <Button variant="secondary" className="flex-1">
              Отмена
            </Button>
          </DialogClose>
          <Button className="flex-1" onClick={confirm}>
            Готово
          </Button>
        </div>
      </DialogSheetContent>
    </Dialog>
  )
}
