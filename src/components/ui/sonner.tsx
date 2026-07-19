import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      offset={64}
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:w-[calc(100vw-32px)] group-[.toaster]:max-w-[420px] group-[.toaster]:px-4 group-[.toaster]:py-3",
          title: "group-[.toast]:text-sm group-[.toast]:font-semibold",
          description: "group-[.toast]:text-xs group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          success: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-primary",
          error: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-destructive",
          loading: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-primary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
