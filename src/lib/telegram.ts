import WebApp from "@twa-dev/sdk"

let initialized = false

export function initTelegram(): void {
  if (initialized) return
  initialized = true
  try {
    WebApp.ready()
    WebApp.expand()
    WebApp.setHeaderColor?.("#f08804")
    WebApp.setBackgroundColor?.("#f0f2f5")
  } catch {
    // ignore
  }
}

export function isTelegram(): boolean {
  return !!(window as any).Telegram?.WebApp?.initData
}

export function getInitData(): string {
  return (window as any).Telegram?.WebApp?.initData || ""
}

export function hapticImpact(style: "light" | "medium" | "heavy" = "light"): void {
  try {
    ;(window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred(style)
  } catch {
    // ignore
  }
}

export function hapticNotify(type: "error" | "success" | "warning" = "success"): void {
  try {
    ;(window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type)
  } catch {
    // ignore
  }
}

export function openLink(url: string): void {
  try {
    ;(window as any).Telegram?.WebApp?.openLink?.(url)
  } catch {
    window.open(url, "_blank")
  }
}
