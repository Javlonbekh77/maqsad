import { cn } from "@/lib/utils"
import { Target } from "lucide-react"

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Target className="h-6 w-6" />
      <span className="text-xl font-bold font-display text-inherit">
        MaqsadM
      </span>
    </div>
  )
}
