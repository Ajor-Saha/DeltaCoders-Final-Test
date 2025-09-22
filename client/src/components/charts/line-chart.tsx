"use client"

import { useEffect, useState, useCallback } from "react"
import { TrendingUp, Loader2 } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Axios } from "@/config/axios"
import { env } from "@/config/env"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface SalesData {
  month: string;
  amount: number;
}

interface ChartResponse {
  data: SalesData[];
  totalSales: number;
  averageMonthlySales: number;
}

interface ApiResponse {
  success: boolean;
  data: ChartResponse;
  message: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Revenue: <span className="font-medium">{payload[0].payload.formattedAmount}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function ChartLineDots() {
  const [chartData, setChartData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    averageMonthlySales: 0,
    trend: 0
  });

  const fetchSalesData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await Axios.get<ApiResponse>(
        `${env.BACKEND_BASE_URL}/api/company/get-monthly-sales-data`
      );

      if (response.data.success) {
        const { data, totalSales, averageMonthlySales } = response.data.data;
        setChartData(data);
        
        // Calculate trend (percentage change from first to last month)
        const trend = data.length >= 2 
          ? ((data[data.length - 1].amount - data[0].amount) / data[0].amount) * 100 
          : 0;

        setMetrics({
          totalSales,
          averageMonthlySales,
          trend
        });
      } else {
        toast.error(response.data.message || "Failed to fetch sales data");
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
      toast.error("Failed to fetch sales data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare data with formatted amounts
  const formattedChartData = chartData.map(item => ({
    ...item,
    formattedAmount: formatCurrency(item.amount)
  }));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center min-h-[350px]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Sales</CardTitle>
        <CardDescription>Last 6 Months Revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
          <LineChart
              data={formattedChartData}
            margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
            }}
          >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false}
                stroke="var(--border)"
              />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
                tickFormatter={(value) => value.split(' ')[0].slice(0, 3)}
                stroke="var(--muted-foreground)"
            />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `$${value / 1000}K`}
                stroke="var(--muted-foreground)"
              />
              <Tooltip content={<CustomTooltip />} />
            <Line
                type="monotone"
                dataKey="amount"
                stroke="var(--primary)"
              strokeWidth={2}
              dot={{
                  fill: "var(--primary)",
                  strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                  stroke: "var(--primary)",
                  strokeWidth: 2,
              }}
            />
          </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 items-center font-medium">
          {metrics.trend >= 0 ? 'Trending up' : 'Trending down'} by {Math.abs(metrics.trend).toFixed(1)}% 
          <TrendingUp className={`h-4 w-4 ${metrics.trend >= 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
        </div>
        <div className="text-muted-foreground">
          Average monthly sales: {formatCurrency(metrics.averageMonthlySales)}
        </div>
      </CardFooter>
    </Card>
  )
}
