import { ArrowLeft, ChevronDown, MoreVertical } from "lucide-react"

export function TmaHeader({ onBack }: { onBack?: () => void }) {
  return (
    <header className="relative flex h-12 flex-shrink-0 items-center border-b border-border bg-background px-2">
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="Назад"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground active:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : (
        <span className="h-9 w-9" />
      )}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-bold text-foreground">
        РядомРабота
      </span>
      <button
        aria-label="Меню"
        title="Меню Telegram"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
    </header>
  )
}

export function TmaFooter() {
  return (
    <footer className="flex h-7 flex-shrink-0 items-center justify-between border-t border-border bg-[#f0f2f5] px-3">
      <button
        aria-label="Свернуть"
        title="Свернуть"
        className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground active:bg-border"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <span className="text-[11px] text-muted-foreground">Telegram · Mini App</span>
    </footer>
  )
}
