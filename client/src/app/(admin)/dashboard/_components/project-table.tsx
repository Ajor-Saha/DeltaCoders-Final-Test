"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Users, CheckSquare } from "lucide-react";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import { toast } from "sonner";

interface ProjectTableData {
  id: string;
  name: string;
  status: string;
  assignedEmployees: number;
  totalTasks: number;
}

export function ProjectTable() {
  const [projects, setProjects] = useState<ProjectTableData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/project/get-recent-projects`
      );

      if (response.data.success) {
        setProjects(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "to-do":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "hold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "review":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  console.log(projects);
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="py-2 text-base">Project Name</TableHead>
            <TableHead className="py-2 text-base">Status</TableHead>
            <TableHead className="text-center py-2 text-base">Employees</TableHead>
            <TableHead className="text-center py-2 text-base">Tasks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow 
              key={project.id} 
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <TableCell className="font-medium text-base py-2.5">{project.name}</TableCell>
              <TableCell className="py-2.5">
                <span
                  className={`px-2.5 py-1.5 rounded-full text-sm font-medium ${getStatusColor(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>
              </TableCell>
              <TableCell className="text-center py-2.5">
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-base font-medium">
                    {project.assignedEmployees || 0}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center py-2.5">
                <div className="flex items-center justify-center gap-2">
                  <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-base font-medium">
                    {project.totalTasks || 0}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {projects.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                No projects found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 