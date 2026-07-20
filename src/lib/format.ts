export const statusMap: Record<string, { text: string; color: string; bg?: string }> = {
  pending_moderation: { text: "На модерации", color: "#f59e0b", bg: "#fffbeb" },
  open: { text: "Открыт", color: "#22c55e", bg: "#f0fdf4" },
  in_progress: { text: "В работе", color: "#3b82f6", bg: "#eff6ff" },
  done: { text: "Завершён", color: "#9ca3af", bg: "#f9fafb" },
  cancelled: { text: "Отменён", color: "#ef4444", bg: "#fef2f2" },
  rejected: { text: "Отклонён", color: "#ef4444", bg: "#fef2f2" },
}

export const myOrdersStatusMap: Record<string, { text: string; color: string }> = {
  pending_moderation: { text: "На модерации", color: "#f59e0b" },
  open: { text: "Открыт", color: "#22c55e" },
  in_progress: { text: "В работе", color: "#3b82f6" },
  done: { text: "Завершён", color: "#9ca3af" },
  cancelled: { text: "Отменён", color: "#ef4444" },
  rejected: { text: "Отклонён", color: "#ef4444" },
}

export const myResponsesStatusMap: Record<string, { text: string; color: string }> = {
  open: { text: "Ожидание", color: "#f59e0b" },
  in_progress: { text: "В работе", color: "#22c55e" },
  done: { text: "Завершён", color: "#9ca3af" },
  cancelled: { text: "Отменён", color: "#ef4444" },
  rejected: { text: "Отклонён", color: "#ef4444" },
}

export const responseStatusMap: Record<string, { text: string; color: string; bg: string }> = {
  pending: { text: "Ожидает", color: "#f59e0b", bg: "#fffbeb" },
  accepted: { text: "Выбран", color: "#22c55e", bg: "#f0fdf4" },
  rejected: { text: "Отклонён", color: "#ef4444", bg: "#fef2f2" },
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru")
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} в ${formatTime(iso)}`
}

export function formatWhen(iso: string): string {
  const d = new Date(iso)
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dayDiff = Math.round((startOfDay(d) - startOfDay(new Date())) / 86400000)
  const time = formatTime(iso)
  if (dayDiff === 0) return `Сегодня в ${time}`
  if (dayDiff === 1) return `Завтра в ${time}`
  if (dayDiff === -1) return `Вчера в ${time}`
  return `${formatDate(iso)} в ${time}`
}

export function mapsUrl(cityName?: string | null, address?: string): string {
  const q = `${cityName ? cityName + ", " : ""}${address || ""}`
  return `https://yandex.ru/maps/?text=${encodeURIComponent(q)}&z=15`
}

export function rating(n?: number | null): string {
  return n != null ? n.toFixed(1) : "—"
}

export function shortAddress(cityName?: string | null, address?: string): string {
  return `${cityName ? cityName + ", " : ""}${address || ""}`
}

// Превращает ошибку API (строка detail или массив ошибок валидации FastAPI)
// в понятный для пользователя текст.
export function formatApiError(err: any): string {
  const data = err?.response?.data
  if (!data) return err?.message || "Ошибка соединения с сервером"

  const detail = data.detail

  // Массив ошибок валидации FastAPI: [{loc:[...], msg, type}]
  if (Array.isArray(detail)) {
    const parts = detail
      .map((d: any) => {
        const field = Array.isArray(d?.loc) ? d.loc.filter((x: any) => x !== "body").pop() : null
        const msg = d?.msg || "неверное значение"
        const fieldName: any = field
          ? {
              title: "Заголовок",
              description: "Описание",
              address: "Адрес",
              datetime: "Дата/время",
              budget: "Бюджет",
              workers_needed: "Кол-во рабочих",
              hourly_rate: "Ставка",
              hours: "Часы",
              city_id: "Город",
            }[String(field)] || String(field)
          : null
        return fieldName ? `${fieldName}: ${msg}` : msg
      })
      .slice(0, 3)
    return parts.length ? parts.join("; ") : "Ошибка валидации данных"
  }

  if (typeof detail === "string") return detail
  if (typeof data === "string") return data
  return "Ошибка при отправке запроса"
}
