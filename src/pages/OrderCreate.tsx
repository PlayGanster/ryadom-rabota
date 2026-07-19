import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { PlusCircle, MapPin, CalendarDays, Clock, DollarSign, Users, Bolt, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DateWheelPicker, TimeWheelPicker } from "@/components/WheelPicker"
import { formatDate } from "@/lib/format"

export default function OrderCreate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: "",
    description: "",
    address: "",
    budget: "",
    hourlyRate: "",
    hours: "",
    workersNeeded: "1",
  })
  const [useHourly, setUseHourly] = useState(false)
  const [dateValue, setDateValue] = useState("")
  const [timeValue, setTimeValue] = useState("")
  const [showDate, setShowDate] = useState(false)
  const [showTime, setShowTime] = useState(false)
  const [loading, setLoading] = useState(false)

  const [suggestions, setSuggestions] = useState<any[]>([])
  const [suggestionsVisible, setSuggestionsVisible] = useState(false)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const cityName = user?.city_name || ""

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query || query.length < 3) {
        setSuggestions([])
        return
      }
      setSearching(true)
      try {
        const numAtEnd = query.match(/^(.+?)\s+(\d+)\s*$/)
        let url: string
        if (numAtEnd && cityName) {
          const streetPart = numAtEnd[1].trim()
          const houseNum = numAtEnd[2]
          const streetType = /^(ул\.?|улица|пер\.?|переулок|просп\.?|проспект|пр\.?|шоссе|ш\.?|наб\.?|набережная|бульвар|б-р|пл\.?|площадь)\s+/i
          const cleanStreet = streetPart.replace(streetType, "").trim()
          const streetPrefix = streetPart.match(streetType)?.[0]?.trim() || "ул."
          const q = `${streetPrefix} ${cleanStreet} ${houseNum}, ${cityName}, Россия`
          url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8&countrycodes=ru&accept-language=ru`
        } else {
          const q = cityName ? `${query}, ${cityName}, Россия` : `${query}, Россия`
          url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&countrycodes=ru&accept-language=ru`
        }
        const res = await fetch(url, { headers: { "User-Agent": "RyadomRabota/1.0" } })
        const data = await res.json()
        setSuggestions(data)
        setSuggestionsVisible(data.length > 0)
      } catch {
        setSuggestions([])
      }
      setSearching(false)
    },
    [cityName]
  )

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setForm((f) => ({ ...f, address: val }))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => fetchSuggestions(val), 400)
  }

  const formatShortAddress = (item: any): string => {
    const a = item.address || {}
    const parts: string[] = []
    const road = a.road || a.pedestrian || a.quarter || ""
    const house = a.house_number || ""
    if (road) {
      let street = road
      if (!street.match(/^(ул|улица|пер|переулок|просп|пр|шоссе|наб|бульвар|площадь)/i)) {
        street = `ул. ${road}`
      }
      parts.push(house ? `${street}, д. ${house}` : street)
    }
    const place = a.city || a.town || a.village || a.hamlet || ""
    if (place && !parts.some((p) => p.toLowerCase().includes(place.toLowerCase()))) {
      parts.push(place)
    }
    if (parts.length === 0) return item.display_name.split(",").slice(0, 2).join(",")
    return parts.join(", ")
  }

  const selectSuggestion = (item: any) => {
    setForm((f) => ({ ...f, address: formatShortAddress(item) }))
    setSuggestions([])
    setSuggestionsVisible(false)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setSuggestionsVisible(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (useHourly && form.hourlyRate && form.hours) {
      const budget = parseInt(form.hourlyRate) * parseInt(form.hours)
      setForm((f) => ({ ...f, budget: String(budget) }))
    }
  }, [form.hourlyRate, form.hours, useHourly])

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.address || !dateValue || !form.budget) {
      toast.error("Заполните все обязательные поля")
      return
    }
    setLoading(true)
    try {
      const dt = new Date(`${dateValue}T${timeValue || "00:00"}`)
      const data: any = {
        title: form.title,
        description: form.description,
        address: form.address,
        datetime: dt.toISOString(),
        budget: parseInt(form.budget),
        workers_needed: parseInt(form.workersNeeded) || 1,
      }
      if (useHourly && form.hourlyRate && form.hours) {
        data.hourly_rate = parseInt(form.hourlyRate)
        data.hours = parseInt(form.hours)
      }
      await api.post("/orders", data)
      toast.success("Заказ отправлен на модерацию!")
      navigate("/")
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Ошибка")
    }
    setLoading(false)
  }

  const labelCls = "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
  const inputCls = "w-full rounded-xl border border-border bg-card px-3 py-3 text-[15px] outline-none text-foreground"

  return (
    <div className="bg-[#f0f2f5]">
      <div className="p-4">
        <PageHeader icon={<PlusCircle className="h-6 w-6" />} title="Новый заказ" />

        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
          <div>
            <Label className={labelCls}><span>Заголовок *</span></Label>
            <Input
              className="mt-1.5"
              placeholder="Например: Грузчик на переезд"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <Label className={labelCls}>Описание *</Label>
            <Textarea
              className="mt-1.5 resize-none"
              placeholder="Подробное описание задачи"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="relative" ref={wrapRef}>
            <Label className={labelCls}>
              <MapPin className="h-3.5 w-3.5" />Адрес *
              {cityName && <span className="font-medium normal-case text-primary">({cityName})</span>}
            </Label>
            <Input
              className="mt-1.5"
              placeholder="Начните вводить адрес..."
              value={form.address}
              onChange={handleAddressChange}
              onFocus={() => suggestions.length > 0 && setSuggestionsVisible(true)}
            />
            {searching && <div className="absolute right-3 top-9 text-xs text-muted-foreground">Поиск...</div>}
            {suggestionsVisible && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-white shadow-lg">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-[13px] text-foreground hover:bg-muted"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    <span>{s.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className={labelCls}><CalendarDays className="h-3.5 w-3.5" />Дата *</Label>
            <button
              type="button"
              onClick={() => setShowDate(true)}
              className="mt-1.5 flex h-10 w-full items-center rounded-xl border border-border bg-card px-3 text-left text-[15px] text-foreground outline-none"
            >
              {dateValue ? formatDate(dateValue) : "Выбрать дату"}
            </button>
          </div>

          <div>
            <Label className={labelCls}><Clock className="h-3.5 w-3.5" />Время начала</Label>
            <button
              type="button"
              onClick={() => setShowTime(true)}
              className="mt-1.5 flex h-10 w-full items-center rounded-xl border border-border bg-card px-3 text-left text-[15px] text-foreground outline-none"
            >
              {timeValue || "Выбрать время"}
            </button>
          </div>

          <div>
            <Label className={labelCls}><DollarSign className="h-3.5 w-3.5" />Бюджет (₽) *</Label>
            <Input
              type="number"
              className="mt-1.5"
              placeholder="Сумма в рублях"
              value={form.budget}
              disabled={useHourly}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
            />
            <div className="mt-1 text-[11px] text-muted-foreground">Сумма на одного человека</div>
          </div>

          <div>
            <Label className={labelCls}><Users className="h-3.5 w-3.5" />Кол-во рабочих</Label>
            <Input
              type="number"
              min="1"
              className="mt-1.5"
              placeholder="1"
              value={form.workersNeeded}
              onChange={(e) => setForm((f) => ({ ...f, workersNeeded: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className={`${labelCls} mb-0`}><Bolt className="h-3.5 w-3.5" />Почасовая оплата</Label>
            <button
              type="button"
              onClick={() => setUseHourly(!useHourly)}
              className={`relative h-[26px] w-11 rounded-full transition-colors ${useHourly ? "bg-primary" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white shadow transition-all ${
                  useHourly ? "left-[20px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {useHourly && (
            <>
              <div>
                <Label className={labelCls}>Ставка (₽/час)</Label>
                <Input
                  type="number"
                  className="mt-1.5"
                  placeholder="500"
                  value={form.hourlyRate}
                  onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
                />
              </div>
              <div>
                <Label className={labelCls}>Часы</Label>
                <Input
                  type="number"
                  className="mt-1.5"
                  placeholder="4"
                  value={form.hours}
                  onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
                />
              </div>
            </>
          )}
        </div>

        <DateWheelPicker
          open={showDate}
          onOpenChange={setShowDate}
          value={dateValue}
          onConfirm={setDateValue}
        />
        <TimeWheelPicker
          open={showTime}
          onOpenChange={setShowTime}
          value={timeValue}
          onConfirm={setTimeValue}
        />

        <Button className="mt-4 w-full" onClick={handleSubmit} disabled={loading}>
          <PlusCircle className="h-5 w-5" />
          {loading ? "Отправка..." : "Опубликовать"}
        </Button>
      </div>
    </div>
  )
}
