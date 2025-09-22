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
import { Loader2, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import { toast } from "sonner";

interface EmployeeTableData {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

export function EmployeeTable() {
  const [employees, setEmployees] = useState<EmployeeTableData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/company/get-recent-employees`
      );

      if (response.data.success) {
        setEmployees(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const getRoleBadgeColor = useCallback((role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "senior_employee":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "assigned_employee":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  }, []);

  const formatRole = useCallback((role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="py-2 text-base">Employee</TableHead>
            <TableHead className="py-2 text-base">Email</TableHead>
            <TableHead className="text-center py-2 text-base">Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow 
              key={employee.id} 
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <TableCell className="py-2.5">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={employee.avatar || undefined} />
                    <AvatarFallback>{employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{employee.name}</span>
                </div>
              </TableCell>
              <TableCell className="py-2.5">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {employee.email}
                </div>
              </TableCell>
              <TableCell className="text-center py-2.5">
                <Badge variant="secondary" className={`${getRoleBadgeColor(employee.role)} text-xs px-2 py-0.5`}>
                  {formatRole(employee.role)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {employees.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                No employees found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 