"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

const data = [
  { name: "Today", value: 274, color: "#7C5CFC" },
  { name: "Remaining", value: 2026, color: "#6AD2E0" },
]

export function UnitSoldChart() {
  return (
    <div className="h-[300px] w-full flex flex-col items-center justify-center">
      <div className="text-center mb-4">
        <div className="text-lg font-medium">Total</div>
        <div className="text-3xl font-bold">2574</div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value, entry, index) => {
              return index === 0 ? `Today ${data[0].value}` : `Max: 2300`
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

