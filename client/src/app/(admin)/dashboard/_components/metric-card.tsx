// import { Card, CardContent } from "@/components/ui/card"
// import { ArrowDown, ArrowUp } from "lucide-react"

// interface MetricCardProps {
//   title: string
//   value: string
//   change: number
//   changeValue: string
//   changeLabel: string
//   trend: "up" | "down"
//   icon: string
// }

// export function MetricCard({ title, value, change, changeValue, changeLabel, trend, icon }: MetricCardProps) {
//   return (
//     <Card>
//       <CardContent className="p-6">
//         <div className="flex items-center gap-2 mb-2">
//           <span className="text-sm text-muted-foreground">{title}</span>
//         </div>
//         <div className="text-3xl font-bold">{value}</div>
//         <div className="flex items-center mt-2">
//           <div className={`flex items-center ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
//             {trend === "up" ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
//             <span className="font-medium">{Math.abs(change)}%</span>
//           </div>
//           <span className="text-muted-foreground text-sm ml-2">
//             {changeValue} {changeLabel}
//           </span>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

// import { Card, CardContent } from "@/components/ui/card"
// import { ArrowDown, ArrowUp } from "lucide-react"

// interface MetricCardProps {
//   title: string
//   value: string
//   change: number
//   changeValue: string
//   changeLabel: string
//   trend: "up" | "down"
//   icon: string
// }

// export function MetricCard({
//   title,
//   value,
//   change,
//   changeValue,
//   changeLabel,
//   trend,
//   icon
// }: MetricCardProps) {
//   return (
//     <Card>
//       <CardContent className="p-6">
//         <div className="flex items-center gap-2 mb-2">
//           <span className="text-xl">{icon}</span>
//           <span className="text-sm text-muted-foreground">{title}</span>
//         </div>
//         <div className="text-3xl font-bold">{value}</div>
//         <div className="flex items-center mt-2">
//           <div className={`flex items-center ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
//             {trend === "up" ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
//             <span className="font-medium">{Math.abs(change)}%</span>
//           </div>
//           <span className="text-muted-foreground text-sm ml-2">
//             {changeValue} {changeLabel}
//           </span>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

import { Card, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  change: number
  changeValue: string
  changeLabel: string
  trend: "up" | "down"
  icon: string
}

export function MetricCard({
  title,
  value,
  change,
  changeValue,
  changeLabel,
  trend,
  icon
}: MetricCardProps) {
  return (
    <Card className="bg-background shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted text-2xl rounded-full p-2 flex items-center justify-center w-10 h-10">
              {icon}
            </div>
            <h3 className="text-lg font-medium text-muted-foreground">{title}</h3>
          </div>
        </div>

        <div className="text-4xl font-bold text-foreground">{value}</div>

        <div className="flex items-center mt-3 text-sm">
          <div className={`flex items-center font-medium ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
            {trend === "up" ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
            {Math.abs(change)}%
          </div>
          <span className="text-muted-foreground ml-2">{changeValue} {changeLabel}</span>
        </div>
      </CardContent>
    </Card>
  )
}
