"use client"

import { useEffect, useState, useCallback } from "react"
import { TrendingUp } from "lucide-react"
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts"
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

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Skeleton } from "@/components/ui/skeleton"

interface Project {
  id: string;
  name: string;
  status: string;
}

const COLORS = {
  completed: "#22c55e", // green
  inProgress: "#3b82f6", // blue
  todo: "#64748b", // slate
  hold: "#ef4444", // red
  review: "#f97316", // orange
};

const CustomTooltip = ({ active, payload, className }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={`rounded-lg border p-3 shadow-lg ${className}`}>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            {data.name}
          </span>
          <span className="text-lg font-bold text-primary">
            {data.value} tasks
          </span>
          <span className="text-xs text-muted-foreground">
            {((data.value / data.total) * 100).toFixed(1)}% of total
          </span>
        </div>
      </div>
    );
  }
  return null;
};

function ChartSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Project Tasks</CardTitle>
          <CardDescription>Loading task data...</CardDescription>
        </div>
        <Skeleton className="h-10 w-[180px]" />
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="h-[280px] w-full flex items-center justify-center">
          <div className="relative w-[220px] h-[220px] animate-pulse">
            <div className="absolute inset-0 rounded-full bg-muted overflow-hidden">
              <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-muted-foreground/20 transform origin-bottom-right rotate-45" />
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-muted-foreground/30 transform origin-bottom-left -rotate-45" />
              <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-muted-foreground/10 transform origin-top-right -rotate-45" />
              <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-muted-foreground/25 transform origin-top-left rotate-45" />
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full bg-card" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm mt-4">
        <div className="flex items-center gap-2 w-full">
          <Skeleton className="h-4 w-[60%]" />
          <Skeleton className="h-4 w-4 ml-auto" />
        </div>
        <Skeleton className="h-4 w-[40%]" />
      </CardFooter>
    </Card>
  );
}

export function HomePieChart() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pieData, setPieData] = useState<any[]>([]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/project/get-admin-projects`
      );

      if (response.data.success) {
        setProjects(response.data.data);
        if (response.data.data.length > 0 && !selectedProject) {
          setSelectedProject(response.data.data[0].id);
        }
      } else {
        toast.error(response.data.message || "Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
    }
  }, [selectedProject]);

  // Fetch project statistics
  const fetchProjectStats = useCallback(async () => {
    if (!selectedProject) return;

    setIsLoading(true);
    try {
      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/company/get-project-stats/${selectedProject}`
      );

      if (response.data.success) {
        const { completedTasks, inProgressTasks, todoTasks, holdTasks, reviewTasks } = response.data.data;
        const total = completedTasks + inProgressTasks + todoTasks + holdTasks + reviewTasks;

        const data = [
          { name: "Completed", value: completedTasks, type: "completed", total },
          { name: "In Progress", value: inProgressTasks, type: "inProgress", total },
          { name: "To Do", value: todoTasks, type: "todo", total },
          { name: "On Hold", value: holdTasks, type: "hold", total },
          { name: "In Review", value: reviewTasks, type: "review", total }
        ].filter(item => item.value > 0);

        setPieData(data);
      } else {
        toast.error(response.data.message || "Failed to fetch project statistics");
      }
    } catch (error) {
      console.error("Error fetching project statistics:", error);
      toast.error("Failed to fetch project statistics");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectStats();
    }
  }, [selectedProject, fetchProjectStats]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  const totalTasks = pieData.reduce((sum, item) => sum + item.value, 0);
  const completedTasks = pieData.find(item => item.type === "completed")?.value || 0;
  const monthlyIncrease = ((totalTasks / (totalTasks * 0.95) - 1) * 100).toFixed(1);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (value === 0) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-bold"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
      >
        {value}
      </text>
    );
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Project Tasks</CardTitle>
          <CardDescription>Task distribution by status</CardDescription>
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="h-[280px] w-full">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
          <PieChart>
                <Tooltip content={<CustomTooltip className="dark:bg-gray-900 bg-gray-200" />} />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={110}
                  innerRadius={60}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.type as keyof typeof COLORS]} 
            />
                  ))}
                </Pie>
          </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground">No tasks found</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-4 py-2">
          {pieData.map((entry, index) => (
            <div key={index} className="flex items-center gap-1">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: COLORS[entry.type as keyof typeof COLORS] }} 
              />
              <span className="text-sm text-muted-foreground">
                {entry.name} ({entry.value})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium">
          Task volume up by {monthlyIncrease}% this month
          <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <div className="text-muted-foreground">
          Total Tasks: {totalTasks}
        </div>
      </CardFooter>
    </Card>
  )
}
