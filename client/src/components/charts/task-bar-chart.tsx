"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface TaskChartProps {
  data: {
    todo: number;
    inProgress: number;
    completed: number;
    hold: number;
    review: number;
  };
}

export function TaskBarChart({ data }: TaskChartProps) {
  const chartData = [
    { status: "todo", count: data.todo, fill: "var(--color-todo)" },
    { status: "inProgress", count: data.inProgress, fill: "var(--color-inProgress)" },
    { status: "completed", count: data.completed, fill: "var(--color-completed)" },
    { status: "hold", count: data.hold, fill: "var(--color-hold)" },
    { status: "review", count: data.review, fill: "var(--color-review)" },
  ]

  const chartConfig = {
    count: {
      label: "Count",
    },
    todo: {
      label: "To Do",
      color: "hsl(var(--chart-1))",
    },
    inProgress: {
      label: "Progress",
      color: "hsl(var(--chart-2))",
    },
    completed: {
      label: "Completed",
      color: "hsl(var(--chart-3))",
    },
    hold: {
      label: "Hold",
      color: "hsl(var(--chart-4))",
    },
    review: {
      label: "Review",
      color: "hsl(var(--chart-5))",
    },
  } satisfies ChartConfig

  const totalTasks = Object.values(data).reduce((sum, count) => sum + count, 0)
  const completionRate = data.completed > 0 ? Math.round((data.completed / totalTasks) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Status Distribution</CardTitle>
        <CardDescription>Current Assignment Status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 20,
            }}
          >
            <YAxis
              dataKey="status"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) =>
                chartConfig[value as keyof typeof chartConfig]?.label
              }
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent className="dark:bg-gray-900 bg-gray-200" hideLabel />}
            />
            <Bar dataKey="count" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {completionRate}% task completion rate <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing {totalTasks} tasks across all statuses
        </div>
      </CardFooter>
    </Card>
  )
}
