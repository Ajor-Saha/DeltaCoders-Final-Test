"use client";


import { usePathname } from "next/navigation";
import {  SidebarTrigger } from "../ui/sidebar";
import { Separator } from "../ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import React from "react";
import ThemeToggle from "../header/ThemeToggle";

// Breadcrumb Mapping Based on Sidebar Data
const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/project/add-project": "Project > Add Project",
  "/project/all-project": "Project > All Project",
  "/project/manage-project": "Project > Manage Project",
  "/settings/account-manage": "Settings > Account Manage",
  "/settings/company-manage": "Settings > Company Manage",
  "/employee/add-employee": "Employee > Add Employee",
  "/employee/show-employees": "Employee > Show Employees",
};
export function BreadcrumbComponent() {
  const pathname = usePathname();
  const breadcrumbTitle = breadcrumbMap[pathname] || "Dashboard";

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 ">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbTitle.split(" > ").map((title, index, array) => (
            <React.Fragment key={title}>
              <BreadcrumbItem>
                {index === array.length - 1 ? (
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href="#">{title}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < array.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <span className="ml-auto">
      <ThemeToggle />
      </span>
     
    </header>
  );
}