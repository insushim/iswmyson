import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-blue-600 text-white",
        secondary: "border-transparent bg-gray-200 text-gray-800",
        destructive: "border-transparent bg-red-600 text-white",
        outline: "text-gray-800 border-gray-300",
        success: "border-transparent bg-green-500 text-white",
        warning: "border-transparent bg-amber-500 text-white",
        pending: "border-transparent bg-yellow-100 text-yellow-800",
        mark: "border-transparent bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900",
        judge: "border-transparent bg-purple-600 text-white",
        objection: "border-transparent bg-green-500 text-white",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
