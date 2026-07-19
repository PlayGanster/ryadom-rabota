import { useState } from "react"
import { Phone, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"

export default function DevLoginFab() {
  const { loginWithPhone } = useAuth()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!phone.trim()) return
    setLoading(true)
    try {
      await loginWithPhone(phone)
      setOpen(false)
      setPhone("")
      toast.success("Вход выполнен")
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Пользователь не найден")
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg active:scale-95"
        aria-label="Вход по номеру"
      >
        <Phone className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вход по номеру</DialogTitle>
          </DialogHeader>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </DialogClose>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Номер телефона</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="+79990000000"
                autoFocus
              />
            </div>
            <Button className="w-full" onClick={submit} disabled={loading || !phone.trim()}>
              Войти
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
