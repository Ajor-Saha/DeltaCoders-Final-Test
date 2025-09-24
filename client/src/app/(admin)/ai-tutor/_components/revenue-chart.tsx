"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { name: "Jan", revenue: 5000, costs: 3000, percentage: "45%" },
  { name: "Feb", revenue: 5500, costs: 3200, percentage: "32%" },
  { name: "Mar", revenue: 6000, costs: 3800, percentage: "49%" },
  { name: "Apr", revenue: 6200, costs: 3700, percentage: "47%" },
  { name: "May", revenue: 6100, costs: 3400, percentage: "16%" },
  { name: "Jun", revenue: 6800, costs: 4000, percentage: "35%" },
  { name: "Jul", revenue: 7200, costs: 4200, percentage: "40%" },
  { name: "Aug", revenue: 7500, costs: 4800, percentage: "32%" },
  { name: "Sep", revenue: 6500, costs: 3800, percentage: "18%" },
  { name: "Oct", revenue: 7800, costs: 4500, percentage: "47%" },
  { name: "Nov", revenue: 8200, costs: 4800, percentage: "46%" },
  { name: "Dec", revenue: 8500, costs: 5000, percentage: "63%" },
]

export function RevenueChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 40,
          }}
          barSize={20}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip formatter={(value) => [`$${value}`, ""]} labelFormatter={(label) => `Month: ${label}`} />
          <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
          <Bar dataKey="revenue" name="Revenue" stackId="a" fill="#6AD2E0" radius={[4, 4, 0, 0]} />
          <Bar dataKey="costs" name="Costs" stackId="a" fill="#7C5CFC" radius={[0, 0, 4, 4]} />
          <text x="50%" y="100%" dy={20} textAnchor="middle" fill="#666" fontSize={12}>
            {data.map((entry, index) => (
              <tspan key={index} x={index * 60 + 40} dy="0">
                {entry.percentage}
              </tspan>
            ))}
          </text>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

