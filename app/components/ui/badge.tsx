import { cn } from "@/lib/utils"
import { HTMLAttributes } from "react"

export function Badge({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800",
        className
      )}
      {...props}
    />
  )
}
