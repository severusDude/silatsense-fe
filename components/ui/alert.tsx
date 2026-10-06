import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-x-3 gap-y-1 rounded-2xl border px-6 py-6 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*5)_1fr] [&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-border",
        destructive:
          "bg-accent text-destructive border-destructive/30 *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-destructive",
        success:
          "bg-success text-success-foreground border-success-border *:data-[slot=alert-description]:opacity-90 [&>svg]:text-success-foreground",
        warning:
          "bg-warning text-warning-foreground border-warning-border *:data-[slot=alert-description]:opacity-90 [&>svg]:text-warning-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role="alert"
      data-slot="alert"
      data-variant={variant}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-heading text-sm font-bold tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-xs",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, alertVariants }
